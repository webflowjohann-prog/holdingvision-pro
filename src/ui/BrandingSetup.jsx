/**
 * HoldingVision Pro — Brand Theme Selector
 * Replaces the old URL-based extraction with 4 hand-crafted brand demos.
 * Each card shows a mini-preview of the full interface in the brand's colors.
 */
import { useState } from "react";
import { getBrandDemos } from "../engine/brandThemes.js";

const DEMOS = getBrandDemos();

export default function BrandingSetup({ profileId, onComplete, onSkip }) {
  const [hoveredId, setHoveredId] = useState(null);

  function handleSelect(demo) {
    onComplete({
      name: demo.name,
      logo: demo.logoUrl,
      themeId: demo.id,
      colors: {
        primary: demo.accent,
        secondary: demo.accentBright,
      },
      sourceUrl: demo.sourceUrl,
    });
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "#0c0b0a",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 40, overflow: "auto",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translate(-50%, -50%)",
        width: 800, height: 800, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,150,80,0.03) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 36, position: "relative", zIndex: 2 }}>
        <div style={{
          fontSize: 11, color: "#605c52", fontFamily: "Space Mono",
          letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase",
        }}>
          Marque blanche
        </div>
        <h2 style={{
          fontFamily: "Instrument Serif", fontSize: 32, color: "#e8e2d8",
          lineHeight: 1.2, marginBottom: 8,
        }}>
          Choisissez votre <span style={{ color: "#c89650" }}>univers</span>
        </h2>
        <p style={{ fontSize: 13, color: "#9a9488", maxWidth: 520, lineHeight: 1.6, margin: "0 auto" }}>
          Sélectionnez une identité visuelle. L'interface entière s'adapte :
          couleurs, logo, PDF, mode présentation.
        </p>
      </div>

      {/* 4 Brand Cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20,
        maxWidth: 900, width: "100%", position: "relative", zIndex: 2,
      }}>
        {DEMOS.map(demo => {
          const isHovered = hoveredId === demo.id;
          const isLight = demo.mode === "light";

          return (
            <button
              key={demo.id}
              onClick={() => handleSelect(demo)}
              onMouseEnter={() => setHoveredId(demo.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                textAlign: "left", padding: 0, borderRadius: 20, overflow: "hidden",
                background: "#1a1918",
                border: `2px solid ${isHovered ? demo.accent : "rgba(255,255,255,0.06)"}`,
                cursor: "pointer", transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                boxShadow: isHovered ? `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${demo.accentGlow}` : "none",
              }}
            >
              {/* Mini interface preview */}
              <div style={{
                height: 180, display: "flex", overflow: "hidden",
                background: demo.canvasBg, position: "relative",
              }}>
                {/* Mini sidebar */}
                <div style={{
                  width: 48, flexShrink: 0,
                  background: demo.sidebarBg,
                  borderRight: `1px solid ${demo.borderAccent || "rgba(255,255,255,0.06)"}`,
                  padding: "10px 6px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}>
                  {/* Logo circle */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, overflow: "hidden",
                    background: isLight ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 8,
                  }}>
                    {demo.logoUrl && !demo.logoUrl.endsWith('.svg') ? (
                      <img src={demo.logoUrl} alt="" style={{ width: 22, height: 22, objectFit: "contain" }}
                        onError={e => { e.target.style.display = "none"; }} />
                    ) : (
                      <div style={{ fontSize: 10, fontWeight: 800, color: demo.sidebarText || "#fff" }}>
                        {demo.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {/* Menu dots */}
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      width: i === 1 ? 28 : 20, height: i === 1 ? 5 : 3, borderRadius: 2,
                      background: i === 1 ? demo.accent : (demo.sidebarTextDim || "rgba(255,255,255,0.2)"),
                      opacity: i === 1 ? 1 : 0.4,
                    }} />
                  ))}
                </div>

                {/* Canvas area */}
                <div style={{ flex: 1, position: "relative", padding: 12 }}>
                  {/* Top bar */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
                    padding: "4px 8px", borderRadius: 6,
                    background: demo.topBarBg || "rgba(0,0,0,0.2)",
                  }}>
                    <div style={{
                      width: 50, height: 4, borderRadius: 2,
                      background: demo.accent, opacity: 0.8,
                    }} />
                    <div style={{ flex: 1 }} />
                    <div style={{
                      padding: "2px 8px", borderRadius: 3, fontSize: 6,
                      background: demo.accent, color: demo.btnText || "#fff",
                      fontWeight: 700,
                    }}>AN</div>
                  </div>

                  {/* Fake nodes */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Holding", "SCI", "Société"].map((label, i) => (
                      <div key={i} style={{
                        padding: "6px 10px", borderRadius: 8,
                        background: demo.nodeBg,
                        border: `1px solid ${i === 0 ? demo.accent : (demo.nodeBorder || "rgba(255,255,255,0.08)")}`,
                        fontSize: 7, fontWeight: 600,
                        color: demo.nodeText || (isLight ? "#1a1a1a" : "#e0e0e0"),
                        boxShadow: i === 0 ? `0 0 8px ${demo.accentGlow}` : "none",
                      }}>
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Fake connection lines */}
                  <svg style={{ position: "absolute", top: 60, left: 60, width: 200, height: 80, opacity: 0.5, pointerEvents: "none" }}>
                    <line x1="30" y1="30" x2="80" y2="50" stroke={demo.accent} strokeWidth="1.5" strokeDasharray="4,3" />
                    <line x1="80" y1="50" x2="150" y2="35" stroke={demo.accent} strokeWidth="1.5" strokeDasharray="4,3" />
                    <circle cx="80" cy="50" r="2" fill={demo.flowParticle} />
                  </svg>

                  {/* Right panel hint */}
                  <div style={{
                    position: "absolute", right: 0, top: 0, bottom: 0, width: 60,
                    background: isLight
                      ? `linear-gradient(90deg, transparent, ${demo.cardBg || "#ffffff"})`
                      : `linear-gradient(90deg, transparent, ${demo.cardBg || "#1a1a1a"})`,
                    display: "flex", flexDirection: "column", justifyContent: "center",
                    alignItems: "flex-end", padding: "0 6px", gap: 4,
                  }}>
                    {[40, 30, 35, 25].map((w, i) => (
                      <div key={i} style={{
                        width: w, height: 3, borderRadius: 1,
                        background: demo.txTertiary || "rgba(128,128,128,0.3)",
                      }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Card info */}
              <div style={{ padding: "16px 20px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  {/* Color dots */}
                  <div style={{ display: "flex", gap: 4 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: demo.accent }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: demo.accentBright }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: demo.sidebarBg, border: "1px solid rgba(255,255,255,0.15)" }} />
                    {demo.secondary && (
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: demo.secondary }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: 8, padding: "2px 8px", borderRadius: 4,
                    background: demo.mode === "light" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                    color: "#9a9488", fontFamily: "Space Mono",
                  }}>
                    {demo.mode === "light" ? "LIGHT" : "DARK"}
                  </span>
                </div>

                <h3 style={{
                  fontSize: 16, fontWeight: 800, color: demo.accent,
                  fontFamily: "Syne", marginBottom: 2,
                }}>
                  {demo.name}
                </h3>
                <p style={{ fontSize: 11, color: "#9a9488", lineHeight: 1.4 }}>
                  {demo.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Skip / Default */}
      <div style={{ textAlign: "center", marginTop: 28, position: "relative", zIndex: 2 }}>
        <button
          onClick={onSkip}
          style={{
            background: "none", border: "none", color: "#605c52",
            fontSize: 12, cursor: "pointer", fontFamily: "Syne",
            textDecoration: "underline", textUnderlineOffset: 3,
          }}
        >
          Garder le thème par défaut (HoldingVision)
        </button>
      </div>
    </div>
  );
}
