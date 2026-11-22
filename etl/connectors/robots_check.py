import sys
import requests
from urllib.robotparser import RobotFileParser
from connectors.base import HEADERS


def allowed(url, agent="jobscope-tn-student-project"):
    root = "/".join(url.split("/")[:3])
    r = requests.get(root + "/robots.txt", headers=HEADERS, timeout=15)
    print("robots.txt status:", r.status_code)
    if r.status_code in (401, 403):
        return False  # genuinely refused, treat as not allowed
    rp = RobotFileParser()
    rp.parse(r.text.splitlines())
    return rp.can_fetch(agent, url)


if __name__ == "__main__":
    print(allowed(sys.argv[1]))