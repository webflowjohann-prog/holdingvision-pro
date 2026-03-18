import { fMoney } from "../lib/format.js";

function Label({ children }) { return <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, marginTop: 12 }}>{children}</div>; }
function Row({ label, value, bold, negative, positive }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, color: negative ? "#f08070" : positive ? "#70e890" : "var(--tx-secondary)", fontWeight: bold ? 700 : 400 }}><span>{label}</span><span style={{ fontFamily: "Space Mono", fontWeight: bold ? 700 : 500 }}>{value}</span></div>;
}

export default function EmpruntPanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};
  const safeNum = (v) => { const n = +v; return isNaN(n) ? 0 : n; };
  
  return (
    <>
      <Label>Capital emprunté (€)</Label>
      <input type="number" value={d.capitalEmprunte || ""} onChange={e => onData("capitalEmprunte", safeNum(e.target.value))}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} placeholder="150000" />
      
      <Label>Taux d'intérêt annuel (%)</Label>
      <input type="number" step="0.1" value={d.tauxInteret ?? ""} onChange={e => onData("tauxInteret", safeNum(e.target.value))}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} placeholder="3.5" />
      
      <Label>Durée (années)</Label>
      <input type="number" value={d.dureeAns || ""} onChange={e => onData("dureeAns", safeNum(e.target.value))}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} placeholder="20" />
      
      <Label>Assurance mensuelle (€)</Label>
      <input type="number" value={d.assuranceMensuelle || ""} onChange={e => onData("assuranceMensuelle", safeNum(e.target.value))}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} placeholder="30" />
      
      {/* Résultats */}
      {c.mensualite != null && (
        <div style={{ marginTop: 16, padding: 14, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <Label>Résultats mensuels</Label>
          <Row label="Mensualité hors assurance" value={`${fMoney(c.mensualite)} €/mois`} />
          <Row label="Assurance" value={`${fMoney(c.mensualiteAssurance - c.mensualite)} €/mois`} />
          <Row label="Mensualité totale" value={`${fMoney(c.mensualiteAssurance)} €/mois`} bold positive />
          
          <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
          <Label>Impact annuel (flux sur le canvas)</Label>
          <Row label="Charge annuelle totale" value={`${fMoney(c.mensualiteAnnuelle)} €/an`} bold negative />
          <Row label="dont intérêts An 1" value={`${fMoney(c.interetsAn1)} €/an`} negative />
          <Row label="dont capital remboursé An 1" value={`${fMoney((c.mensualiteAnnuelle || 0) - (c.interetsAn1 || 0))} €/an`} />
          
          <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
          <Label>Coût total sur {c.dureeAns} ans</Label>
          <Row label="Capital emprunté" value={`${fMoney(c.capital)} €`} />
          <Row label="Intérêts totaux" value={`${fMoney(c.interetsTotal)} €`} negative />
          <Row label="Assurance totale" value={`${fMoney((c.mensualiteAssurance - c.mensualite) * c.dureeMois)} €`} negative />
          <Row label="Coût total du crédit" value={`${fMoney(c.coutTotal)} €`} bold />
          <Row label="Surcoût vs capital" value={`+${fMoney(c.coutTotal - c.capital)} € (${Math.round((c.coutTotal / c.capital - 1) * 100)}%)`} negative />
          
          {/* Mini tableau amortissement */}
          {c.tableau && c.tableau.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <Label>Tableau d'amortissement</Label>
              <div style={{ maxHeight: 200, overflowY: "auto", fontSize: 9, fontFamily: "Space Mono" }}>
                <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr", gap: 2, color: "var(--tx-tertiary)", paddingBottom: 4, borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                  <span>An</span><span>Capital</span><span>Intérêts</span><span>Restant</span>
                </div>
                {c.tableau.map(row => (
                  <div key={row.annee} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr", gap: 2, color: "var(--tx-secondary)", padding: "2px 0" }}>
                    <span>{row.annee}</span>
                    <span>{fMoney(row.capitalRembourse)}€</span>
                    <span style={{ color: "#f08070" }}>{fMoney(row.interets)}€</span>
                    <span>{fMoney(row.restantDu)}€</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
