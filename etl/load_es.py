import hashlib
from elasticsearch import Elasticsearch, helpers
from pymongo import MongoClient
from connectors.base import MONGO_URI

col = MongoClient(MONGO_URI)["jobscope"]["postings"]
es = Elasticsearch("http://localhost:9200")

if not es.indices.exists(index="postings"):
    es.indices.create(index="postings", mappings={"properties": {
        "title": {"type": "text"}, "description": {"type": "text"},
        "company": {"type": "keyword"}, "location": {"type": "keyword"},
        "skills": {"type": "keyword"}, "source": {"type": "keyword"},
        "date_posted": {"type": "date", "ignore_malformed": True},
    }})

def actions():
    for d in col.find({}):
        _id = hashlib.md5(d["url"].encode()).hexdigest()
        doc = {k: v for k, v in d.items() if k not in ("_id", "raw_id")}
        yield {"_index": "postings", "_id": _id, "_source": doc}

ok, _ = helpers.bulk(es, actions())
print(f"Indexed {ok} postings in Elasticsearch")