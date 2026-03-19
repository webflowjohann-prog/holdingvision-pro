import Slider from "../ui/Slider.jsx";
import Label from "../ui/Label.jsx";
import ResultRow from "../ui/ResultRow.jsx";
import { fMoney } from "../lib/format.js";

const STATUTS = [
  { id: "cadre", label: "Cadre", cotis: "22%" },
  { id: "non_cadre", label: "Non-cadre", cotis: "15.5%" },
  { id: "fonctionnaire", label: "Fonctionnaire", cotis: "15%" },
  { id: "tns", label: "TNS / Indépendant", cotis: "45%" },
  { id: "retraite", label: "Retraité", cotis: "0%" },
  { id: "sans_activite", label: "Sans activité", cotis: "0%" },
];

const SITUATIONS = [
  { id: "celibataire", label: "Célibataire", partsBase: 1 },
  { id: "marie", label: "Marié(e) / Pacsé(e)", partsBase: 2 },
  { id: "divorce", label: "Divorcé(e)", partsBase: 1 },
  { id: "veuf", label: "Veuf(ve)", partsBase: 1 },
  { id: "parent_isole", label: "Parent isolé", partsBase: 1.5 },
];

const REGIMES_MATRIMONIAUX = [
  { id: "communaute_reduite", label: "Communauté réduite aux acquêts" },
  { id: "communaute_universelle", label: "Communauté universelle" },
  { id: "separation", label: "Séparation de biens" },
  { id: "participation_acquets", label: "Participation aux acquêts" },
];

function calcPartsFiscales(situation, nbEnfants) {
  const sit = SITUATIONS.find(s => s.id === situation) || SITUATIONS[0];
  let parts = sit.partsBase;
  const n = nbEnfants || 0;
  if (n >= 1) parts += 0.5;
  if (n >= 2) parts += 0.5;
  for (let i = 3; i <= n; i++) parts += 1;
  return parts;
}

export default function PersonnePanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};

  const situation = d.situation || "celibataire";
  const nbEnfants = d.nbEnfants || 0;
  const parts = calcPartsFiscales(situation, nbEnfants);
  const isMarie = situation === "marie";
  const statut = d.statut || "cadre";
  const isActif = !["retraite", "sans_activite"].includes(statut);
  const isRetraite = statut === "retraite";

  // Auto-sync parts
  if (d.partsFiscales !== parts) {
    onData("partsFiscales", parts);
  }

  return (
    <>
      {/* IDENTITÉ */}
      <Label>Identité</Label>
      <input type="text" value={d.prenom || ""} onChange={e => onData("prenom", e.target.value)}
        className="input-ikonik w-full text-xs" style={{ marginBottom: 6 }} placeholder="Prénom" />

      <Slider label="Âge" value={d.age || 45} min={18} max={99} step={1}
        onChange={v => onData("age", v)} suffix="ans" />

      {/* SITUATION FAMILIALE */}
      <Label>Situation familiale</Label>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4, marginBottom: 8 }}>
        {SITUATIONS.map(s => (
          <button key={s.id} onClick={() => onData("situation", s.id)}
            style={{
              padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 600,
              fontFamily: "Syne", cursor: "pointer", transition: "all 0.15s",
              background: situation === s.id ? "var(--accent, #1e73be)" : "var(--bg-elevated, #1a1a2e)",
              color: situation === s.id ? "#ffffff" : "var(--tx-tertiary, #8a8a9a)",
              border: `1px solid ${situation === s.id ? "var(--accent, #1e73be)" : "var(--border, rgba(255,255,255,0.1))"}`,
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Régime matrimonial si marié */}
      {isMarie && (
        <div style={{ marginBottom: 8 }}>
          <Label>Régime matrimonial</Label>
          <select value={d.regimeMatrimonial || "communaute_reduite"} onChange={e => onData("regimeMatrimonial", e.target.value)}
            className="input-ikonik" style={{ width: "100%", fontSize: 10, padding: "5px 8px" }}>
            {REGIMES_MATRIMONIAUX.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Enfants */}
      <div style={{ marginBottom: 8 }}>
        <Label>Enfants à charge</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <button onClick={() => onData("nbEnfants", Math.max(0, nbEnfants - 1))}
            style={{
              width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border, rgba(255,255,255,0.1))",
              background: "var(--bg-elevated, #1a1a2e)", color: "var(--tx-tertiary, #8a8a9a)",
              fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>-</button>
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--accent, #1e73be)", fontFamily: "Space Mono", minWidth: 20, textAlign: "center" }}>
            {nbEnfants}
          </span>
          <button onClick={() => onData("nbEnfants", Math.min(10, nbEnfants + 1))}
            style={{
              width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border, rgba(255,255,255,0.1))",
              background: "var(--bg-elevated, #1a1a2e)", color: "var(--tx-tertiary, #8a8a9a)",
              fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>+</button>
          <span style={{ fontSize: 9, color: "var(--tx-tertiary, #8a8a9a)", fontFamily: "Space Mono" }}>
            {parts} parts fiscales
          </span>
        </div>
      </div>

      {/* STATUT PROFESSIONNEL */}
      <Label>Statut professionnel</Label>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4, marginBottom: 8 }}>
        {STATUTS.map(s => (
          <button key={s.id} onClick={() => onData("statut", s.id)}
            style={{
              padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 600,
              fontFamily: "Syne", cursor: "pointer", transition: "all 0.15s",
              background: statut === s.id ? "var(--accent, #1e73be)" : "var(--bg-elevated, #1a1a2e)",
              color: statut === s.id ? "#ffffff" : "var(--tx-tertiary, #8a8a9a)",
              border: `1px solid ${statut === s.id ? "var(--accent, #1e73be)" : "var(--border, rgba(255,255,255,0.1))"}`,
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* REVENUS */}
      {isActif && (
        <>
          <Label>Revenus (si pas connecté à un Employeur/Société)</Label>
          <Slider label="Salaire brut annuel" value={d.salaireBrut || 0} min={0} max={200000} step={500}
            onChange={v => onData("salaireBrut", v)} suffix="€" />
        </>
      )}

      {isRetraite && (
        <>
          <Label>Pension de retraite</Label>
          <Slider label="Pension brute annuelle" value={d.pensionBrute || 0} min={0} max={80000} step={500}
            onChange={v => onData("pensionBrute", v)} suffix="€" />
        </>
      )}

      {/* REVENUS COMPLEMENTAIRES */}
      <Label>Revenus complémentaires</Label>
      <Slider label="Revenus fonciers nets" value={d.revenusFonciers || 0} min={0} max={100000} step={500}
        onChange={v => onData("revenusFonciers", v)} suffix="€/an" />
      <Slider label="Autres revenus (pensions, rentes)" value={d.autresRevenus || 0} min={0} max={50000} step={250}
        onChange={v => onData("autresRevenus", v)} suffix="€/an" />

      {/* PATRIMOINE */}
      <Label>Patrimoine</Label>
      <Slider label="Résidence principale" value={d.residencePrincipale || 0} min={0} max={2000000} step={10000}
        onChange={v => onData("residencePrincipale", v)} suffix="€" />
      <Slider label="Épargne disponible" value={d.epargneDisponible || 0} min={0} max={500000} step={5000}
        onChange={v => onData("epargneDisponible", v)} suffix="€" />
      <Slider label="Investissements (hors schéma)" value={d.investissementsHorsSchema || 0} min={0} max={1000000} step={10000}
        onChange={v => onData("investissementsHorsSchema", v)} suffix="€" />

      {/* CHARGES PERSONNELLES */}
      <Label>Charges personnelles mensuelles</Label>
      <Slider label="Loyer / Mensualité RP" value={d.chargeLoyer || 0} min={0} max={5000} step={50}
        onChange={v => onData("chargeLoyer", v)} suffix="€/m" />
      <Slider label="Pension alimentaire versée" value={d.pensionAlimentaire || 0} min={0} max={3000} step={50}
        onChange={v => onData("pensionAlimentaire", v)} suffix="€/m" />

      {/* RÉSULTATS */}
      {(c.salaireBrut > 0 || c.pensionBrute > 0 || c.revenuTotal > 0) && (
        <div className="mt-4 p-3 bg-[var(--bg-elevated)] rounded-xl">
          <Label>Résultats fiscaux</Label>

          {c.salaireBrut > 0 && (
            <>
              <ResultRow label="Salaire brut" value={`${fMoney(c.salaireBrut)} €`} />
              <ResultRow label={`Cotisations (${c.tauxCotis}%)`} value={`-${fMoney(c.cotisations)} €`} negative />
              <ResultRow label="Salaire net" value={`${fMoney(c.salaireNet)} €`} bold />
            </>
          )}

          {c.pensionBrute > 0 && (
            <ResultRow label="Pension brute" value={`${fMoney(c.pensionBrute)} €`} />
          )}

          {c.revenusFonciers > 0 && (
            <ResultRow label="Revenus fonciers" value={`${fMoney(c.revenusFonciers)} €`} />
          )}

          {c.autresRevenus > 0 && (
            <ResultRow label="Autres revenus" value={`${fMoney(c.autresRevenus)} €`} />
          )}

          <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
          <ResultRow label="Revenu imposable" value={`${fMoney(c.revenuImposable || 0)} €`} bold />
          <ResultRow label="Parts fiscales" value={c.parts || 1} />

          {c.ir > 0 && (
            <>
              <ResultRow label="IR (barème progressif)" value={`-${fMoney(c.ir)} €`} negative />
              <ResultRow label="TMI" value={`${c.tmi} %`} />
              <ResultRow label="Taux moyen" value={`${c.tauxMoyen} %`} />
            </>
          )}

          <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
          <ResultRow label="Net après IR" value={`${fMoney(c.netApresIR)} €/an`} bold positive />
          <ResultRow label="Net mensuel" value={`${fMoney(c.netMensuel)} €/mois`} bold positive />

          {(c.chargesPersoMensuelles > 0) && (
            <>
              <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
              <ResultRow label="Charges perso mensuelles" value={`-${fMoney(c.chargesPersoMensuelles)} €/m`} negative />
              <ResultRow label="Disponible mensuel" value={`${fMoney(c.disponibleMensuel)} €/m`} bold positive={c.disponibleMensuel > 0} negative={c.disponibleMensuel < 0} />
            </>
          )}

          {/* Patrimoine total */}
          {c.patrimoineTotal > 0 && (
            <>
              <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "8px 0" }} />
              <Label>Patrimoine estimé</Label>
              <ResultRow label="Patrimoine brut" value={`${fMoney(c.patrimoineTotal)} €`} bold />
            </>
          )}
        </div>
      )}
    </>
  );
}
