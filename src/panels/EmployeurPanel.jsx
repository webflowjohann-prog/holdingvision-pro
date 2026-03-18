import { fMoney } from "../lib/format.js";

function Label({ children }) { return <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, marginTop: 12 }}>{children}</div>; }

export default function EmployeurPanel({ node, computed, onData }) {
  const d = node.data || {};
  return (
    <>
      <Label>Salaire brut annuel</Label>
      <input type="number" value={d.salaireBrut || 0} onChange={e => onData("salaireBrut", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Statut du salarié</Label>
      <select value={d.statut || "cadre"} onChange={e => onData("statut", e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }}>
        <option value="cadre">Cadre</option>
        <option value="non_cadre">Non-cadre</option>
        <option value="fonctionnaire">Fonctionnaire</option>
      </select>

      <Label>Intéressement annuel</Label>
      <input type="number" value={d.interessement || 0} onChange={e => onData("interessement", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Participation annuelle</Label>
      <input type="number" value={d.participation || 0} onChange={e => onData("participation", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      {computed && (
        <div style={{ marginTop: 16, padding: 14, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--tx-secondary)", padding: "3px 0" }}>
            <span>Total brut versé</span>
            <span style={{ fontFamily: "Space Mono", fontWeight: 700, color: "var(--tx-primary)" }}>{fMoney(computed.totalBrut)} €/an</span>
          </div>
        </div>
      )}
    </>
  );
}
