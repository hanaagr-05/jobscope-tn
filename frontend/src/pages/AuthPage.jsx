import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      nav("/dashboard");
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Serveur injoignable. Le backend est-il lancé ?" : err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <Link to="/" className="brand light"><span className="brand-icon">J</span>JobScope <span>TN</span></Link>
        <h1>Le marché IT tunisien, en un coup d'œil.</h1>
        <p>Recherchez des offres, explorez le graphe des compétences et suivez vos candidatures.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h2>{isLogin ? "Bon retour !" : "Créer votre compte"}</h2>
        <p className="muted">{isLogin ? "Connectez-vous pour accéder à votre espace." : "Gratuit et rapide."}</p>
        {!isLogin && (
          <input placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Mot de passe (6 caractères min.)" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="error">{error}</div>}
        <button className="btn primary" disabled={busy}>
          {busy ? "Veuillez patienter…" : isLogin ? "Se connecter" : "S'inscrire"}
        </button>
        <p className="muted center-text">
          {isLogin ? <>Pas de compte ? <Link to="/register">S'inscrire</Link></>
                   : <>Déjà inscrit ? <Link to="/login">Se connecter</Link></>}
        </p>
      </form>
    </div>
  );
}