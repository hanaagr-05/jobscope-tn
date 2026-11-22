package tn.jobscope;

import java.security.Principal;
import java.util.Date;
import java.util.Map;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {
    private static final String COL = "users";
    private final MongoTemplate mongo;
    private final PasswordEncoder enc;
    private final JwtService jwt;

    public AuthController(MongoTemplate mongo, PasswordEncoder enc, JwtService jwt) {
        this.mongo = mongo;
        this.enc = enc;
        this.jwt = jwt;
    }

    private Query byEmail(String email) {
        return Query.query(Criteria.where("email").is(email));
    }

    private Document find(String email) {
        return mongo.findOne(byEmail(email), Document.class, COL);
    }

    private Map<String, Object> session(String name, String email) {
        return Map.of("token", jwt.create(email), "user", Map.of("name", name, "email", email));
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> b) {
        String name = b.getOrDefault("name", "").trim();
        String email = b.getOrDefault("email", "").trim().toLowerCase();
        String pw = b.getOrDefault("password", "");
        if (name.isEmpty() || !email.contains("@") || pw.length() < 6)
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Nom, email valide et mot de passe de 6 caractères minimum requis"));
        if (find(email) != null)
            return ResponseEntity.status(409).body(Map.of("error", "Cet email est déjà utilisé"));
        mongo.save(new Document("name", name).append("email", email)
            .append("passwordHash", enc.encode(pw)).append("createdAt", new Date()), COL);
        return ResponseEntity.status(201).body(session(name, email));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> b) {
        String email = b.getOrDefault("email", "").trim().toLowerCase();
        Document u = find(email);
        if (u == null || !enc.matches(b.getOrDefault("password", ""), u.getString("passwordHash")))
            return ResponseEntity.status(401).body(Map.of("error", "Email ou mot de passe incorrect"));
        return ResponseEntity.ok(session(u.getString("name"), email));
    }

    @GetMapping("/api/me")
    public ResponseEntity<Map<String, Object>> me(Principal p) {
        Document u = find(p.getName());
        if (u == null) return ResponseEntity.status(401).body(Map.of("error", "Utilisateur inconnu"));
        return ResponseEntity.ok(Map.of("name", u.getString("name"), "email", u.getString("email")));
    }

    @PutMapping("/api/me")
    public ResponseEntity<Map<String, Object>> update(Principal p, @RequestBody Map<String, String> b) {
        Document u = find(p.getName());
        if (u == null) return ResponseEntity.status(401).body(Map.of("error", "Utilisateur inconnu"));
        String name = b.getOrDefault("name", u.getString("name")).trim();
        if (name.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "Le nom est obligatoire"));
        Update up = new Update().set("name", name);
        String np = b.getOrDefault("newPassword", "");
        if (!np.isEmpty()) {
            if (np.length() < 6)
                return ResponseEntity.badRequest().body(Map.of("error", "Nouveau mot de passe : 6 caractères minimum"));
            if (!enc.matches(b.getOrDefault("currentPassword", ""), u.getString("passwordHash")))
                return ResponseEntity.status(403).body(Map.of("error", "Mot de passe actuel incorrect"));
            up.set("passwordHash", enc.encode(np));
        }
        mongo.updateFirst(byEmail(p.getName()), up, COL);
        return ResponseEntity.ok(Map.of("name", name, "email", p.getName()));
    }

    @DeleteMapping("/api/me")
    public ResponseEntity<Void> delete(Principal p) {
        mongo.remove(byEmail(p.getName()), COL);
        mongo.remove(Query.query(Criteria.where("user").is(p.getName())), "favorites");
        return ResponseEntity.noContent().build();
    }
}