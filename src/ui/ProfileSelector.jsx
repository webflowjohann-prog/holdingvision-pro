import { ENTRY_PROFILES, PROFILE_THEMES } from "../engine/bricks.js";

const CHAR_IMAGES = {
  cgp: "/char-cgp.png",
  avocat: "/char-avocat.png",
  immo: "/char-immo.png",
  assurance: "/char-assurance.png",
};

// Map theme data to card style props
function getCardStyle(id) {
  const t = PROFILE_THEMES[id];
  return {
    cardBg: t.cardBg,
    cardBorder: t.cardBorder,
    accent: t.accent,
    btnBg: t.btnBg,
    btnText: t.btnText,
    tagBg: t.tagBg,
    tagBorder: t.tagBorder,
    tagColor: t.accent,
    glow: t.accentGlow,
    hoverBorder: t.borderHover,
    hoverShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${t.accentGlow}`,
  };
}

export default function ProfileSelector({ onSelect }) {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0c0b0a", padding: 40, position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translate(-50%, -50%)",
        width: 800, height: 800, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,150,80,0.03) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Logo */}
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 2 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #c89650, #e89040)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 800, color: "#0e0d0a", fontFamily: "Instrument Serif",
          boxShadow: "0 0 40px rgba(200,150,80,0.25)",
        }}>H</div>
        <div>
          <h1 style={{ fontFamily: "Instrument Serif", fontSize: 36, color: "#e8e2d8", lineHeight: 1 }}>
            Holding<span style={{ color: "#c89650" }}>Vision</span>
          </h1>
          <div style={{ fontSize: 10, color: "#605c52", fontFamily: "Space Mono", letterSpacing: "0.15em", marginTop: 2 }}>
            SIMULATION PATRIMONIALE PRO
          </div>
        </div>
      </div>

      <p style={{ fontSize: 14, color: "#9a9488", marginBottom: 36, textAlign: "center", maxWidth: 500, lineHeight: 1.6, position: "relative", zIndex: 2 }}>
        Choisissez votre profil professionnel pour une expérience adaptée.
      </p>

      {/* 3 Cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, maxWidth: 1200, width: "100%", position: "relative", zIndex: 2, justifyContent: "center" }}>
        {ENTRY_PROFILES.map((p, i) => {
          const s = getCardStyle(p.id);
          return (
            <button key={p.id} onClick={() => onSelect(p.id)}
              className="anim-fade"
              style={{
                flex: "0 1 260px", textAlign: "center", padding: 0, borderRadius: 24,
                background: s.cardBg, border: `1px solid ${s.cardBorder}`,
                cursor: "pointer", transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative", overflow: "hidden",
                animationDelay: `${i * 0.12}s`, animationFillMode: "both",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = s.hoverBorder;
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = s.hoverShadow;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = s.cardBorder;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}>

              {/* Top glow */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 160,
                background: `radial-gradient(ellipse at center top, ${s.glow} 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />

              {/* Character */}
              <div style={{
                width: "100%", height: 220, overflow: "hidden",
                display: "flex", alignItems: "flex-end", justifyContent: "center",
                position: "relative",
              }}>
                <img src={CHAR_IMAGES[p.id]} alt={p.title}
                  style={{
                    height: "100%", objectFit: "contain", objectPosition: "bottom center",
                    filter: "brightness(1.05)", transition: "transform 0.4s ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.3))",
                }} />
              </div>

              {/* Content */}
              <div style={{ padding: "8px 24px 28px" }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: s.accent, fontFamily: "Syne", marginBottom: 4, lineHeight: 1.2 }}>
                  {p.title}
                </h2>
                <div style={{ fontSize: 10, color: "#605c52", marginBottom: 14, fontFamily: "Space Mono" }}>
                  {p.subtitle}
                </div>

                <p style={{ fontSize: 11, color: "#9a9488", lineHeight: 1.6, marginBottom: 16, minHeight: 50 }}>
                  {p.description}
                </p>

                {/* Feature tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginBottom: 18 }}>
                  {p.features.slice(0, 4).map(f => (
                    <span key={f} style={{
                      fontSize: 8, padding: "3px 8px", borderRadius: 6,
                      background: s.tagBg, border: `1px solid ${s.tagBorder}`,
                      color: s.tagColor, fontWeight: 600,
                    }}>{f}</span>
                  ))}
                </div>

                {/* CTA */}
                <div style={{
                  padding: "11px 0", borderRadius: 12,
                  background: s.btnBg,
                  color: s.btnText, fontWeight: 800, fontSize: 13,
                  fontFamily: "Syne", letterSpacing: "0.02em",
                  transition: "all 0.2s",
                }}>
                  Commencer →
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 36, fontSize: 9, color: "#3a3830", textAlign: "center", position: "relative", zIndex: 2 }}>
        HoldingVision Pro v1.0 — IKONIK Artisan Créatif — Simulation patrimoniale
      </div>
    </div>
  );
}
