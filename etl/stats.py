from pymongo import MongoClient
from connectors.base import MONGO_URI

col = MongoClient(MONGO_URI)["jobscope"]["raw_postings"]
for row in col.aggregate([{"$group": {"_id": "$source", "n": {"$sum": 1}}}]):
    print(row["_id"], row["n"])
print("total", col.count_documents({}))
