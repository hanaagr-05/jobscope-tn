import sys, re
from collections import Counter
import requests
from bs4 import BeautifulSoup
from connectors.base import HEADERS

url = sys.argv[1]
soup = BeautifulSoup(requests.get(url, headers=HEADERS, timeout=15).text, "html.parser")
patterns = Counter()
examples = {}
for a in soup.find_all("a", href=True):
    p = re.sub(r"\d+", "N", a["href"].split("?")[0])
    patterns[p] += 1
    examples.setdefault(p, a["href"])
for p, n in patterns.most_common(15):
    print(n, p, "  e.g.", examples[p])