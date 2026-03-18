import { useCallback, useState, useRef, useEffect } from "react";

export default function Slider({ label, value, min, max, step, onChange, suffix = "" }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef(null);

  const handleSlider = useCallback((e) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) onChange(v);
  }, [onChange]);

  // Start editing: click on the value
  const startEdit = () => {
    setEditing(true);
    setEditVal(String(value));
  };

  // Confirm edit
  const confirmEdit = () => {
    const v = parseFloat(editVal.replace(/\s/g, "").replace(",", "."));
    if (!isNaN(v)) {
      onChange(Math.max(min, Math.min(max, v)));
    }
    setEditing(false);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditing(false);
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const displayValue = typeof value === "number" && Number.isInteger(value)
    ? Math.round(value).toLocaleString("fr-FR")
    : value;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--tx-tertiary)" }}>{label}</span>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onBlur={confirmEdit}
            onKeyDown={e => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }}
            className="input-dark"
            style={{
              width: 90, padding: "2px 6px", fontSize: 12, fontWeight: 700,
              fontFamily: "Space Mono", textAlign: "right",
              color: "var(--copper, var(--gold-bright, var(--tx-primary)))",
              border: "1px solid var(--copper, var(--gold))",
              borderRadius: 6, background: "var(--bg-elevated)",
            }}
          />
        ) : (
          <span
            onClick={startEdit}
            title="Cliquez pour saisir manuellement"
            style={{
              fontSize: 12, fontWeight: 700, fontFamily: "Space Mono",
              color: "var(--copper, var(--gold-bright, var(--tx-primary)))",
              cursor: "text", padding: "2px 6px", borderRadius: 6,
              transition: "all 0.15s",
              border: "1px solid transparent",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover, var(--border))"; e.currentTarget.style.background = "var(--bg-elevated, rgba(255,255,255,0.03))"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "transparent"; }}
          >
            {displayValue}{suffix ? ` ${suffix}` : ""}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSlider}
        style={{
          width: "100%", height: 4, borderRadius: 4,
          appearance: "none", WebkitAppearance: "none", cursor: "pointer",
          background: `linear-gradient(to right, var(--copper, var(--gold)) 0%, var(--copper, var(--gold)) ${pct}%, var(--border, var(--brd)) ${pct}%, var(--border, var(--brd)) 100%)`,
        }}
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--copper, var(--gold));
          border: 2px solid var(--bg-deep, #0c0b0a);
          box-shadow: 0 0 8px rgba(212,176,98,0.3);
          cursor: pointer;
          transition: transform 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); }
      `}</style>
    </div>
  );
}
