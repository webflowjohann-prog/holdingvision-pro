import Slider from "../ui/Slider.jsx";
import Label from "../ui/Label.jsx";
import ResultRow from "../ui/ResultRow.jsx";
import { fMoney } from "../lib/format.js";

export default function SCIPanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};
  const isIR = d.forme === "SCI-IR";

  return (
    <>
      {/* IS / IR toggle */}
      <div className="mb-4">
        <Label>Régime fiscal</Label>
        <div className="flex gap-2 mt-1">
          {["SCI-IS", "SCI-IR"].map(f => (
            <button key={f} onClick={() => onData("forme", f)}
              className={`flex-1 px-3 py-2 text-[10px] font-medium rounded-lg transition-all ${d.forme === f
                ? "bg-[var(--bg-elevated)] text-[var(--c-sci)] border border-[var(--c-sci)]"
                : "bg-[var(--bg-elevated)] text-[var(--tx2)] border border-[var(--brd)] hover:border-[var(--c-sci)]"}`}>
              {f === "SCI-IS" ? "IS (Impôt Sociétés)" : "IR (Impôt Revenu)"}
            </button>
          ))}
        </div>
        <div className="text-[9.5px] text-[var(--tx2)] mt-2 leading-relaxed">
          {isIR
            ? "Résultat réparti aux associés, imposé à l'IR. Micro-foncier (abattement 30%) si loyers < 15 000€. Pas d'amortissement."
            : "IS 15% puis 25%. Amortissement du bien déductible. Dividendes: flat tax 30%. Comptabilité commerciale obligatoire."}
        </div>
      </div>

      {isIR && (
        <div className="mb-4">
          <Label>Régime foncier</Label>
          <div className="flex gap-2 mt-1">
            {["micro", "reel"].map(r => (
              <button key={r} onClick={() => onData("regimeFoncier", r)}
                className={`flex-1 px-3 py-1.5 text-[10px] font-medium rounded-lg transition-all ${(d.regimeFoncier || "micro") === r
                  ? "bg-[var(--bg-elevated)] text-[var(--c-sci)] border border-[var(--c-sci)]"
                  : "bg-[var(--bg-elevated)] text-[var(--tx2)] border border-[var(--brd)]"}`}>
                {r === "micro" ? "Micro-foncier (abatt. 30%)" : "Régime réel"}
              </button>
            ))}
          </div>
        </div>
      )}

      <Slider label="Loyers mensuels (locataires externes)" value={d.loyersMensuels || 0} min={0} max={10000} step={50} onChange={v => onData("loyersMensuels", v)} suffix="€/m" />
      <Slider label="Charges annuelles" value={d.chargesAnnuelles || 0} min={0} max={30000} step={250} onChange={v => onData("chargesAnnuelles", v)} suffix="€" />
      <Slider label="Intérêts d'emprunt" value={d.interetsEmprunt || 0} min={0} max={30000} step={250} onChange={v => onData("interetsEmprunt", v)} suffix="€" />
      {!isIR && <Slider label="Amortissement annuel" value={d.amortissement || 0} min={0} max={30000} step={250} onChange={v => onData("amortissement", v)} suffix="€" />}
      <Slider label="Valeur du bien" value={d.bienValeur || 0} min={0} max={2000000} step={10000} onChange={v => onData("bienValeur", v)} suffix="€" />

      {/* Associés */}
      <div className="mt-4 mb-3">
        <Label>Associés SCI (min 2)</Label>
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
          </div>
        ))}
      </div>

      {/* Résultats */}
      {c.totalLoyers != null && (
        <div className="mt-4 p-3 bg-[var(--bg-elevated)] rounded-xl">
          <Label>Résultats SCI</Label>
          <ResultRow label="Loyers totaux" value={`${fMoney((c.totalLoyers || 0) + (c.inc || 0))} €/an`} bold />
          <ResultRow label="Charges" value={`-${fMoney(c.charges || 0)} €`} negative />
          <ResultRow label="Intérêts emprunt" value={`-${fMoney(c.interets || 0)} €`} negative />
          {!isIR && <ResultRow label="Amortissement" value={`-${fMoney(c.amort || 0)} €`} />}
          <ResultRow label={isIR ? "Revenu imposable" : "Résultat avant IS"} value={`${fMoney(c.rAv || 0)} €`} />
          {!isIR && <ResultRow label="IS" value={`-${fMoney(c.is || 0)} €`} negative />}
          {isIR && <ResultRow label="IR estimé (TMI 30%)" value={`-${fMoney(c.irEstime || 0)} €`} negative />}
          {isIR && <ResultRow label="PS 17,2%" value={`-${fMoney(c.psEstime || 0)} €`} negative />}
          <ResultRow label="Net distribuable" value={`${fMoney(c.rNet || 0)} €`} bold positive />
        </div>
      )}
    </>
  );
}
