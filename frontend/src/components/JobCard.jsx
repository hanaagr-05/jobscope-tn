export default function JobCard({ job, saved, onToggle, onSkill, children }) {
  return (
    <div className="card job">
      <div className="job-head">
        <div className="company-avatar">{(job.company || "J").charAt(0).toUpperCase()}</div>
        <div className="job-main">
          <a href={job.url} target="_blank" rel="noreferrer" className="job-title">{job.title}</a>
          <div className="muted">
            {job.company || "—"} · ⌖ {job.location || "—"} · {job.date_posted || ""}
          </div>
        </div>
        <button className={"star" + (saved ? " on" : "")} onClick={() => onToggle(job)}
                title={saved ? "Retirer des favoris" : "Ajouter aux favoris"}>
          {saved ? "★" : "☆"}
        </button>
      </div>
      <div className="chips">
        <span className={"badge " + job.source}>{job.source}</span>
        {(job.skills || []).map((s) => (
          <button key={s} className="chip" onClick={() => onSkill && onSkill(s)}>{s}</button>
        ))}
      </div>
      {children}
    </div>
  );
}