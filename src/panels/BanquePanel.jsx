import Slider from "../ui/Slider.jsx";
import Label from "../ui/Label.jsx";
import ResultRow from "../ui/ResultRow.jsx";
import { fMoney } from "../lib/format.js";

const TYPES_BANQUE = [
  { id: "retail", label: "Banque de détail" },
  { id: "affaires", label: "Banque d'affaires" },
  { id: "privee", label: "Banque privée" },
  { id: "courtier", label: "Courtier en crédit" },
];

const GARANTIES = [
  { id: "hypotheque", label: "Hypothèque" },
  { id: "caution", label: "Caution (Crédit Logement)" },
  { id: "nantissement_av", label: "Nantissement AV" },
  { id: "nantissement_titres", label: "Nantissement titres" },
  { id: "aucune", label: "Sans garantie" },
];

export default function BanquePanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};
  const typeBanque = d.typeBanque || "retail";

  return (
    <>
      {/* IDENTITÉ BANQUE */}
      <Label>Établissement</Label>
      <input type="text" value={d.nomBanque || ""} onChange={e => onData("nomBanque", e.target.value)}
        className="input-ikonik w-full text-xs" style={{ marginBottom: 6 }} placeholder="Ex: CIC, BNP, Crédit Mutuel" />

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4, marginBottom: 8 }}>
        {TYPES_BANQUE.map(t => (
          <button key={t.id} onClick={() => onData("typeBanque", t.id)}
            style={{
              padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 600,
              fontFamily: "Syne", cursor: "pointer", transition: "all 0.15s",
              background: typeBanque === t.id ? "var(--accent, #1e73be)" : "var(--bg-elevated, #1a1a2e)",
              color: typeBanque === t.id ? "#ffffff" : "var(--tx-tertiary, #8a8a9a)",
              border: `1px solid ${typeBanque === t.id ? "var(--accent, #1e73be)" : "var(--border, rgba(255,255,255,0.1))"}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <input type="text" value={d.interlocuteur || ""} onChange={e => onData("interlocuteur", e.target.value)}
        className="input-ikonik w-full text-xs" style={{ marginBottom: 6 }} placeholder="Interlocuteur / Conseiller" />

      {/* ═══ CRÉDIT IMMOBILIER ═══ */}
      <div style={{ marginTop: 8, padding: 10, background: "var(--bg-elevated, rgba(255,255,255,0.03))", borderRadius: 10, border: "1px solid var(--border, rgba(255,255,255,0.06))" }}>
        <Label>Crédit immobilier</Label>
        <Slider label="Capital emprunté" value={d.creditImmoCapital || 0} min={0} max={2000000} step={10000}
          onChange={v => onData("creditImmoCapital", v)} suffix="€" />
        <Slider label="Taux nominal" value={d.creditImmoTaux || 0} min={0} max={8} step={0.05}
          onChange={v => onData("creditImmoTaux", v)} suffix="%" />
        <Slider label="Durée" value={d.creditImmoDuree || 0} min={0} max={30} step={1}
          onChange={v => onData("creditImmoDuree", v)} suffix="ans" />
        <Slider label="Assurance mensuelle" value={d.creditImmoAssurance || 0} min={0} max={300} step={5}
          onChange={v => onData("creditImmoAssurance", v)} suffix="€/m" />

        <div style={{ marginTop: 4 }}>
          <Label>Garantie</Label>
          <select value={d.creditImmoGarantie || "hypotheque"} onChange={e => onData("creditImmoGarantie", e.target.value)}
            className="input-ikonik" style={{ width: "100%", fontSize: 10, padding: "5px 8px" }}>
            {GARANTIES.map(g => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>

        {c.creditImmo && c.creditImmo.mensualite > 0 && (
          <div style={{ marginTop: 8 }}>
            <ResultRow label="Mensualité hors assurance" value={`${fMoney(c.creditImmo.mensualite)} €/m`} />
            <ResultRow label="Mensualité totale" value={`${fMoney(c.creditImmo.mensualiteTotale)} €/m`} bold />
            <ResultRow label="Charge annuelle" value={`${fMoney(c.creditImmo.chargeAnnuelle)} €/an`} negative />
            <ResultRow label="Intérêts An 1" value={`${fMoney(c.creditImmo.interetsAn1)} €`} negative />
            <ResultRow label="Coût total crédit" value={`${fMoney(c.creditImmo.coutTotal)} €`} negative />
            <ResultRow label="TAEG estimé" value={`${c.creditImmo.taeg} %`} />
          </div>
        )}
      </div>

      {/* ═══ CRÉDIT PROFESSIONNEL ═══ */}
      <div style={{ marginTop: 8, padding: 10, background: "var(--bg-elevated, rgba(255,255,255,0.03))", borderRadius: 10, border: "1px solid var(--border, rgba(255,255,255,0.06))" }}>
        <Label>Crédit professionnel</Label>
        <Slider label="Capital" value={d.creditProCapital || 0} min={0} max={1000000} step={5000}
          onChange={v => onData("creditProCapital", v)} suffix="€" />
        <Slider label="Taux" value={d.creditProTaux || 0} min={0} max={10} step={0.1}
          onChange={v => onData("creditProTaux", v)} suffix="%" />
        <Slider label="Durée" value={d.creditProDuree || 0} min={0} max={15} step={1}
          onChange={v => onData("creditProDuree", v)} suffix="ans" />

        {c.creditPro && c.creditPro.mensualite > 0 && (
          <div style={{ marginTop: 8 }}>
            <ResultRow label="Mensualité" value={`${fMoney(c.creditPro.mensualite)} €/m`} bold />
            <ResultRow label="Charge annuelle" value={`${fMoney(c.creditPro.chargeAnnuelle)} €/an`} negative />
            <ResultRow label="Intérêts déductibles An 1" value={`${fMoney(c.creditPro.interetsAn1)} €`} negative />
            <ResultRow label="Coût total" value={`${fMoney(c.creditPro.coutTotal)} €`} negative />
          </div>
        )}
      </div>

      {/* ═══ LIGNE DE TRÉSORERIE ═══ */}
      <div style={{ marginTop: 8, padding: 10, background: "var(--bg-elevated, rgba(255,255,255,0.03))", borderRadius: 10, border: "1px solid var(--border, rgba(255,255,255,0.06))" }}>
        <Label>Ligne de trésorerie / Facilité de caisse</Label>
        <Slider label="Montant autorisé" value={d.ligneTresoMontant || 0} min={0} max={500000} step={5000}
          onChange={v => onData("ligneTresoMontant", v)} suffix="€" />
        <Slider label="Taux débiteur" value={d.ligneTresoTaux || 0} min={0} max={15} step={0.1}
          onChange={v => onData("ligneTresoTaux", v)} suffix="%" />
        <Slider label="Utilisation moyenne" value={d.ligneTresoUtilisation || 0} min={0} max={100} step={5}
          onChange={v => onData("ligneTresoUtilisation", v)} suffix="%" />

        {c.ligneTreso && c.ligneTreso.coutAnnuel > 0 && (
          <div style={{ marginTop: 8 }}>
            <ResultRow label="Encours moyen" value={`${fMoney(c.ligneTreso.encoursMoyen)} €`} />
            <ResultRow label="Coût annuel estimé" value={`${fMoney(c.ligneTreso.coutAnnuel)} €/an`} negative />
            <ResultRow label="Coût mensuel" value={`${fMoney(c.ligneTreso.coutMensuel)} €/m`} negative />
          </div>
        )}
      </div>

      {/* ═══ FRAIS BANCAIRES ═══ */}
      <div style={{ marginTop: 8, padding: 10, background: "var(--bg-elevated, rgba(255,255,255,0.03))", borderRadius: 10, border: "1px solid var(--border, rgba(255,255,255,0.06))" }}>
        <Label>Frais bancaires annuels</Label>
        <Slider label="Tenue de compte pro" value={d.fraisTenueCompte || 0} min={0} max={2000} step={25}
          onChange={v => onData("fraisTenueCompte", v)} suffix="€/an" />
        <Slider label="Commissions mouvement" value={d.fraisCommissions || 0} min={0} max={3000} step={50}
          onChange={v => onData("fraisCommissions", v)} suffix="€/an" />
        <Slider label="Frais carte(s)" value={d.fraisCartes || 0} min={0} max={500} step={10}
          onChange={v => onData("fraisCartes", v)} suffix="€/an" />
        <Slider label="Autres frais" value={d.fraisAutres || 0} min={0} max={2000} step={50}
          onChange={v => onData("fraisAutres", v)} suffix="€/an" />
      </div>

      {/* ═══ RÉSULTATS GLOBAUX ═══ */}
      {c.totalChargeAnnuelle > 0 && (
        <div className="mt-4 p-3 bg-[var(--bg-elevated)] rounded-xl">
          <Label>Synthèse bancaire</Label>

          {c.creditImmo?.chargeAnnuelle > 0 && (
            <ResultRow label="Crédit immobilier" value={`-${fMoney(c.creditImmo.chargeAnnuelle)} €/an`} negative />
          )}
          {c.creditPro?.chargeAnnuelle > 0 && (
            <ResultRow label="Crédit professionnel" value={`-${fMoney(c.creditPro.chargeAnnuelle)} €/an`} negative />
          )}
          {c.ligneTreso?.coutAnnuel > 0 && (
            <ResultRow label="Ligne de trésorerie" value={`-${fMoney(c.ligneTreso.coutAnnuel)} €/an`} negative />
          )}
          {c.totalFrais > 0 && (
            <ResultRow label="Frais bancaires" value={`-${fMoney(c.totalFrais)} €/an`} negative />
          )}

          <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
          <ResultRow label="Charge bancaire totale" value={`-${fMoney(c.totalChargeAnnuelle)} €/an`} bold negative />
          <ResultRow label="Charge mensuelle" value={`-${fMoney(c.totalChargeMensuelle)} €/m`} bold negative />

          {c.totalInteretsDeductibles > 0 && (
            <>
              <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
              <ResultRow label="Intérêts déductibles An 1" value={`${fMoney(c.totalInteretsDeductibles)} €`} positive />
            </>
          )}

          {c.encoursTotalCredit > 0 && (
            <>
              <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
              <Label>Encours</Label>
              <ResultRow label="Encours crédits total" value={`${fMoney(c.encoursTotalCredit)} €`} />
              {c.ligneTreso?.encoursMoyen > 0 && (
                <ResultRow label="+ Ligne trésorerie" value={`${fMoney(c.ligneTreso.encoursMoyen)} €`} />
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
