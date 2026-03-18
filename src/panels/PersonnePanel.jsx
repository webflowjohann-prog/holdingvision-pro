import { fMoney } from "../lib/format.js";

function Label({ children }) { return <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, marginTop: 12 }}>{children}</div>; }
function Row({ label, value, bold, negative, positive }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, color: negative ? "#f08070" : positive ? "#70e890" : "var(--tx-secondary)", fontWeight: bold ? 700 : 400 }}><span>{label}</span><span style={{ fontFamily: "Space Mono", fontWeight: bold ? 700 : 500 }}>{value}</span></div>;
}

export default function PersonnePanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};

  return (
    <>
      <Label>Prénom</Label>
      <input type="text" value={d.prenom || ""} onChange={e => onData("prenom", e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} placeholder="Ex: Marie" />

      <Label>Statut</Label>
      <select value={d.statut || "cadre"} onChange={e => onData("statut", e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }}>
        <option value="cadre">Cadre (cotis. 22%)</option>
        <option value="non_cadre">Non-cadre (cotis. 15,5%)</option>
        <option value="fonctionnaire">Fonctionnaire (cotis. 15%)</option>
      </select>

      <Label>Parts fiscales</Label>
      <input type="number" step="0.5" value={d.partsFiscales || 1} onChange={e => onData("partsFiscales", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />
      <div style={{ fontSize: 9, color: "var(--tx-tertiary)", marginBottom: 8 }}>
        1 = célibataire, 2 = couple, +0.5 par enfant (1er et 2e), +1 à partir du 3e
      </div>

      <Label>Salaire brut annuel (si pas connecté à un Employeur)</Label>
      <input type="number" value={d.salaireBrut || 0} onChange={e => onData("salaireBrut", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      {c.salaireBrut > 0 && (
        <div style={{ marginTop: 16, padding: 14, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <Label>Décomposition</Label>
          <Row label="Salaire brut" value={`${fMoney(c.salaireBrut)} €`} />
          <Row label={`Cotisations salariales (${c.tauxCotis}%)`} value={`-${fMoney(c.cotisations)} €`} negative />
          <Row label="Salaire net" value={`${fMoney(c.salaireNet)} €`} bold />

          <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
          <Label>Impôt sur le revenu</Label>
          <Row label="IR (barème progressif)" value={`-${fMoney(c.ir)} €`} negative />
          <Row label="TMI" value={`${c.tmi} %`} />
          <Row label="Taux moyen" value={`${c.tauxMoyen} %`} />

          <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
          <Row label="Net après IR" value={`${fMoney(c.netApresIR)} €/an`} bold positive />
          <Row label="Net mensuel" value={`${fMoney(c.netMensuel)} €/mois`} bold positive />
        </div>
      )}
    </>
  );
}
