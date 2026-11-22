package tn.jobscope;

import java.util.*;
import org.bson.Document;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Session;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class DataService {
    private final MongoTemplate mongo;
    private final Driver neo4j;
    private final RestClient es;

    public DataService(MongoTemplate mongo, Driver neo4j, @Value("${es.url}") String esUrl) {
        this.mongo = mongo;
        this.neo4j = neo4j;
        this.es = RestClient.create(esUrl);
    }

    @Cacheable(value = "search", key = "#q + '|' + #skill")
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> search(String q, String skill) {
        List<Object> must = new ArrayList<>();
        if (!q.isBlank()) {
            must.add(Map.of("multi_match", Map.of(
                "query", q, "fields", List.of("title^3", "description", "skills^2", "company"))));
        } else {
            must.add(Map.of("match_all", Map.of()));
        }
        List<Object> filter = new ArrayList<>();
        if (!skill.isBlank()) filter.add(Map.of("term", Map.of("skills", skill)));
        Map<String, Object> body = Map.of(
            "size", 20,
            "_source", Map.of("excludes", List.of("description")),
            "query", Map.of("bool", Map.of("must", must, "filter", filter)));

        Map<String, Object> res = es.post().uri("/postings/_search")
            .header("Content-Type", "application/json").body(body)
            .retrieve().body(Map.class);
        List<Map<String, Object>> out = new ArrayList<>();
        List<Map<String, Object>> hits = (List<Map<String, Object>>) ((Map<String, Object>) res.get("hits")).get("hits");
        for (Map<String, Object> h : hits) {
            Map<String, Object> src = new HashMap<>((Map<String, Object>) h.get("_source"));
            src.put("score", h.get("_score"));
            out.add(src);
        }
        return out;
    }

    @Cacheable("related")
    public List<Map<String, Object>> related(String skill) {
        String cypher = """
            MATCH (s:Skill {name:$name})<-[:REQUIRES]-(p:Posting)-[:REQUIRES]->(o:Skill)
            WHERE o <> s
            RETURN o.name AS skill, count(p) AS n
            ORDER BY n DESC LIMIT 10""";
        try (Session session = neo4j.session()) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Record r : session.run(cypher, Map.of("name", skill)).list()) {
                out.add(new HashMap<>(r.asMap()));
            }
            return out;
        }
    }

    @Cacheable(value = "graph", key = "#skill")
    public Map<String, Object> graph(String skill) {
        String cypher = """
            MATCH (p:Posting)-[:REQUIRES]->(s:Skill)
            WHERE $skill = '' OR EXISTS { MATCH (p)-[:REQUIRES]->(:Skill {name:$skill}) }
            RETURN p.url AS url, p.title AS title, p.source AS source, s.name AS skill
            LIMIT 600""";
        Map<String, Map<String, Object>> nodes = new LinkedHashMap<>();
        List<Map<String, Object>> links = new ArrayList<>();
        try (Session session = neo4j.session()) {
            for (Record r : session.run(cypher, Map.of("skill", skill)).list()) {
                String url = r.get("url").asString("");
                String name = r.get("skill").asString("");
                String pid = "p:" + url;
                String sid = "s:" + name;
                if (!nodes.containsKey(pid)) {
                    Map<String, Object> n = new HashMap<>();
                    n.put("id", pid);
                    n.put("type", "job");
                    n.put("label", r.get("title").asString(""));
                    n.put("url", url);
                    n.put("source", r.get("source").asString(""));
                    nodes.put(pid, n);
                }
                if (!nodes.containsKey(sid)) {
                    Map<String, Object> n = new HashMap<>();
                    n.put("id", sid);
                    n.put("type", "skill");
                    n.put("label", name);
                    nodes.put(sid, n);
                }
                Map<String, Object> l = new HashMap<>();
                l.put("source", pid);
                l.put("target", sid);
                links.add(l);
            }
        }
        Map<String, Object> out = new HashMap<>();
        out.put("nodes", new ArrayList<>(nodes.values()));
        out.put("links", links);
        return out;
    }

    @Cacheable("jobs")
    public List<Map<String, Object>> jobs() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Document d : mongo.getCollection("postings").find()
                .sort(new Document("date_posted", -1)).limit(300)) {
            d.remove("_id");
            d.remove("raw_id");
            String desc = d.getString("description");
            if (desc != null && desc.length() > 600) d.put("description", desc.substring(0, 600) + "…");
            out.add(new HashMap<>(d));
        }
        return out;
    }

    @Cacheable("stats")
    public Map<String, Object> stats() {
        var col = mongo.getCollection("postings");
        Map<String, Object> out = new HashMap<>();
        out.put("total", col.countDocuments());
        out.put("topSkills", agg(col, List.of(
            new Document("$unwind", "$skills"),
            new Document("$group", new Document("_id", "$skills").append("n", new Document("$sum", 1))),
            new Document("$sort", new Document("n", -1)),
            new Document("$limit", 15))));
        out.put("bySource", agg(col, List.of(
            new Document("$group", new Document("_id", "$source").append("n", new Document("$sum", 1))))));
        out.put("byCity", agg(col, List.of(
            new Document("$addFields", new Document("city",
                new Document("$arrayElemAt", List.of(new Document("$split", List.of("$location", ",")), 0)))),
            new Document("$group", new Document("_id", "$city").append("n", new Document("$sum", 1))),
            new Document("$sort", new Document("n", -1)),
            new Document("$limit", 10))));
        return out;
    }

    private List<Map<String, Object>> agg(com.mongodb.client.MongoCollection<Document> col, List<Document> pipeline) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Document d : col.aggregate(pipeline)) {
            out.add(new HashMap<>(Map.of("name", String.valueOf(d.get("_id")), "n", d.get("n"))));
        }
        return out;
    }
}