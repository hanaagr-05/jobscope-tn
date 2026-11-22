package tn.jobscope;

import java.security.Principal;
import java.util.*;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favorites")
public class FavoritesController {
    private static final String COL = "favorites";
    private static final List<String> FIELDS =
        List.of("url", "title", "company", "location", "source", "skills", "date_posted");
    private final MongoTemplate mongo;

    public FavoritesController(MongoTemplate mongo) {
        this.mongo = mongo;
    }

    private Query mine(Principal p, String url) {
        Criteria c = Criteria.where("user").is(p.getName());
        if (url != null) c = c.and("url").is(url);
        return Query.query(c);
    }

    @GetMapping
    public List<Map<String, Object>> list(Principal p) {
        Query q = mine(p, null).with(Sort.by(Sort.Direction.DESC, "savedAt"));
        List<Map<String, Object>> out = new ArrayList<>();
        for (Document d : mongo.find(q, Document.class, COL)) {
            d.remove("_id");
            d.remove("user");
            out.add(new HashMap<>(d));
        }
        return out;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> add(Principal p, @RequestBody Map<String, Object> body) {
        Object url = body.get("url");
        if (!(url instanceof String s) || s.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "url is required"));
        if (mongo.exists(mine(p, s), COL))
            return ResponseEntity.status(409).body(Map.of("error", "already saved"));
        Document d = new Document("user", p.getName()).append("savedAt", new Date())
            .append("status", "À postuler").append("note", "");
        for (String f : FIELDS) if (body.get(f) != null) d.append(f, body.get(f));
        mongo.save(d, COL);
        return ResponseEntity.status(201).body(Map.of("url", s, "saved", true));
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> update(Principal p, @RequestBody Map<String, Object> body) {
        Object url = body.get("url");
        if (!(url instanceof String s) || s.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "url is required"));
        Update u = new Update()
            .set("status", String.valueOf(body.getOrDefault("status", "À postuler")))
            .set("note", String.valueOf(body.getOrDefault("note", "")));
        long n = mongo.updateFirst(mine(p, s), u, COL).getMatchedCount();
        if (n == 0) return ResponseEntity.status(404).body(Map.of("error", "not found"));
        return ResponseEntity.ok(Map.of("url", s, "updated", true));
    }

    @DeleteMapping
    public ResponseEntity<Void> remove(Principal p, @RequestParam String url) {
        long n = mongo.remove(mine(p, url), COL).getDeletedCount();
        return n == 0 ? ResponseEntity.notFound().build() : ResponseEntity.noContent().build();
    }
}