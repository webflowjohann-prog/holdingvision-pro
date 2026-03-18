import Slider from "../ui/Slider.jsx";
import Label from "../ui/Label.jsx";
import ResultRow from "../ui/ResultRow.jsx";
import { fMoney } from "../lib/format.js";

const CHARGES = [
  ["loyer", "Loyer", 0, 4000, 50],
  ["voiture", "Voiture", 0, 1500, 25],
  ["energie", "Énergie", 0, 800, 25],
  ["mutuelle", "Mutuelle", 0, 800, 25],
  ["credit", "Crédit", 0, 2000, 50],
  ["divers", "Divers", 0, 2000, 50],
  ["autre1", "Autre", 0, 2000, 50],
];

export default function FoyerPanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};

  return (
    <>
      <div className="mb-4">
        <Label>Membres du foyer</Label>
        <input value={d.membres || ""} onChange={e => onData("membres", e.target.value)}
          placeholder="Johann, Sophie, Louka"
          className="input-ikonik w-full text-xs mt-1" />
      </div>

      <Label>Charges mensuelles</Label>
      {CHARGES.map(([k, lb, mn, mx, s]) => (
        <Slider key={k} label={lb} value={d[k] || 0} min={mn} max={mx} step={s}
          onChange={v => onData(k, v)} suffix="€/m" />
      ))}

      {/* Résultats */}
      {c.inc != null && (
        <div className="mt-4 p-3 bg-[var(--bg-elevated)] rounded-xl">
          <Label>Bilan foyer</Label>
          <ResultRow label="Revenus annuels" value={`${fMoney(c.inc)} €`} bold />
          <ResultRow label="Charges fixes mensuelles" value={`${fMoney(c.chargesFixesMensuelles || c.chM)} €/m`} negative />
          {c.empruntChargeMensuelle > 0 && (
            <ResultRow label="Mensualité emprunt" value={`${fMoney(c.empruntChargeMensuelle)} €/m`} negative />
          )}
          <ResultRow label="Total charges mensuelles" value={`${fMoney(c.chM)} €/m`} negative bold />
          <ResultRow label="Charges annuelles" value={`${fMoney(c.chA)} €`} negative />
          <ResultRow label="Marge annuelle" value={`${fMoney(c.marge)} €`} bold positive={c.marge > 0} negative={c.marge < 0} />
          <ResultRow label="Marge mensuelle" value={`${fMoney(c.margeM)} €/m`} bold positive={c.margeM > 0} negative={c.margeM < 0} />
          
          {/* IR display if computed */}
          {c.ir && (
            <>
              <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
              <ResultRow label="Revenu imposable" value={`${fMoney(c.ir.quotient * c.ir.parts)} €`} />
              <ResultRow label={`Parts fiscales`} value={c.ir.parts} />
              <ResultRow label="TMI (tranche marginale)" value={`${(c.ir.tmi * 100).toFixed(0)} %`} />
              <ResultRow label="IR brut" value={`${fMoney(c.ir.irBrut)} €`} negative />
              {c.ir.decote > 0 && <ResultRow label="Décote" value={`-${fMoney(c.ir.decote)} €`} positive />}
              <ResultRow label="IR net" value={`${fMoney(c.ir.ir)} €`} bold negative />
              <ResultRow label="Taux moyen" value={`${c.ir.tauxMoyen} %`} />
            </>
          )}
        </div>
      )}
    </>
  );
}
