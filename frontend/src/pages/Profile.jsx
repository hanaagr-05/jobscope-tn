import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState(user.name);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function save(e) {
    e.preventDefault();
    setMsg(""); setError("");
    try {
      const u = await api("/me", { method: "PUT", body: { name, currentPassword: current, newPassword: next } });
      setUser(u);
      setCurrent(""); setNext("");
      setMsg("Profil mis à jour ✓");
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    if (!window.confirm("Supprimer définitivement votre compte et vos favoris ?")) return;
    await api("/me", { method: "DELETE" });
    logout();
    nav("/");
  }

  return (
    <>
      <h1>Mon profil</h1>
      <p className="muted">Modifier votre compte (PUT) ou le supprimer (DELETE).</p>
      <form className="card profile" onSubmit={save}>
        <label>Email</label>
        <input value={user.email} disabled />
        <label>Nom</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
        <label>Mot de passe actuel (seulement pour le changer)</label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <label>Nouveau mot de passe</label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        {error && <div className="error">{error}</div>}
        {msg && <div className="success">{msg}</div>}
        <button className="btn primary">Enregistrer</button>
      </form>
      <div className="card danger">
        <h3>Zone dangereuse</h3>
        <p className="muted">La suppression du compte efface aussi tous vos favoris.</p>
        <button className="btn red" onClick={remove}>Supprimer mon compte</button>
      </div>
    </>
  );
}