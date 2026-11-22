import { useEffect, useState } from "react";
import { api } from "../api";
import JobCard from "../components/JobCard";

const enc = encodeURIComponent;

export default function Jobs() {
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [results, setResults] = useState([]);
  const [related, setRelated] = useState([]);
  const [top, setTop] = useState([]);
  const [saved, setSaved] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/favorites").then((f) => setSaved(new Set(f.map((x) => x.url)))).catch(() => {});
    api("/stats").then((s) => setTop(s.topSkills.slice(0, 10).map((x) => x.name))).catch(() => {});
    run("", "");
  }, []);

  function run(query, sk) {
    setLoading(true); setError("");
    api(`/search?q=${enc(query)}&skill=${enc(sk)}`)
      .then(setResults)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function pick(s) {
    setSkill(s);
    run(q, s);
    api(`/related/${enc(s)}`).then(setRelated).catch(() => setRelated([]));
  }

  function clearSkill() {
    setSkill(""); setRelated([]); run(q, "");
  }

  async function toggle(job) {
    const next = new Set(saved);
    try {
      if (saved.has(job.url)) {
        await api(`/favorites?url=${enc(job.url)}`, { method: "DELETE" });
        next.delete(job.url);
      } else {
        const { url, title, company, location, source, skills, date_posted } = job;
        await api("/favorites", { method: "POST", body: { url, title, company, location, source, skills, date_posted } });
        next.add(job.url);
      }
      setSaved(next);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <h1>Rechercher des offres</h1>
      <p className="muted">Recherche plein texte (Elasticsearch) et compétences associées (Neo4j).</p>
      <form className="searchbar" onSubmit={(e) => { e.preventDefault(); run(q, skill); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex. développeur java, devops, data…" />
        <button className="btn primary">Rechercher</button>
      </form>

      <div className="chips">
        {top.map((s) => (
          <button key={s} className={"chip" + (s === skill ? " active" : "")} onClick={() => pick(s)}>{s}</button>
        ))}
        {skill && <button className="chip clear" onClick={clearSkill}>Retirer : {skill} ✕</button>}
      </div>

      {skill && related.length > 0 && (
        <div className="card related">
          Souvent demandée avec <b>{skill}</b> :{" "}
          {related.map((r) => (
            <button key={r.skill} className="chip" onClick={() => pick(r.skill)}>{r.skill} ({r.n})</button>
          ))}
        </div>
      )}

      {error && <div className="error">{error}</div>}
      <p className="muted">{loading ? "Recherche…" : `${results.length} résultat(s)`}</p>
      {results.map((j) => (
        <JobCard key={j.url} job={j} saved={saved.has(j.url)} onToggle={toggle} onSkill={pick} />
      ))}
    </>
  );
}