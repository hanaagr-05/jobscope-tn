import sys
from connectors.generic import GenericConnector
from connectors.sites import SITES

wanted = sys.argv[1:] or list(SITES)
for name in wanted:
    cfg = SITES[name]
    n = GenericConnector(name, **cfg).run(pages=5, max_jobs=100)
    print(f"== {name}: {n} new postings\n")