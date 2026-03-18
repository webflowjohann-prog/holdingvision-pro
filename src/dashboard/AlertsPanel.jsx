import { useMemo } from "react";
import { analyzeAlerts } from "../engine/alerts.js";

const SEV_STYLES = {
  critical: { bg: "rgba(240,80,80,0.1)", border: "rgba(240,80,80,0.3)", color: "#f05050", icon: "⚠", label: "CRITIQUE" },
  warning: { bg: "rgba(240,180,60,0.1)", border: "rgba(240,180,60,0.3)", color: "#f0b040", icon: "⚡", label: "ATTENTION" },
  opportunity: { bg: "rgba(64,200,128,0.1)", border: "rgba(64,200,128,0.3)", color: "#40c880", icon: "💡", label: "OPPORTUNITÉ" },
  info: { bg: "rgba(100,160,240,0.1)", border: "rgba(100,160,240,0.3)", color: "#68a0f0", icon: "ℹ", label: "INFO" },
};

export default function AlertsPanel({ nodes, edges }) {
  const alerts = useMemo(() => analyzeAlerts(nodes, edges), [nodes, edges]);

  if (alerts.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>☀️</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#40c880" }}>Météo patrimoniale : au beau fixe</div>
        <div style={{ fontSize: 10, color: "var(--tx-tertiary)", marginTop: 4 }}>Aucune alerte détectée. La structure est optimisée.</div>
      </div>
    );
  }

  // Count by severity
  const counts = { critical: 0, warning: 0, opportunity: 0, info: 0 };
  alerts.forEach(a => counts[a.sev]++);

  // Weather icon based on alerts
  const weather = counts.critical > 0 ? "🌩️" : counts.warning > 0 ? "⛅" : counts.opportunity > 0 ? "🌤️" : "☀️";

  return (
    <div>
      {/* Weather header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
        background: "var(--bg-elevated)", borderRadius: 12, marginBottom: 12,
        border: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 22 }}>{weather}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tx-primary)" }}>
            Météo patrimoniale : {counts.critical > 0 ? "Tempête" : counts.warning > 0 ? "Nuageux" : counts.opportunity > 0 ? "Beau temps, opportunités" : "Au beau fixe"}
          </div>
          <div style={{ fontSize: 9, color: "var(--tx-tertiary)", fontFamily: "Space Mono", marginTop: 2 }}>
            {alerts.length} alerte{alerts.length > 1 ? "s" : ""} :
            {counts.critical > 0 && ` ${counts.critical} critique${counts.critical > 1 ? "s" : ""}`}
            {counts.warning > 0 && ` ${counts.warning} attention`}
            {counts.opportunity > 0 && ` ${counts.opportunity} opportunité${counts.opportunity > 1 ? "s" : ""}`}
            {counts.info > 0 && ` ${counts.info} info`}
          </div>
        </div>
      </div>

      {/* Alerts list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.map((a, i) => {
          const s = SEV_STYLES[a.sev];
          return (
            <div key={i} style={{
              padding: "10px 14px", borderRadius: 10,
              background: s.bg, border: `1px solid ${s.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12 }}>{s.icon}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: s.color, fontFamily: "Space Mono", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
                <span style={{ fontSize: 8, color: "var(--tx-tertiary)", fontFamily: "Space Mono" }}>{a.cat}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: 10, color: "var(--tx-secondary)", lineHeight: 1.5 }}>{a.detail}</div>
              {a.impact && (
                <div style={{ fontSize: 10, fontWeight: 600, color: s.color, marginTop: 4, fontFamily: "Space Mono" }}>{a.impact}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
