import Slider from "../ui/Slider.jsx";
import Label from "../ui/Label.jsx";
import ResultRow from "../ui/ResultRow.jsx";
import { FORMES, safeFormes } from "../engine/fiscal.js";
import { fMoney } from "../lib/format.js";

const FORME_OPTIONS = ["SASU", "SAS", "EURL", "SARL", "Micro"];

export default function SocietePanel({ node, computed, onData }) {
  const d = node.data || {};
  const fo = safeFormes(d.forme, "SASU");
  const c = computed || {};

  return (
    <>
      {/* Forme juridique */}
      <div className="mb-4">
        <Label>Forme juridique</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {FORME_OPTIONS.map(f => (
            <button key={f} onClick={() => onData("forme", f)}
              style={{
                padding: "5px 12px", fontSize: 10, fontWeight: 600, borderRadius: 8, cursor: "pointer",
                transition: "all 0.2s", fontFamily: "Space Mono",
                border: d.forme === f ? "1.5px solid var(--copper)" : "1px solid var(--border)",
                background: d.forme === f ? "rgba(200,150,80,0.12)" : "var(--bg-elevated)",
                color: d.forme === f ? "var(--copper-bright)" : "var(--tx-secondary)",
              }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "var(--tx-tertiary)", marginTop: 8, lineHeight: 1.5 }}>{fo.d}</div>
      </div>

      {/* CA */}
      <Slider label="Chiffre d'affaires" value={d.ca || 0} min={0} max={500000} step={1000} onChange={v => onData("ca", v)} suffix="€" />
      <Slider label="Rémunération brute" value={d.remuneration || 0} min={0} max={200000} step={500} onChange={v => onData("remuneration", v)} suffix="€" />
      <Slider label="Taux charges externes" value={d.tauxCharges || 10} min={0} max={50} step={1} onChange={v => onData("tauxCharges", v)} suffix="%" />
      <Slider label="Taux distribution dividendes" value={d.tauxDistrib || 80} min={0} max={100} step={5} onChange={v => onData("tauxDistrib", v)} suffix="%" />
      <Slider label="Amortissements" value={d.amortissements || 0} min={0} max={50000} step={500} onChange={v => onData("amortissements", v)} suffix="€" />
      <Slider label="Indemnités kilométriques" value={d.ik || 0} min={0} max={20000} step={100} onChange={v => onData("ik", v)} suffix="€" />

      {/* Associés */}
      <div className="mt-4 mb-3">
        <Label>Associés</Label>
        {(d.associes || []).map((a, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <input value={a.n} onChange={e => {
              const arr = [...(d.associes || [])];
              arr[i] = { ...arr[i], n: e.target.value };
              onData("associes", arr);
            }} className="input-ikonik flex-1 text-xs" placeholder="Nom" />
            <input type="number" value={a.p} onChange={e => {
              const arr = [...(d.associes || [])];
              arr[i] = { ...arr[i], p: parseFloat(e.target.value) || 0 };
              onData("associes", arr);
            }} className="input-ikonik w-16 text-xs text-right" />
            <span className="text-[10px] text-[var(--tx2)]">%</span>
            <button onClick={() => {
              const arr = (d.associes || []).filter((_, j) => j !== i);
              onData("associes", arr);
            }} className="text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        ))}
        <button onClick={() => onData("associes", [...(d.associes || []), { n: "", p: 0 }])}
          className="text-[10px] text-[var(--gold)] hover:underline mt-1">+ Ajouter un associé</button>
      </div>

      {/* Résultats */}
      {c.ca != null && (
        <div style={{ marginTop: 16, padding: 14, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <Label>Résultats fiscaux</Label>
          <ResultRow label="Chiffre d'affaires" value={`${fMoney(c.ca)} €`} bold />
          {c.remN > 0 && <ResultRow label="Rémunération nette" value={`${fMoney(c.remN)} €`} />}
          {c.chS > 0 && <ResultRow label="Charges sociales" value={`${fMoney(c.chS)} €`} negative />}
          {c.loyersPaids > 0 && <ResultRow label="Loyers payés" value={`-${fMoney(c.loyersPaids)} €`} negative />}
          <ResultRow label="Charges externes" value={`-${fMoney(c.chD)} €`} negative />
          {c.am > 0 && <ResultRow label="Amortissements" value={`-${fMoney(c.am)} €`} />}
          {c.ik > 0 && <ResultRow label="IK" value={`-${fMoney(c.ik)} €`} />}
          <ResultRow label="Résultat avant IS" value={`${fMoney(c.rAv)} €`} />
          <ResultRow label="IS" value={`-${fMoney(c.is)} €`} negative />
          <ResultRow label="Résultat net" value={`${fMoney(c.rNet)} €`} bold positive />
          <ResultRow label="Dividendes distribués" value={`${fMoney(c.dist)} €`} bold />
          {c.divFlatTax > 0 && <ResultRow label="Flat tax 30% sur dividendes" value={`-${fMoney(c.divFlatTax)} €`} negative />}
        </div>
      )}
    </>
  );
}
