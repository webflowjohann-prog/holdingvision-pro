import { fMoney } from "../lib/format.js";

function Label({ children }) { return <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, marginTop: 12 }}>{children}</div>; }
function Row({ label, value, bold, negative, positive }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, color: negative ? "#f08070" : positive ? "#70e890" : "var(--tx-secondary)", fontWeight: bold ? 700 : 400 }}><span>{label}</span><span style={{ fontFamily: "Space Mono", fontWeight: bold ? 700 : 500 }}>{value}</span></div>;
}

export default function DonationPanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};

  return (
    <>
      <Label>Valeur du bien / des titres</Label>
      <input type="number" value={d.valeurBien || 0} onChange={e => onData("valeurBien", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Âge du donateur</Label>
      <input type="number" value={d.ageDonateur || 60} onChange={e => onData("ageDonateur", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Nombre d'enfants bénéficiaires</Label>
      <input type="number" value={d.nbEnfants || 1} onChange={e => onData("nbEnfants", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={d.isDemembre || false}
          onChange={e => onData("isDemembre", e.target.checked)}
          style={{ accentColor: "#4898d0" }} />
        <span style={{ fontSize: 11, color: "var(--tx-secondary)" }}>Donation en nue-propriété (démembrement art. 669 CGI)</span>
      </div>

      {/* Barème 669 */}
      {c.demembrement && d.isDemembre && (
        <div style={{ marginTop: 8, padding: 10, background: "rgba(72,152,208,0.08)", borderRadius: 8, border: "1px solid rgba(72,152,208,0.2)" }}>
          <div style={{ fontSize: 10, color: "var(--tx-secondary)", marginBottom: 6, fontWeight: 600 }}>Barème fiscal art. 669 CGI</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 10, fontFamily: "Space Mono" }}>
            <span style={{ color: "var(--tx-tertiary)" }}>Usufruit ({c.demembrement.usufruit}%)</span>
            <span style={{ color: "var(--tx-secondary)" }}>{fMoney(Math.round((d.valeurBien || 0) * c.demembrement.usufruit / 100))} €</span>
            <span style={{ color: "var(--tx-tertiary)" }}>Nue-propriété ({c.demembrement.nuePropriete}%)</span>
            <span style={{ color: "#4898d0", fontWeight: 700 }}>{fMoney(c.valeurTransmise)} €</span>
          </div>
        </div>
      )}

      {c.droitsTotal != null && (
        <div style={{ marginTop: 16, padding: 14, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <Label>Résultats donation</Label>
          <Row label="Valeur totale" value={`${fMoney(c.valeurBien)} €`} />
          {c.isDemembre && <Row label="Valeur nue-propriété" value={`${fMoney(c.valeurTransmise)} €`} />}
          <Row label={`Par enfant (${c.nbEnfants})`} value={`${fMoney(c.valeurParEnfant)} €`} />
          <Row label="Abattement par enfant" value={`${fMoney(c.droitsParEnfant.abattement)} €`} positive />
          <Row label="Base taxable par enfant" value={`${fMoney(c.droitsParEnfant.base)} €`} />
          <Row label="Droits par enfant" value={`${fMoney(c.droitsParEnfant.droits)} €`} negative />
          <Row label="Droits totaux" value={`${fMoney(c.droitsTotal)} €`} bold negative />
          {c.economie > 0 && (
            <Row label="Économie vs pleine propriété" value={`${fMoney(c.economie)} €`} bold positive />
          )}
          <div style={{ marginTop: 8, fontSize: 9, color: "var(--tx-tertiary)", fontStyle: "italic", lineHeight: 1.4 }}>
            Abattement 100 000€/enfant en ligne directe (art. 779 CGI), renouvelable tous les 15 ans.
            {c.isDemembre ? " Démembrement valorisé selon barème art. 669 CGI." : ""}
          </div>
        </div>
      )}
    </>
  );
}
