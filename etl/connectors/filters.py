import re
import unicodedata
from urllib.parse import unquote

STEMS = ["informatique", "develop", "devops", "data", "software", "logiciel",
         "reseau", "systeme", "securite", "cyber", "cloud", "fullstack",
         "full stack", "frontend", "backend", "web", "mobile", "digital",
         "infrastructure", "helpdesk", "help desk", "service desk",
         "testeur", "scrum", "programm", "telecom", "intelligence artificielle",
         "product owner", "technico", "fonctionnel", "tech lead", "analyst", "gsm"]
WORDS = ["it", "ia", "ai", "qa", "sql", "erp", "sage", "java", "python",
         "php", "net", "react", "angular", "sap", "dba", "ux", "ui"]
EXCLUDE = ["recrutement", "commercial", "vendeur", "televendeur", "vente",
           "marketing", "mkt", "business developer", "business manager",
           "banking", "chantier", "adjoint"]

STEM_RE = re.compile("|".join(STEMS))
WORD_RE = re.compile(r"\b(" + "|".join(WORDS) + r")\b")
EXCL_RE = re.compile("|".join(EXCLUDE))


def normalize(text):
    text = unquote(text).lower().replace("-", " ").replace("_", " ")
    return "".join(c for c in unicodedata.normalize("NFD", text)
                   if unicodedata.category(c) != "Mn")


def is_it(text):
    t = normalize(text)
    if EXCL_RE.search(t):
        return False
    return bool(STEM_RE.search(t) or WORD_RE.search(t))