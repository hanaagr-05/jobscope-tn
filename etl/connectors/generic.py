import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from connectors.base import BaseConnector


class GenericConnector(BaseConnector):
    def __init__(self, source, list_url, link_pattern, **kw):
        super().__init__(**kw)
        self.source = source
        self.list_url = list_url
        self.link_re = re.compile(link_pattern)

    def collect_links(self, page):
        url = self.list_url.format(page=page)
        soup = BeautifulSoup(self.fetch(url), "html.parser")
        links = set()
        for a in soup.find_all("a", href=True):
            full = urljoin(url, a["href"]).split("#")[0].split("?")[0]
            if self.link_re.search(full):
                links.add(full)
        return links

    def run(self, pages=5, max_jobs=60):
        seen, saved = set(), 0
        for page in range(1, pages + 1):
            links = self.collect_links(page) - seen
            if not links:
                print(f"[{self.source}] no new links on page {page}, stopping")
                break
            for url in sorted(links):
                if saved >= max_jobs:
                    return saved
                if self.raw.find_one({"source": self.source, "url": url}):
                    continue  # already stored, skip re-download
                try:
                    self.save_raw(url, self.fetch(url))
                    saved += 1
                    print(f"[{self.source}] saved {url}")
                except Exception as e:
                    print(f"[{self.source}] failed {url}: {e}")
            seen |= links
        return saved