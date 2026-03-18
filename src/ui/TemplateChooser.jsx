import { TEMPLATES } from "../engine/templates.js";
import { ETYPES } from "../lib/constants.js";

export default function TemplateChooser({ onSelect, onClose, activeBricks }) {
  // Map bricks to template profile ids
  const brickToProfile = { cgp: "cgp", juridique: "avocat", immo: "immo" };
  const activeProfiles = (activeBricks || []).map(b => brickToProfile[b]).filter(Boolean);
  const filtered = activeProfiles.length > 0
    ? TEMPLATES.filter(t => activeProfiles.includes(t.profile))
    : TEMPLATES;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
    }} onClick={onClose}>
      <div className="anim-scale" style={{
        background: "var(--bg-card)", border: "1px solid var(--border-hover)",
        borderRadius: 20, padding: 0, maxWidth: 600, width: "100%", margin: "0 16px",
        maxHeight: "80vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px var(--border)",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(200,150,80,0.06) 0%, transparent 100%)",
          borderRadius: "20px 20px 0 0",
        }}>
          <div>
            <h2 style={{ fontFamily: "Instrument Serif", fontSize: 22, color: "var(--copper-bright)", marginBottom: 4 }}>
              Choisir un template
            </h2>
            <p style={{ fontSize: 11, color: "var(--tx-tertiary)" }}>Sélectionnez un modèle de structure patrimoniale</p>
          </div>
          <button onClick={onClose} style={{
            color: "var(--tx-tertiary)", background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 8, cursor: "pointer", fontSize: 12, padding: "4px 10px", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-fisc)"; e.currentTarget.style.color = "var(--c-fisc)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--tx-tertiary)"; }}>
            ✕
          </button>
        </div>

        {/* Templates list */}
        <div style={{ padding: "12px 16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(tpl => (
            <button key={tpl.id} onClick={() => { onSelect(tpl.id); onClose(); }}
              style={{
                width: "100%", textAlign: "left", padding: 16, borderRadius: 14,
                border: "1px solid var(--border)", background: "var(--bg-elevated)",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--border-active)";
                e.currentTarget.style.background = "var(--bg-card-hover)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(200,150,80,0.08)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--bg-elevated)";
                e.currentTarget.style.boxShadow = "none";
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>{tpl.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--copper-bright)", fontFamily: "Syne" }}>{tpl.nom}</span>
              </div>
              <p style={{ fontSize: 11, color: "var(--tx-secondary)", lineHeight: 1.5, marginBottom: 10 }}>{tpl.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {tpl.nodes.filter(n => n.type !== "source" && n.type !== "fisc").map(n => {
                  const et = ETYPES.find(t => t.id === n.type);
                  return (
                    <span key={n.id} style={{
                      fontSize: 9, padding: "3px 8px", borderRadius: 6,
                      background: "var(--bg-card)", border: "1px solid var(--border)",
                      color: et?.c || "var(--tx-secondary)", fontWeight: 600, fontFamily: "Space Mono",
                    }}>
                      {n.l}
                    </span>
                  );
                })}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
