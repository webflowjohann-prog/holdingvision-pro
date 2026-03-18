/**
 * HoldingVision Pro — Auto-Branding Setup
 * After profile selection, asks for website URL and auto-extracts brand identity.
 * Applies logo, colors, and name to the entire interface.
 */
import { useState, useEffect, useRef } from "react";

const STEPS = {
  URL: "url",
  LOADING: "loading",
  PREVIEW: "preview",
  ERROR: "error",
};

export default function BrandingSetup({ profileId, onComplete, onSkip }) {
  const [step, setStep] = useState(STEPS.URL);
  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState(null);
  const [error, setError] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrimary, setEditPrimary] = useState("");
  const [editSecondary, setEditSecondary] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (step === STEPS.URL && inputRef.current) inputRef.current.focus();
  }, [step]);

  async function handleExtract() {
    if (!url.trim()) return;
    setStep(STEPS.LOADING);
    setError(null);

    try {
      const res = await fetch("/api/brand-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Extraction impossible");
      }

      setBrand(data.brand);
      setEditName(data.brand.name || "");
      setEditPrimary(data.brand.colors?.primary || "#c89650");
      setEditSecondary(data.brand.colors?.secondary || "#70b8f8");
      setStep(STEPS.PREVIEW);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.ERROR);
    }
  }

  function handleConfirm() {
    const finalBrand = {
      name: editName || brand?.name || "Mon Cabinet",
      logo: brand?.logo || null,
      favicon: brand?.favicon || null,
      colors: {
        primary: editPrimary,
        secondary: editSecondary,
        accent: brand?.colors?.accent || editPrimary,
        all: brand?.colors?.all || [editPrimary, editSecondary],
      },
      sourceUrl: url,
    };
    onComplete(finalBrand);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleExtract();
  }

  // ═══ RENDER ═══

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "#0c0b0a",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 40,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,150,80,0.04) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 40, position: "relative", zIndex: 2 }}>
        <div style={{
          fontSize: 11, color: "#605c52", fontFamily: "Space Mono",
          letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase",
        }}>
          Personnalisation marque blanche
        </div>
        <h2 style={{
          fontFamily: "Instrument Serif", fontSize: 32, color: "#e8e2d8",
          lineHeight: 1.2, marginBottom: 8,
        }}>
          Votre identité, <span style={{ color: "#c89650" }}>votre outil</span>
        </h2>
        <p style={{ fontSize: 13, color: "#9a9488", maxWidth: 460, lineHeight: 1.6 }}>
          Entrez l'URL de votre site web. On extrait automatiquement votre logo,
          vos couleurs et votre nom pour personnaliser l'interface.
        </p>
      </div>

      {/* ─── URL INPUT STEP ─── */}
      {step === STEPS.URL && (
        <div className="anim-fade" style={{ width: "100%", maxWidth: 520, position: "relative", zIndex: 2 }}>
          <div style={{
            display: "flex", gap: 10, alignItems: "center",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "6px 6px 6px 20px",
            transition: "border-color 0.2s",
          }}>
            <span style={{ fontSize: 16, color: "#605c52" }}>🌐</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="www.moncabinet.fr"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#e8e2d8", fontSize: 15, fontFamily: "Syne",
                padding: "12px 0",
              }}
            />
            <button
              onClick={handleExtract}
              disabled={!url.trim()}
              style={{
                padding: "12px 28px", borderRadius: 12, border: "none",
                background: url.trim()
                  ? "linear-gradient(135deg, #c89650, #e89040)"
                  : "var(--bg-elevated)",
                color: url.trim() ? "#0e0d0a" : "#605c52",
                fontWeight: 800, fontSize: 13, fontFamily: "Syne",
                cursor: url.trim() ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              Extraire →
            </button>
          </div>

          {/* Skip link */}
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button
              onClick={onSkip}
              style={{
                background: "none", border: "none", color: "#605c52",
                fontSize: 12, cursor: "pointer", fontFamily: "Syne",
                textDecoration: "underline", textUnderlineOffset: 3,
              }}
            >
              Passer cette étape et garder le thème par défaut
            </button>
          </div>
        </div>
      )}

      {/* ─── LOADING STEP ─── */}
      {step === STEPS.LOADING && (
        <div className="anim-fade" style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTopColor: "#c89650",
            animation: "spin 1s linear infinite",
            margin: "0 auto 24px",
          }} />
          <p style={{ color: "#9a9488", fontSize: 14, fontFamily: "Syne" }}>
            Analyse de <span style={{ color: "#c89650" }}>{url}</span>...
          </p>
          <p style={{ color: "#605c52", fontSize: 11, marginTop: 8 }}>
            Extraction du logo, des couleurs et du nom
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ─── PREVIEW STEP ─── */}
      {step === STEPS.PREVIEW && brand && (
        <div className="anim-scale" style={{
          width: "100%", maxWidth: 600, position: "relative", zIndex: 2,
        }}>
          {/* Live preview card */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, padding: 32, marginBottom: 20,
          }}>
            <div style={{
              fontSize: 9, color: "#605c52", fontFamily: "Space Mono",
              letterSpacing: "0.15em", marginBottom: 20, textTransform: "uppercase",
            }}>
              Aperçu de votre marque
            </div>

            {/* Logo + Name row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              {brand.logo && (
                <div style={{
                  width: 64, height: 64, borderRadius: 14,
                  background: "#1c1b18", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", flexShrink: 0,
                }}>
                  <img
                    src={brand.logo}
                    alt="Logo"
                    style={{ maxWidth: 56, maxHeight: 56, objectFit: "contain" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, color: "#605c52", fontFamily: "Space Mono", display: "block", marginBottom: 4 }}>
                  NOM DU CABINET
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="input-dark"
                  style={{ width: "100%", fontSize: 16, fontWeight: 700, padding: "10px 14px" }}
                />
              </div>
            </div>

            {/* Tagline */}
            {brand.tagline && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "var(--bg-input)", border: "1px solid var(--border)",
                marginBottom: 20, fontSize: 12, color: "#9a9488",
                lineHeight: 1.5, fontStyle: "italic",
              }}>
                "{brand.tagline}"
              </div>
            )}

            {/* Color editors */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
              <ColorPicker
                label="Couleur principale"
                value={editPrimary}
                onChange={setEditPrimary}
              />
              <ColorPicker
                label="Couleur secondaire"
                value={editSecondary}
                onChange={setEditSecondary}
              />
            </div>

            {/* All detected colors */}
            {brand.colors?.all?.length > 0 && (
              <div>
                <div style={{ fontSize: 9, color: "#605c52", fontFamily: "Space Mono", marginBottom: 8 }}>
                  COULEURS DÉTECTÉES (cliquer pour appliquer)
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {brand.colors.all.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (!editPrimary || editPrimary === brand.colors.primary) setEditPrimary(c);
                        else setEditSecondary(c);
                      }}
                      style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: c, border: "2px solid var(--border)",
                        cursor: "pointer", transition: "all 0.2s",
                        position: "relative",
                      }}
                      title={c}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live interface preview mini-mockup */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, padding: 24, marginBottom: 24,
          }}>
            <div style={{
              fontSize: 9, color: "#605c52", fontFamily: "Space Mono",
              letterSpacing: "0.15em", marginBottom: 16, textTransform: "uppercase",
            }}>
              Aperçu interface
            </div>
            <div style={{
              background: "#0e0d0b", borderRadius: 12, padding: 16,
              border: "1px solid rgba(255,255,255,0.04)",
            }}>
              {/* Mock toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                {brand.logo && (
                  <img src={brand.logo} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "contain" }}
                    onError={e => { e.target.style.display = "none"; }} />
                )}
                <span style={{ fontFamily: "Instrument Serif", fontSize: 16, color: "#e8e2d8" }}>
                  {editName || "Cabinet"}
                  <span style={{ color: editPrimary }}>Vision</span>
                </span>
                <div style={{ flex: 1 }} />
                <div style={{
                  padding: "4px 12px", borderRadius: 8, fontSize: 10,
                  background: `linear-gradient(135deg, ${editPrimary}, ${editSecondary})`,
                  color: "#0e0d0a", fontWeight: 700,
                }}>
                  Exporter PDF
                </div>
              </div>
              {/* Mock nodes */}
              <div style={{ display: "flex", gap: 8 }}>
                {["Holding", "SCI", "Société A"].map(n => (
                  <div key={n} style={{
                    padding: "8px 14px", borderRadius: 10,
                    background: "#1c1b18",
                    border: `1px solid ${editPrimary}33`,
                    fontSize: 11, color: "#e8e2d8",
                  }}>
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => { setStep(STEPS.URL); setBrand(null); }}
              className="btn-secondary"
              style={{ padding: "12px 24px", borderRadius: 12 }}
            >
              ← Modifier l'URL
            </button>
            <button
              onClick={handleConfirm}
              style={{
                padding: "12px 36px", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${editPrimary}, ${editSecondary || editPrimary})`,
                color: "#0e0d0a", fontWeight: 800, fontSize: 14,
                fontFamily: "Syne", cursor: "pointer",
                boxShadow: `0 8px 32px ${editPrimary}40`,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              Appliquer cette identité ✓
            </button>
          </div>
        </div>
      )}

      {/* ─── ERROR STEP ─── */}
      {step === STEPS.ERROR && (
        <div className="anim-fade" style={{ textAlign: "center", maxWidth: 440, position: "relative", zIndex: 2 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 16px",
            background: "rgba(240,128,112,0.1)", border: "1px solid rgba(240,128,112,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>
            !
          </div>
          <p style={{ color: "#f08070", fontSize: 14, marginBottom: 8 }}>
            Impossible d'analyser ce site
          </p>
          <p style={{ color: "#605c52", fontSize: 12, marginBottom: 24 }}>
            {error}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => setStep(STEPS.URL)}
              className="btn-secondary"
              style={{ padding: "10px 20px", borderRadius: 12 }}
            >
              Réessayer
            </button>
            <button
              onClick={onSkip}
              className="btn-primary"
              style={{ padding: "10px 20px", borderRadius: 12 }}
            >
              Continuer sans personnalisation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Color Picker Sub-component ───

function ColorPicker({ label, value, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{
        fontSize: 9, color: "#605c52", fontFamily: "Space Mono",
        display: "block", marginBottom: 6,
      }}>
        {label.toUpperCase()}
      </label>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--bg-input)", borderRadius: 10,
        border: "1px solid var(--border)", padding: "4px 10px",
      }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 28, height: 28, border: "none", borderRadius: 6,
            cursor: "pointer", padding: 0, background: "transparent",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#e8e2d8", fontSize: 12, fontFamily: "Space Mono",
          }}
        />
        <div style={{
          width: 20, height: 20, borderRadius: 6,
          background: value, border: "1px solid rgba(255,255,255,0.1)",
        }} />
      </div>
    </div>
  );
}
