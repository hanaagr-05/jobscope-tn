import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import JobCard from "../components/JobCard";

const STATUS = ["À postuler", "Postulé", "Entretien", "Accepté", "Refusé"];

function Item({ job, onRemove }) {
  const [status, setStatus] = useState(job.status || STATUS[0]);
  const [note, setNote] = useState(job.note || "");
  const [msg, setMsg] = useState("");

  async function save() {
    try {
      await api("/favorites", { method: "PUT", body: { url: job.url, status, note } });
      setMsg("Enregistré ✓");
    } catch (e) {
      setMsg(e.message);
    }
    setTimeout(() => setMsg(""), 2500);
  }

  return (
    <JobCard job={job} saved onToggle={onRemove}>
      <div className="edit-row">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une note…" />
        <button className="btn primary sm" onClick={save}>Enregistrer</button>
        <span className="muted">{msg}</span>
      </div>
    </JobCard>
  );
}

export default function Saved() {
  const [jobs, setJobs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api("/favorites").then(setJobs).finally(() => setLoaded(true));
  }, []);

  async function remove(job) {
    await api(`/favorites?url=${encodeURIComponent(job.url)}`, { method: "DELETE" });
    setJobs(jobs.filter((j) => j.url !== job.url));
  }

  return (
    <>
      <h1>Mes favoris</h1>
      <p className="muted">Suivez vos candidatures : statut et notes (PUT), suppression (DELETE).</p>
      {loaded && jobs.length === 0 && (
        <div className="card">Aucun favori. <Link to="/jobs">Trouver des offres</Link>.</div>
      )}
      {jobs.map((j) => <Item key={j.url} job={j} onRemove={remove} />)}
    </>
  );
}