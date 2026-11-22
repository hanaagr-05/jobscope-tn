from neo4j import GraphDatabase
from pymongo import MongoClient
from connectors.base import MONGO_URI

col = MongoClient(MONGO_URI)["jobscope"]["postings"]
driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "jobscope123"))

CITY_FIX = {"Technopole El Gazala": "Technopôle El Ghazala"}

rows = []
for d in col.find({}):
    city = (d["location"].split(",")[0].strip() if d.get("location") else "")
    rows.append({
        "url": d["url"], "title": d["title"], "source": d["source"],
        "date": d["date_posted"], "contract": d["contract_type"],
        "company": d["company"] or "Unknown",
        "city": CITY_FIX.get(city, city) or "Unknown",
        "skills": d["skills"],
    })

QUERY = """
UNWIND $rows AS r
MERGE (p:Posting {url: r.url})
  SET p.title = r.title, p.source = r.source, p.date = r.date, p.contract = r.contract
MERGE (c:Company {name: r.company})
MERGE (c)-[:POSTS]->(p)
MERGE (ci:City {name: r.city})
MERGE (p)-[:LOCATED_IN]->(ci)
WITH p, r
UNWIND r.skills AS s
MERGE (sk:Skill {name: s})
MERGE (p)-[:REQUIRES]->(sk)
"""

with driver.session() as session:
    session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (p:Posting) REQUIRE p.url IS UNIQUE")
    session.run(QUERY, rows=rows)
    n = session.run("MATCH (n) RETURN count(n) AS n").single()["n"]
print(f"Loaded {len(rows)} postings | {n} nodes in Neo4j")
driver.close()