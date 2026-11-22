import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) { setReady(true); return; }
    api("/me").then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setReady(true));
  }, []);

  const finish = (res) => { localStorage.setItem("token", res.token); setUser(res.user); };
  const login = (email, password) =>
    api("/auth/login", { method: "POST", body: { email, password } }).then(finish);
  const register = (name, email, password) =>
    api("/auth/register", { method: "POST", body: { name, email, password } }).then(finish);
  const logout = () => { localStorage.removeItem("token"); setUser(null); };

  return (
    <Ctx.Provider value={{ user, setUser, ready, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}