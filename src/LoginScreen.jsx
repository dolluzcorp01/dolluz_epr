import { useState } from "react";
import { apiFetch } from "./utils/api";

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!email || !password) { setError("Email and password are required."); return; }
    setError(""); setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Login failed."); return; }
      localStorage.setItem("epr_token", data.token);
      onLogin(data.token, data.user);
    } catch (e) {
      setError("Network error. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D1B2A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "44px 40px", width: 400, boxShadow: "0 24px 80px rgba(0,0,0,.35)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 28, color: "#0D1B2A", letterSpacing: -1 }}>
            Dolluz<span style={{ color: "#E8520A" }}>.</span>
          </div>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>
            Admin Portal
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
            <input className="inp" type="email" placeholder="admin@dolluz.com" value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handle()}
              style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
            <input className="inp" type="password" placeholder="••••••••" value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handle()}
              style={{ width: "100%" }} />
          </div>
          <button className="btn-primary" onClick={handle} disabled={loading}
            style={{ marginTop: 8, padding: "12px", justifyContent: "center", fontSize: 14, width: "100%" }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} /> Signing in…</>
              : "Sign In →"
            }
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#94A3B8" }}>
          Employee Performance Review Portal · Dolluz Corp
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
