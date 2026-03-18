import { fMoney } from "../lib/format.js";

function Label({ children }) { return <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, marginTop: 12 }}>{children}</div>; }
function Row({ label, value, bold, negative, positive }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, color: negative ? "#f08070" : positive ? "#70e890" : "var(--tx-secondary)", fontWeight: bold ? 700 : 400 }}><span>{label}</span><span style={{ fontFamily: "Space Mono", fontWeight: bold ? 700 : 500 }}>{value}</span></div>;
}

export default function CessionPanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};

  return (
    <>
      <Label>Prix de cession</Label>
      <input type="number" value={d.prixCession || 0} onChange={e => onData("prixCession", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Prix d'acquisition</Label>
      <input type="number" value={d.prixAcquisition || 0} onChange={e => onData("prixAcquisition", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Durée de détention (années)</Label>
      <input type="number" value={d.dureeDetention || 0} onChange={e => onData("dureeDetention", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={d.isApportCession || false}
          onChange={e => onData("isApportCession", e.target.checked)}
          style={{ accentColor: "#5080c0" }} />
        <span style={{ fontSize: 11, color: "var(--tx-secondary)" }}>Apport-cession (art. 150-0 B ter CGI)</span>
      </div>

      {d.isApportCession && (
        <div style={{ marginTop: 8, padding: 10, background: "rgba(80,128,192,0.08)", borderRadius: 8, border: "1px solid rgba(80,128,192,0.2)", fontSize: 10, color: "var(--tx-secondary)", lineHeight: 1.5 }}>
          Report d'imposition de la PV. Obligation de réinvestissement de 60% du produit de cession dans une activité économique sous 24 mois. Conditions : détention des titres apportés en contrôle, apport à une société IS contrôlée.
        </div>
      )}

      {c.plusValue != null && (
        <div style={{ marginTop: 16, padding: 14, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <Label>Résultats cession</Label>
          <Row label="Plus-value brute" value={`${fMoney(c.plusValue)} €`} bold />
          {c.isApportCession ? (
            <>
              <Row label="Impôt PV (en report)" value={`${fMoney(c.reportPV)} €`} positive />
              <Row label="Obligation réinvestissement 60%" value={`${fMoney(c.reinvestObligation)} €`} bold />
              <Row label="Délai" value="24 mois" />
            </>
          ) : (
            <>
              <Row label="Flat tax 30%" value={`-${fMoney(c.impotPV)} €`} negative />
              <Row label="Net de cession" value={`${fMoney(c.prixCession - c.impotPV)} €`} bold positive />
            </>
          )}
          <div style={{ marginTop: 8, fontSize: 9, color: "var(--tx-tertiary)", fontStyle: "italic", lineHeight: 1.4 }}>
            {c.articleRef}
          </div>
        </div>
      )}
    </>
  );
}
