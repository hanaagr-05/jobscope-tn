package tn.jobscope;

import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final DataService svc;

    public ApiController(DataService svc) {
        this.svc = svc;
    }

    @GetMapping("/search")
    public List<Map<String, Object>> search(@RequestParam(defaultValue = "") String q,
                                            @RequestParam(defaultValue = "") String skill) {
        return svc.search(q, skill);
    }

    @GetMapping("/related/{skill}")
    public List<Map<String, Object>> related(@PathVariable String skill) {
        return svc.related(skill.toLowerCase());
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return svc.stats();
    }

    @GetMapping("/jobs")
    public List<Map<String, Object>> jobs() {
        return svc.jobs();
    }

    @GetMapping("/graph")
    public Map<String, Object> graph(@RequestParam(defaultValue = "") String skill) {
        return svc.graph(skill.toLowerCase());
    }
}