import Slider from "../ui/Slider.jsx";
import Label from "../ui/Label.jsx";
import ResultRow from "../ui/ResultRow.jsx";
import { fMoney } from "../lib/format.js";

export default function HoldingPanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};

  return (
    <>
      <div className="mb-3 p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--gold)]/15">
        <div className="text-[10px] font-semibold text-[var(--gold)] mb-1">Régime mère-fille</div>
        <div className="text-[9.5px] text-[var(--tx2)] leading-relaxed">
          95% des dividendes reçus exonérés d'IS. Quote-part 5% imposable (art. 145 et 216 CGI). Conditions: détention ≥5% du capital, ≥2 ans.
        </div>
      </div>

      <Slider label="Taux charges fonctionnement" value={d.tauxCharges || 2} min={0} max={20} step={1} onChange={v => onData("tauxCharges", v)} suffix="%" />
      <Slider label="Rémunération président" value={d.remuneration || 0} min={0} max={200000} step={500} onChange={v => onData("remuneration", v)} suffix="€" />
      <Slider label="Taux distribution dividendes" value={d.tauxDistrib || 60} min={0} max={100} step={5} onChange={v => onData("tauxDistrib", v)} suffix="%" />

      {/* Associés */}
      <div className="mt-4 mb-3">
        <Label>Associés de la holding</Label>
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
            <button onClick={() => onData("associes", (d.associes || []).filter((_, j) => j !== i))}
              className="text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        ))}
        <button onClick={() => onData("associes", [...(d.associes || []), { n: "", p: 0 }])}
          className="text-[10px] text-[var(--gold)] hover:underline mt-1">+ Ajouter un associé</button>
      </div>

      {/* Résultats */}
      {c.inc != null && (
        <div className="mt-4 p-3 bg-[var(--bg-elevated)] rounded-xl">
          <Label>Résultats holding</Label>
          <ResultRow label="Dividendes reçus" value={`${fMoney(c.inc)} €`} bold />
          <ResultRow label="Exonérés (95%)" value={`${fMoney(c.exo || 0)} €`} positive />
          <ResultRow label="Base taxable (5%)" value={`${fMoney(Math.round(c.inc * 0.05))} €`} />
          <ResultRow label="IS holding" value={`-${fMoney(c.is)} €`} negative />
          <ResultRow label="Trésorerie nette" value={`${fMoney(c.rNet)} €`} bold positive />
          <ResultRow label="Distribuable" value={`${fMoney(c.dist)} €`} />
          <div className="mt-2 text-[9.5px] text-[var(--tx2)]">
            Taux effectif d'imposition: {c.inc > 0 ? ((c.is / c.inc) * 100).toFixed(2) : "0"}%
          </div>
        </div>
      )}
    </>
  );
}
