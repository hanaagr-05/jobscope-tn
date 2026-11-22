import mongomock, responses
from connectors.generic import GenericConnector

LIST_HTML = '<a href="/offres-emploi/123-dev-python">Dev</a>'
JOB_HTML = "<html><h1>Dev Python</h1></html>"


def make():
    col = mongomock.MongoClient().db.raw
    c = GenericConnector(
        "keejob",
        list_url="https://www.keejob.com/offres-emploi/?page={page}",
        link_pattern=r"/offres-emploi/\d+",
        collection=col,
        delay=0,
    )
    return col, c


def mock_site():
    responses.add(responses.GET, "https://www.keejob.com/offres-emploi/?page=1", body=LIST_HTML)
    responses.add(responses.GET, "https://www.keejob.com/offres-emploi/123-dev-python", body=JOB_HTML)


@responses.activate
def test_saves_raw_posting():
    mock_site()
    col, c = make()
    c.run(pages=1)
    doc = col.find_one({"source": "keejob"})
    assert doc["url"].endswith("123-dev-python")
    assert "Dev Python" in doc["html"]
    assert len(doc["hash"]) == 64


@responses.activate
def test_rerun_does_not_duplicate():
    mock_site()
    col, c = make()
    c.run(pages=1)
    c.run(pages=1)
    assert col.count_documents({}) == 1