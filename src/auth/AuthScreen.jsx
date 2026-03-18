import { useState } from "react";
import { supabase } from "../lib/supabase.js";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onAuth(data.user);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.user?.identities?.length === 0) {
      setError("Un compte existe déjà avec cet email.");
      return;
    }
    setMessage("Vérifiez votre email pour confirmer votre inscription.");
    setMode("login");
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setMessage("Email de réinitialisation envoyé.");
    setMode("login");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 30% 20%, #1a1708 0%, #0e0d0a 60%, #080704 100%)",
      fontFamily: "Syne, sans-serif",
    }}>
      <div style={{
        width: 420, padding: 48, borderRadius: 20,
        background: "rgba(26, 23, 8, 0.8)", border: "1px solid rgba(212, 176, 98, 0.15)",
        backdropFilter: "blur(20px)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            fontFamily: "'Instrument Serif', serif", fontSize: 36,
            background: "linear-gradient(135deg, #d4b062, #b8963e)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 2, marginBottom: 4,
          }}>HoldingVision</div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 11,
            color: "#d4b062", letterSpacing: 4, opacity: 0.7,
          }}>PRO</div>
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 12,
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
          }}>
            {mode === "login" ? "Accédez à votre espace patrimonial" :
             mode === "signup" ? "Créez votre compte professionnel" :
             "Réinitialisez votre mot de passe"}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            background: "rgba(184, 61, 42, 0.15)", border: "1px solid rgba(184, 61, 42, 0.3)",
            color: "#e87461", fontSize: 12,
          }}>{error}</div>
        )}
        {message && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            background: "rgba(42, 125, 63, 0.15)", border: "1px solid rgba(42, 125, 63, 0.3)",
            color: "#5cb87a", fontSize: 12,
          }}>{message}</div>
        )}

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, display: "block" }}>
                Nom complet
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Jean Dupont"
                style={inputStyle} />
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, display: "block" }}>
              Email professionnel
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="jean@cabinet.fr"
              style={inputStyle} />
          </div>

          {mode !== "forgot" && (
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, display: "block" }}>
                Mot de passe
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle} />
            </div>
          )}

          <button
            onClick={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgot}
            disabled={loading}
            style={{
              padding: "14px 0", borderRadius: 12, border: "none", cursor: loading ? "wait" : "pointer",
              background: loading ? "rgba(212, 176, 98, 0.3)" : "linear-gradient(135deg, #d4b062, #b8963e)",
              color: "#0e0d0a", fontWeight: 700, fontSize: 14, fontFamily: "Syne",
              letterSpacing: 1, marginTop: 8, transition: "all 0.3s",
            }}>
            {loading ? "..." :
             mode === "login" ? "Se connecter" :
             mode === "signup" ? "Créer mon compte" :
             "Envoyer le lien"}
          </button>
        </div>

        {/* Switch mode */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          {mode === "login" && (
            <>
              <span>Pas encore de compte ? </span>
              <button onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
                style={linkStyle}>Créer un compte</button>
              <br />
              <button onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
                style={{ ...linkStyle, marginTop: 8, display: "inline-block" }}>Mot de passe oublié ?</button>
            </>
          )}
          {mode === "signup" && (
            <>
              <span>Déjà un compte ? </span>
              <button onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                style={linkStyle}>Se connecter</button>
            </>
          )}
          {mode === "forgot" && (
            <>
              <button onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                style={linkStyle}>Retour à la connexion</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1px solid rgba(212, 176, 98, 0.2)", background: "rgba(255,255,255,0.04)",
  color: "#faf8f4", fontSize: 14, fontFamily: "Syne",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s",
};

const linkStyle = {
  background: "none", border: "none", color: "#d4b062",
  cursor: "pointer", fontSize: 12, fontFamily: "Syne",
  textDecoration: "underline", padding: 0,
};
