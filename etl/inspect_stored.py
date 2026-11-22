import sys, json
from bs4 import BeautifulSoup
from pymongo import MongoClient
from connectors.base import MONGO_URI

source = sys.argv[1]
col = MongoClient(MONGO_URI)["jobscope"]["raw_postings"]
d = col.find_one({"source": source})
soup = BeautifulSoup(d["html"], "html.parser")

print("URL:", d["url"])
print("h1:", [h.get_text(" ", strip=True) for h in soup.find_all("h1")])
print("title tag:", soup.title.string if soup.title else None)

ld = soup.find_all("script", type="application/ld+json")
print("JSON-LD blocks:", len(ld))
for s in ld:
    print(s.get_text()[:1500])

print("\n--- meta tags ---")
for m in soup.find_all("meta"):
    if m.get("property") or m.get("name"):
        print(m.get("property") or m.get("name"), "=", (m.get("content") or "")[:100])