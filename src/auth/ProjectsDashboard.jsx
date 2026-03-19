import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import useBrandStore from "../store/brandStore.js";
import { getBrandTheme } from "../engine/brandThemes.js";

export default function ProjectsDashboard({ user, onOpenProject, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClient, setNewClient] = useState("");
  const brandStore = useBrandStore();

  useEffect(() => { brandStore.init(user?.id); }, [user?.id]);

  const brand = brandStore.brand;
  const bt = brand?.themeId ? getBrandTheme(brand.themeId) : null;

  const accent = bt?.accent || "#d4b062";
  const accentDim = bt?.accentDim || "#b8963e";
  const isLight = bt?.mode === "light";
  const bgMain = isLight
    ? `radial-gradient(ellipse at 30% 20%, ${bt.canvasBg || "#f4f5f8"} 0%, #e8e8f0 60%, #d8d8e0 100%)`
    : "radial-gradient(ellipse at 30% 20%, #1a1708 0%, #0e0d0a 60%, #080704 100%)";
  const textColor = isLight ? (bt?.txPrimary || "#1a1a3a") : "#faf8f4";
  const textDim = isLight ? (bt?.txSecondary || "#5a5a80") : "rgba(255,255,255,0.5)";
  const textMuted = isLight ? (bt?.txTertiary || "#9a9ab0") : "rgba(255,255,255,0.3)";
  const cardBg = isLight ? "rgba(255,255,255,0.8)" : "rgba(26, 23, 8, 0.5)";
  const cardBorder = accent + "22";
  const cardBorderHover = accent + "55";
  const inputBg = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";
  const inputBorder = accent + "33";
  const logoUrl = brand?.logo || null;

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (!error) setProjects(data || []);
    setLoading(false);
  };

  const createProject = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase.from("projects").insert({
      user_id: user.id,
      name: newName.trim(),
      client_name: newClient.trim() || null,
      nodes: [],
      edges: [],
    }).select().single();
    if (!error && data) {
      setProjects([data, ...projects]);
      setNewName(""); setNewClient(""); setCreating(false);
    }
  };

  const deleteProject = async (id) => {
    if (!confirm("Supprimer ce dossier ? Cette action est irréversible.")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects(projects.filter(p => p.id !== id));
  };

  const duplicateProject = async (project) => {
    const { data, error } = await supabase.from("projects").insert({
      user_id: user.id,
      name: project.name + " (copie)",
      client_name: project.client_name,
      nodes: project.nodes,
      edges: project.edges,
    }).select().single();
    if (!error && data) setProjects([data, ...projects]);
  };

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Utilisateur";

  return (
    <div style={{
      minHeight: "100vh",
      background: bgMain,
      fontFamily: "Syne, sans-serif", color: textColor,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 40px", borderBottom: `1px solid ${accent}22`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="" style={{ height: 36, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <>
              <span style={{
                fontFamily: "'Instrument Serif', serif", fontSize: 24,
                background: `linear-gradient(135deg, ${accent}, ${accentDim})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>HoldingVision</span>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: accent, letterSpacing: 3, opacity: 0.6,
              }}>PRO</span>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 13, color: textDim }}>
            {userName}
          </span>
          <button onClick={onLogout} style={{
            padding: "8px 16px", borderRadius: 8, border: `1px solid ${accent}33`,
            background: "transparent", color: accent, fontSize: 12, cursor: "pointer",
            fontFamily: "Syne",
          }}>Déconnexion</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 400, margin: 0,
            }}>Mes dossiers</h1>
            <p style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>
              {projects.length} dossier{projects.length !== 1 ? "s" : ""} client
            </p>
          </div>
          <button onClick={() => setCreating(true)} style={{
            padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${accent}, ${accentDim})`,
            color: isLight ? "#ffffff" : "#0e0d0a", fontWeight: 700, fontSize: 13, fontFamily: "Syne",
            letterSpacing: 0.5,
          }}>+ Nouveau dossier</button>
        </div>

        {/* New project form */}
        {creating && (
          <div style={{
            padding: 24, borderRadius: 16, marginBottom: 24,
            background: "rgba(26, 23, 8, 0.6)", border: "1px solid rgba(212, 176, 98, 0.2)",
          }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Nom du dossier (ex: Holding Dupont)"
                style={{ ...inputStyle, flex: 2 }}
                autoFocus onKeyDown={e => e.key === "Enter" && createProject()} />
              <input type="text" value={newClient} onChange={e => setNewClient(e.target.value)}
                placeholder="Nom du client (optionnel)"
                style={{ ...inputStyle, flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setCreating(false); setNewName(""); setNewClient(""); }}
                style={cancelBtnStyle}>Annuler</button>
              <button onClick={createProject} disabled={!newName.trim()}
                style={{
                  ...cancelBtnStyle,
                  background: newName.trim() ? "linear-gradient(135deg, #d4b062, #b8963e)" : "rgba(212, 176, 98, 0.2)",
                  color: newName.trim() ? "#0e0d0a" : "rgba(255,255,255,0.3)",
                  border: "none",
                }}>Créer</button>
            </div>
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>
            Chargement...
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 80,
            color: "rgba(255,255,255,0.3)", fontSize: 14,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◈</div>
            Aucun dossier pour le moment.
            <br />Créez votre premier dossier pour commencer.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280, 1fr))", gap: 16 }}>
            {projects.map(p => (
              <div key={p.id}
                onClick={() => onOpenProject(p)}
                style={{
                  padding: 20, borderRadius: 16, cursor: "pointer",
                  background: cardBg, border: `1px solid ${cardBorder}`,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cardBorderHover; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: textColor }}>{p.name}</div>
                    {p.client_name && (
                      <div style={{ fontSize: 12, color: textMuted }}>Client: {p.client_name}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => duplicateProject(p)}
                      title="Dupliquer"
                      style={iconBtnStyle}>⧉</button>
                    <button onClick={() => deleteProject(p.id)}
                      title="Supprimer"
                      style={{ ...iconBtnStyle, color: "#b83d2a" }}>✕</button>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11, color: textMuted }}>
                  <span>{(p.nodes?.length || 0)} noeuds</span>
                  <span>{new Date(p.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 14px", borderRadius: 10,
  border: "1px solid rgba(212, 176, 98, 0.2)", background: "rgba(255,255,255,0.04)",
  color: "#faf8f4", fontSize: 13, fontFamily: "Syne", outline: "none",
};

const cancelBtnStyle = {
  padding: "8px 16px", borderRadius: 8,
  border: "1px solid rgba(212, 176, 98, 0.2)", background: "transparent",
  color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", fontFamily: "Syne",
};

const iconBtnStyle = {
  width: 28, height: 28, borderRadius: 6, border: "none",
  background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
  cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
};
