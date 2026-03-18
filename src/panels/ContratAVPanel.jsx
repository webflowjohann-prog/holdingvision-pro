import { fMoney } from "../lib/format.js";

function Label({ children }) { return <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, marginTop: 12 }}>{children}</div>; }
function Row({ label, value, bold, negative, positive }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11, color: negative ? "#f08070" : positive ? "#70e890" : "var(--tx-secondary)", fontWeight: bold ? 700 : 400 }}><span>{label}</span><span style={{ fontFamily: "Space Mono", fontWeight: bold ? 700 : 500 }}>{value}</span></div>;
}

export default function ContratAVPanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};

  return (
    <>
      <Label>Capital initial</Label>
      <input type="number" value={d.capitalInitial || 0} onChange={e => onData("capitalInitial", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Versement mensuel</Label>
      <input type="number" value={d.versementMensuel || 0} onChange={e => onData("versementMensuel", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Rendement Fonds Euros (%)</Label>
      <input type="number" step="0.1" value={d.rendementFE || 2.5} onChange={e => onData("rendementFE", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Rendement Unités de Compte (%)</Label>
      <input type="number" step="0.1" value={d.rendementUC || 6} onChange={e => onData("rendementUC", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Part UC (%)</Label>
      <input type="number" value={d.partUC || 50} onChange={e => onData("partUC", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Frais de gestion annuels (%)</Label>
      <input type="number" step="0.1" value={d.fraisGestion || 0.8} onChange={e => onData("fraisGestion", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Frais d'entrée (%)</Label>
      <input type="number" step="0.1" value={d.fraisEntree || 0} onChange={e => onData("fraisEntree", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Âge du contrat (années)</Label>
      <input type="number" value={d.ageContrat || 0} onChange={e => onData("ageContrat", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Âge de l'assuré</Label>
      <input type="number" value={d.ageAssure || 50} onChange={e => onData("ageAssure", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      <Label>Nombre de bénéficiaires</Label>
      <input type="number" value={d.nbBeneficiaires || 1} onChange={e => onData("nbBeneficiaires", +e.target.value)}
        className="input-dark" style={{ width: "100%", marginBottom: 4 }} />

      {/* Résultats */}
      {c.capitalNet != null && (
        <div style={{ marginTop: 16, padding: 14, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <Label>Projection du contrat</Label>
          <Row label="Capital net (après frais entrée)" value={`${fMoney(c.capitalNet)} €`} />
          <Row label="Rendement net annuel" value={`${c.rdmtNet} %`} bold />
          <Row label="Capital à 8 ans" value={`${fMoney(c.capital8ans)} €`} positive />
          <Row label="Capital à 15 ans" value={`${fMoney(c.capital15ans)} €`} positive />
          <Row label="Capital à 20 ans" value={`${fMoney(c.capital20ans)} €`} bold positive />
          {c.gains8ans > 0 && <Row label="Plus-values à 8 ans" value={`+${fMoney(c.gains8ans)} €`} positive />}

          {/* Fiscalité rachat */}
          <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
          <Label>Fiscalité des rachats</Label>
          <Row label="Âge du contrat" value={`${c.ageContrat} an${c.ageContrat > 1 ? "s" : ""}`} />
          <Row label="Régime applicable" value={c.isAvant8ans ? "PFU 30%" : "7,5% + PS 17,2%"} bold />
          {!c.isAvant8ans && (
            <Row label="Abattement annuel" value={`${fMoney(c.abattementAnnuel)} €`} positive />
          )}
          <div style={{ fontSize: 9, color: "var(--tx-tertiary)", marginTop: 4, lineHeight: 1.4, fontStyle: "italic" }}>
            {c.isAvant8ans
              ? "Avant 8 ans : PFU 30% (12,8% IR + 17,2% PS) sur les gains."
              : "Après 8 ans : abattement 4 600€/an (9 200€ couple) puis 7,5% + PS 17,2% sur les gains."}
          </div>

          {/* Transmission */}
          <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
          <Label>Transmission (art. 990 I CGI)</Label>
          <Row label="Bénéficiaires" value={c.nbBeneficiaires} />
          <Row label="Abattement total" value={`${fMoney(c.abattTransmission)} €`} positive />
          <Row label={`(${fMoney(152500)} € × ${c.nbBeneficiaires})`} value="" />
          <Row label="Droits estimés" value={`${fMoney(c.droitsTransmission)} €`} negative={c.droitsTransmission > 0} positive={c.droitsTransmission === 0} />
          <div style={{ fontSize: 9, color: "var(--tx-tertiary)", marginTop: 4, lineHeight: 1.4, fontStyle: "italic" }}>
            Versements avant 70 ans : abattement 152 500€/bénéficiaire (art. 990 I CGI), puis 20% jusqu'à 700 000€, 31,25% au-delà.
            Versements après 70 ans : abattement global 30 500€ (art. 757 B CGI).
          </div>
        </div>
      )}
    </>
  );
}
