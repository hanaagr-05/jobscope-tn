import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { api } from "../api";

export default function GraphPage() {
  const [raw, setRaw] = useState({ nodes: [], links: [] });
  const [skills, setSkills] = useState([]);
  const [skill, setSkill] = useState("");
  const [hover, setHover] = useState(null);
  const [error, setError] = useState("");
  const [width, setWidth] = useState(900);
  const box = useRef(null);

  useEffect(() => {
    api("/stats").then((s) => setSkills(s.topSkills.map((x) => x.name))).catch(() => {});
  }, []);

  useEffect(() => {
    setError("");
    api(`/graph?skill=${encodeURIComponent(skill)}`).then(setRaw).catch((e) => setError(e.message));
  }, [skill]);

  useEffect(() => {
    const fit = () => box.current && setWidth(box.current.clientWidth);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const data = useMemo(() => {
    const deg = {};
    raw.links.forEach((l) => {
      deg[l.source] = (deg[l.source] || 0) + 1;
      deg[l.target] = (deg[l.target] || 0) + 1;
    });
    return {
      nodes: raw.nodes.map((n) => ({ ...n, deg: deg[n.id] || 1 })),
      links: raw.links.map((l) => ({ ...l })),
    };
  }, [raw]);

  const jobs = raw.nodes.filter((n) => n.type === "job").length;
  const nSkills = raw.nodes.filter((n) => n.type === "skill").length;

  function onClick(node) {
    if (node.type === "skill") setSkill(node.label);
    else if (node.url) window.open(node.url, "_blank");
  }

  return (
    <>
      <h1>Graphe des offres et compétences</h1>
      <p className="muted">
        Données lues dans Neo4j : <b>Offre → REQUIRES → Compétence</b>. Cliquez sur une compétence
        pour la isoler, ou sur une offre pour l'ouvrir.
      </p>

      <div className="graph-bar">
        <select value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="">Toutes les compétences</option>
          {skills.map((s) => <option key={s}>{s}</option>)}
        </select>
        {skill && <button className="btn primary sm" onClick={() => setSkill("")}>Tout afficher</button>}
        <span className="legend"><i className="dot skill" /> Compétence</span>
        <span className="legend"><i className="dot job" /> Offre</span>
        <span className="muted">{jobs} offres · {nSkills} compétences · {raw.links.length} liens</span>
      </div>

      {error && <div className="error">{error}</div>}
      <div className="card graph-box" ref={box}>
        {data.nodes.length === 0 && !error && (
          <div className="muted" style={{ padding: 24 }}>
            Aucune donnée. Lancez <code>python load_neo4j.py</code> puis rechargez.
          </div>
        )}
        <ForceGraph2D
          graphData={data}
          width={width - 40}
          height={560}
          backgroundColor="#ffffff"
          linkColor={() => "#cbd5e1"}
          nodeLabel={(n) => (n.type === "job" ? `${n.label} (${n.source})` : `${n.label} · ${n.deg} offres`)}
          onNodeHover={setHover}
          onNodeClick={onClick}
          cooldownTicks={120}
          nodeCanvasObject={(node, ctx, scale) => {
            const isSkill = node.type === "skill";
            const r = isSkill ? 4 + Math.sqrt(node.deg) * 2.4 : 3.2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = isSkill ? "#13a995" : "#142c50";
            ctx.fill();
            if (hover && hover.id === node.id) {
              ctx.lineWidth = 1.5 / scale;
              ctx.strokeStyle = "#f59e0b";
              ctx.stroke();
            }
            if (isSkill) {
              ctx.font = `${12 / scale}px DM Sans, sans-serif`;
              ctx.textAlign = "center";
              ctx.fillStyle = "#142c50";
              ctx.fillText(node.label, node.x, node.y + r + 10 / scale);
            }
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 9, 0, 2 * Math.PI);
            ctx.fill();
          }}
        />
      </div>
      {hover && (
        <div className="card">
          <b>{hover.label}</b>{" "}
          <span className="muted">
            {hover.type === "job" ? `Offre · ${hover.source}` : `Compétence · demandée dans ${hover.deg} offres`}
          </span>
        </div>
      )}
    </>
  );
}