import json
import html
import re
from collections import Counter
from pathlib import Path

from bs4 import BeautifulSoup
from pymongo import MongoClient

from connectors.base import MONGO_URI
from connectors.filters import is_it

db = MongoClient(MONGO_URI)["jobscope"]
raw, out = db["raw_postings"], db["postings"]
out.create_index("url", unique=True)

SKILLS = json.loads(
    (Path(__file__).parent.parent / "data" / "skills.json").read_text("utf-8")
)
SKILL_RES = [
    (s, re.compile(r"(?<![\w+#.])" + re.escape(s) + r"(?![\w+#])", re.I))
    for s in SKILLS
]


def clean_text(s):
    if not s:
        return ""
    if "<" in s:
        s = BeautifulSoup(s, "html.parser").get_text("\n")
    s = html.unescape(s).replace("\xa0", " ")
    s = re.sub(r"[ \t]+", " ", s)
    return re.sub(r"\n\s*\n+", "\n\n", s).strip()


def find_jobposting(soup):
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or tag.get_text())
        except ValueError:
            continue
        items = data if isinstance(data, list) else data.get("@graph", [data])
        for it in items:
            if isinstance(it, dict) and it.get("@type") == "JobPosting":
                return it
    return {}


def name_of(v):
    if isinstance(v, dict):
        return v.get("name", "")
    return v or ""


def location_of(jp):
    loc = jp.get("jobLocation")
    if isinstance(loc, list):
        loc = loc[0] if loc else None
    if not isinstance(loc, dict):
        return loc or ""
    addr = loc.get("address", loc)
    if isinstance(addr, dict):
        parts = [addr.get("addressLocality"), addr.get("addressRegion")]
        return ", ".join(p for p in parts if p)
    return addr or ""


def extract_skills(text):
    return [s for s, rx in SKILL_RES if rx.search(text)]


def fix_city(loc):  # NEW: merge spelling variants
    return str(loc or "").replace("Gazala", "Ghazala").replace("Technopole", "Technopôle")


def parse(d):
    soup = BeautifulSoup(d["html"], "html.parser")
    jp = find_jobposting(soup)
    h1 = soup.find("h1")
    author = soup.find("meta", attrs={"name": "author"})
    contract = jp.get("employmentType", "")
    if isinstance(contract, list):
        contract = ", ".join(contract)
    desc = clean_text(jp.get("description", ""))
    title = jp.get("title") or (h1.get_text(" ", strip=True) if h1 else "")
    return {
        "source": d["source"],
        "url": d["url"],
        "title": title.strip(),
        "company": name_of(jp.get("hiringOrganization"))
        or (author.get("content", "") if author else ""),
        "location": fix_city(location_of(jp)),  # CHANGED: city fix applied
        "date_posted": (jp.get("datePosted") or "")[:10],
        "contract_type": contract,
        "description": desc,
        "skills": extract_skills(title + "\n" + desc),
        "raw_id": d["_id"],
    }


missing = Counter()
n = skipped = dups = 0
seen = set()  # NEW: (title, company) pairs already kept
for d in raw.find({}):
    if not d.get("html"):
        continue
    doc = parse(d)
    if not is_it(doc["url"] + " " + doc["title"]):
        out.delete_one({"url": doc["url"]})  # removes it if an earlier run stored it
        skipped += 1
        continue
    key = (doc["title"].lower(), (doc["company"] or "").lower())  # NEW
    if key in seen:
        out.delete_one({"url": doc["url"]})
        dups += 1
        continue
    seen.add(key)
    out.update_one({"url": doc["url"]}, {"$set": doc}, upsert=True)
    n += 1
    for k in ("title", "company", "location", "date_posted", "contract_type", "description"):
        if not doc[k]:
            missing[(doc["source"], k)] += 1
    if not doc["skills"]:
        missing[(doc["source"], "skills")] += 1

print(f"Parsed {n} IT | skipped {skipped} non-IT | duplicates {dups} | postings total: {out.count_documents({})}")
print("Empty fields:", dict(missing) or "none")