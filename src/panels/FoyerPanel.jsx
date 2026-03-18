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

const SITUATIONS = [
  { id: "couple", label: "Couple (marié/pacsé)", partsAdultes: 2 },
  { id: "celibataire", label: "Célibataire", partsAdultes: 1 },
  { id: "parent_isole", label: "Parent isolé", partsAdultes: 1.5 },
];

// Calcul parts fiscales : 
// Couple = 2 parts + 0.5 par enfant (1 à partir du 3e)
// Célibataire = 1 part + 0.5 par enfant (1 à partir du 3e)
// Parent isolé = 1.5 parts + 0.5 par enfant (1 à partir du 3e)
function calcPartsFiscales(situation, nbEnfants) {
  const sit = SITUATIONS.find(s => s.id === situation) || SITUATIONS[0];
  let parts = sit.partsAdultes;
  const n = nbEnfants || 0;
  if (n >= 1) parts += 0.5;
  if (n >= 2) parts += 0.5;
  for (let i = 3; i <= n; i++) parts += 1;
  return parts;
}

export default function FoyerPanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};
  
  const situation = d.situation || "couple";
  const nbEnfants = d.nbEnfants || 0;
  const parts = calcPartsFiscales(situation, nbEnfants);
  
  // Auto-update parts fiscales when situation or enfants change
  if (d.partsFiscales !== parts) {
    onData("partsFiscales", parts);
  }

  return (
    <>
      <div className="mb-4">
        <Label>Membres du foyer</Label>
        <input value={d.membres || ""} onChange={e => onData("membres", e.target.value)}
          placeholder="Stéphane, Louise"
          className="input-ikonik w-full text-xs mt-1" />
      </div>

      {/* Situation familiale */}
      <div className="mb-4">
        <Label>Situation</Label>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
          {SITUATIONS.map(s => (
            <button key={s.id} onClick={() => onData("situation", s.id)}
              style={{
                padding: "4px 10px", borderRadius: 6, fontSize: 9, fontWeight: 600,
                fontFamily: "Syne", cursor: "pointer", transition: "all 0.15s",
                background: situation === s.id ? "var(--accent, #1e73be)" : "var(--bg-elevated, #f0f1f6)",
                color: situation === s.id ? "#ffffff" : "var(--tx2, #5a6384)",
                border: `1px solid ${situation === s.id ? "var(--accent, #1e73be)" : "var(--brd, rgba(30,39,74,0.15))"}`,
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nombre d'enfants */}
      <div className="mb-4">
        <Label>Enfants à charge</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <button onClick={() => onData("nbEnfants", Math.max(0, nbEnfants - 1))}
            style={{
              width: 28, height: 28, borderRadius: 6, border: "1px solid var(--brd, rgba(30,39,74,0.15))",
              background: "var(--bg-elevated, #f0f1f6)", color: "var(--tx2, #5a6384)",
              fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>-</button>
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--accent, #1e73be)", fontFamily: "Space Mono", minWidth: 20, textAlign: "center" }}>
            {nbEnfants}
          </span>
          <button onClick={() => onData("nbEnfants", Math.min(10, nbEnfants + 1))}
            style={{
              width: 28, height: 28, borderRadius: 6, border: "1px solid var(--brd, rgba(30,39,74,0.15))",
              background: "var(--bg-elevated, #f0f1f6)", color: "var(--tx2, #5a6384)",
              fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>+</button>
          <span style={{ fontSize: 9, color: "var(--tx3, #9aa0b8)", fontFamily: "Space Mono" }}>
            {parts} parts fiscales
          </span>
        </div>
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
              <ResultRow label="Parts fiscales" value={c.ir.parts} />
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
