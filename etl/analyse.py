from pymongo import MongoClient
from connectors.base import MONGO_URI

col = MongoClient(MONGO_URI)["jobscope"]["postings"]


def show(title, pipeline):
    print(f"\n=== {title} ===")
    for r in col.aggregate(pipeline):
        print(f"{str(r['_id']):35} {r['n']}")


show("Postings per source", [
    {"$group": {"_id": "$source", "n": {"$sum": 1}}},
])

show("Top 15 skills", [
    {"$unwind": "$skills"},
    {"$group": {"_id": "$skills", "n": {"$sum": 1}}},
    {"$sort": {"n": -1}}, {"$limit": 15},
])

show("Postings per city", [
    {"$addFields": {"city": {"$arrayElemAt": [{"$split": ["$location", ","]}, 0]}}},
    {"$group": {"_id": "$city", "n": {"$sum": 1}}},
    {"$sort": {"n": -1}}, {"$limit": 10},
])

show("Contract types", [
    {"$group": {"_id": "$contract_type", "n": {"$sum": 1}}},
    {"$sort": {"n": -1}},
])

print("\n=== Titles with no skills detected (use these to extend skills.json) ===")
for d in col.find({"skills": []}, {"title": 1, "source": 1}):
    print(f"[{d['source']}] {d['title']}")