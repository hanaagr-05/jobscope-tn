import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";

const API_URL = "http://localhost:8080/api/jobs";

export default function Home() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [contract, setContract] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setJobs)
      .catch(() => setError("Impossible de contacter le serveur. Vérifiez que le backend fonctionne."))
      .finally(() => setLoading(false));
  }, []);

  const cityOf = (j) => (j.location || "").split(",")[0].trim();
  const cities = [...new Set(jobs.map(cityOf).filter(Boolean))].sort();
  const contracts = [...new Set(jobs.flatMap((j) => (j.contract_type || "").split(", ")).filter(Boolean))];

  const filtered = jobs.filter((j) => {
    const text = `${j.title || ""} ${j.company || ""} ${j.description || ""} ${(j.skills || []).join(" ")}`.toLowerCase();
    return text.includes(search.trim().toLowerCase())
      && (!city || cityOf(j) === city)
      && (!contract || (j.contract_type || "").includes(contract));
  });

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : "Date non précisée";

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#accueil"><span className="brand-icon">J</span>JobScope <span>TN</span></a>
        <nav>
          <a href="#accueil">Accueil</a>
          <a href="#offres">Offres d'emploi</a>
          <a href="#apropos">À propos</a>
        </nav>
        {user ? (
          <Link className="nav-button" to="/dashboard">Mon espace</Link>
        ) : (
          <div className="nav-actions">
            <Link className="nav-button dark" to="/login">Connexion</Link>
            <Link className="nav-button" to="/register">Créer un compte</Link>
          </div>
        )}
      </header>

      <main>
        <section className="hero-section" id="accueil">
          <div className="hero-content">
            <span className="eyebrow">LE TALENT RENCONTRE L'OPPORTUNITÉ</span>
            <h1>Trouvez l'emploi IT qui correspond à <span>votre avenir.</span></h1>
            <p>Explorez les offres informatiques en Tunisie, collectées sur Keejob et Tanitjobs,
              et découvrez les compétences les plus demandées.</p>
            <Link className="primary-button" to={user ? "/dashboard" : "/register"}>
              {user ? "Aller à mon espace" : "Créer mon compte"} <span>→</span>
            </Link>
            <div className="hero-stats">
              <div><strong>{jobs.length}</strong><small>Offres disponibles</small></div>
              <div><strong>{cities.length}</strong><small>Villes représentées</small></div>
              <div><strong>2</strong><small>Sources de données</small></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card">
              <div className="visual-icon">⌕</div>
              <h3>Votre prochaine opportunité</h3>
              <p>Compétences · Ambition · Carrière</p>
              <div className="visual-line"></div>
              <div className="visual-tags"><span>Data</span><span>IT</span><span>DevOps</span></div>
            </div>
            <div className="floating-card">✦ Graphe de compétences</div>
          </div>
        </section>

        <section className="jobs-section" id="offres">
          <div className="section-heading">
            <div>
              <span className="eyebrow">OPPORTUNITÉS PROFESSIONNELLES</span>
              <h2>Explorez les offres d'emploi</h2>
              <p>Recherchez votre prochaine opportunité en quelques clics.</p>
            </div>
            <span className="results-count">{filtered.length} résultat(s)</span>
          </div>

          <div className="search-panel">
            <div className="search-field">
              <label>Mot-clé</label>
              <input type="text" placeholder="Poste, entreprise, compétence..."
                     value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="filter-field">
              <label>Ville</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Toutes les villes</option>
                {cities.map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>Type de contrat</label>
              <select value={contract} onChange={(e) => setContract(e.target.value)}>
                <option value="">Tous les contrats</option>
                {contracts.map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <button className="search-button"
                    onClick={() => { setSearch(""); setCity(""); setContract(""); }}>
              Réinitialiser
            </button>
          </div>

          {loading && <p className="status-message">Chargement des offres...</p>}
          {error && <p className="error-message">{error}</p>}

          {!loading && !error && (
            <div className="jobs-grid">
              {filtered.slice(0, 30).map((job) => (
                <article className="job-card" key={job.url}>
                  <div className="job-card-top">
                    <div className="company-avatar">{(job.company || "J").charAt(0).toUpperCase()}</div>
                    <span className="job-type">{(job.contract_type || "Contrat non précisé").split(",")[0]}</span>
                  </div>
                  <h3>{job.title || "Poste sans titre"}</h3>
                  <p className="company-name">{job.company || "Entreprise non précisée"}</p>
                  <div className="job-details"><span>⌖ {job.location || "Lieu non précisé"}</span></div>
                  <p className="job-description">{job.description || "Découvrez cette opportunité."}</p>
                  <div className="skills-list">
                    {(job.skills || []).slice(0, 4).map((s) => <span key={s}>{s}</span>)}
                  </div>
                  <div className="job-card-footer">
                    <span>{formatDate(job.date_posted)}</span>
                    <button type="button" className="details-link" onClick={() => setSelected(job)}>
                      Voir l'offre →
                    </button>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && (
                <div className="empty-state">
                  <h3>Aucune offre trouvée</h3>
                  <p>Essayez de modifier vos critères de recherche.</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="about-section" id="apropos">
          <span className="eyebrow">À PROPOS DE JOBSCOPE TN</span>
          <h2>La technologie au service de votre carrière.</h2>
          <p>JobScope TN agrège les offres IT de plusieurs sites tunisiens, les stocke dans MongoDB,
            les relie dans un graphe Neo4j, les indexe dans Elasticsearch et les expose via une API REST sécurisée.</p>
        </section>
      </main>

      {selected && (
        <div className="side-panel-overlay" onClick={() => setSelected(null)}>
          <aside className="job-side-panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="side-panel-header">
              <div><span className="eyebrow">DÉTAILS DE L'OPPORTUNITÉ</span><p>JobScope TN</p></div>
              <button type="button" className="modal-close" aria-label="Fermer" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="side-panel-content">
              <div className="side-company-avatar">{(selected.company || "J").charAt(0).toUpperCase()}</div>
              <span className="job-type">{selected.contract_type || "Contrat non précisé"}</span>
              <h2>{selected.title}</h2>
              <p className="side-company-name">{selected.company || "Entreprise non précisée"}</p>
              <div className="side-info-grid">
                <div className="side-info-item"><span>Lieu</span><strong>⌖ {selected.location || "Non précisé"}</strong></div>
                <div className="side-info-item"><span>Source</span><strong>{selected.source}</strong></div>
              </div>
              <div className="side-section">
                <h3>Description du poste</h3>
                <p>{selected.description || "Aucune description disponible."}</p>
              </div>
              <div className="side-section">
                <h3>Compétences détectées</h3>
                <div className="skills-list">
                  {(selected.skills || []).length
                    ? selected.skills.map((s) => <span key={s}>{s}</span>)
                    : <span>Non précisées</span>}
                </div>
              </div>
              <div className="side-publication-date">
                <span>Date de publication</span><strong>{formatDate(selected.date_posted)}</strong>
              </div>
            </div>
            <div className="side-panel-footer">
              <a className="modal-action" href={selected.url} target="_blank" rel="noreferrer">
                Voir l'annonce originale ↗
              </a>
            </div>
          </aside>
        </div>
      )}

      <footer>
        <a className="brand" href="#accueil"><span className="brand-icon">J</span>JobScope <span>TN</span></a>
        <p>© 2026 JobScope TN — Projet académique</p>
      </footer>
    </div>
  );
}