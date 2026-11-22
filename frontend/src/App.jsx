import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import GraphPage from "./pages/GraphPage";
import Saved from "./pages/Saved";
import Profile from "./pages/Profile";

function Layout() {
  const { user, logout } = useAuth();
  const nav = ({ isActive }) => "nav" + (isActive ? " active" : "");
  return (
    <div className="shell">
      <aside className="side">
        <Link to="/" className="logo"><i>J</i>JobScope <span>TN</span></Link>
        <NavLink to="/dashboard" className={nav}>▦ Tableau de bord</NavLink>
        <NavLink to="/jobs" className={nav}>⌕ Rechercher</NavLink>
        <NavLink to="/graph" className={nav}>✺ Graphe Neo4j</NavLink>
        <NavLink to="/saved" className={nav}>★ Mes favoris</NavLink>
        <NavLink to="/profile" className={nav}>☺ Mon profil</NavLink>
        <div className="spacer" />
        <div className="user">{user.name}<small>{user.email}</small></div>
        <button className="btn ghost" onClick={logout}>Déconnexion</button>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}

function Protected() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="center">Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<Protected />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}