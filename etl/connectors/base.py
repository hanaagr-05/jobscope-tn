import time, hashlib
from datetime import datetime, timezone
import requests
from pymongo import MongoClient
import os
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27018")
HEADERS = {"User-Agent": "jobscope-tn-student-project/0.1 (contact: hanaagrebi48@gmail.com)"}


class BaseConnector:
    source = "unknown"

    def __init__(self, collection=None, delay=2):
        self.delay = delay
        if collection is None:
            collection = MongoClient(MONGO_URI)["jobscope"]["raw_postings"]
        self.raw = collection
        self.raw.create_index([("source", 1), ("url", 1)], unique=True)

    def fetch(self, url):
        time.sleep(self.delay)  # be polite
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        return r.text

    def save_raw(self, url, html):
        doc = {
            "source": self.source,
            "url": url,
            "html": html,
            "hash": hashlib.sha256(html.encode()).hexdigest(),
            "fetched_at": datetime.now(timezone.utc),
        }
        self.raw.update_one(
            {"source": self.source, "url": url}, {"$set": doc}, upsert=True
        )