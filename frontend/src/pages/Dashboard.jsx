import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "../api";
import { useAuth } from "../auth";

const COLORS = ["#13a995", "#142c50", "#f59e0b", "#6366f1"];

function BarCard({ title, data, color }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="n" fill={color} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [latest, setLatest] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/stats").then(setStats).catch((e) => setError(e.message));
    api("/search").then((r) => setLatest(r.slice(0, 5))).catch(() => {});
    api("/favorites").then((f) => setSavedCount(f.length)).catch(() => {});
  }, []);

  return (
    <>
      <h1>Bonjour, {user.name.split(" ")[0]} 👋</h1>
      <p className="muted">Voici le marché de l'emploi IT en Tunisie (Keejob + Tanitjobs).</p>
      {error && <div className="error">{error}</div>}
      {stats && (
        <>
          <div className="kpis">
            <div className="card kpi"><span>Offres IT</span><b>{stats.total}</b></div>
            <div className="card kpi"><span>Sources</span><b>{stats.bySource.length}</b></div>
            <div className="card kpi"><span>Compétence n°1</span><b className="small">{stats.topSkills[0]?.name}</b></div>
            <div className="card kpi"><span>Mes favoris</span><b>{savedCount}</b></div>
          </div>
          <div className="grid2">
            <BarCard title="Compétences les plus demandées" data={stats.topSkills} color="#13a995" />
            <BarCard title="Villes / zones" data={stats.byCity} color="#142c50" />
          </div>
          <div className="grid2">
            <div className="card">
              <h3>Offres par source</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.bySource} dataKey="n" nameKey="name" outerRadius={90} label>
                    {stats.bySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3>Offres récentes <Link to="/jobs" className="more">Tout voir →</Link></h3>
              {latest.map((j) => (
                <div key={j.url} className="mini">
                  <a href={j.url} target="_blank" rel="noreferrer">{j.title}</a>
                  <div className="muted">{j.company} · {j.location}</div>
                </div>
              ))}
              <Link to="/graph" className="btn primary" style={{ display: "inline-block", marginTop: 14 }}>
                Explorer le graphe →
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}