import Slider from "../ui/Slider.jsx";
import Label from "../ui/Label.jsx";
import ResultRow from "../ui/ResultRow.jsx";
import { PLACEMENT_TYPES } from "../engine/fiscal.js";
import { fMoney } from "../lib/format.js";

export default function PlacementPanel({ node, computed, onData }) {
  const d = node.data || {};
  const c = computed || {};
  const typePl = d.typePlacement || "av";
  const ptInfo = PLACEMENT_TYPES.find(p => p.id === typePl) || PLACEMENT_TYPES[0];

  return (
    <>
      {/* Type de placement */}
      <div className="mb-4">
        <Label>Type de placement</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {PLACEMENT_TYPES.map(pt => (
            <button key={pt.id} onClick={() => {
              onData("typePlacement", pt.id);
              onData("rendement", pt.rdmtDef);
              onData("fraisAnnuels", pt.frais);
            }}
              className={`px-2 py-1 text-[9px] font-medium rounded-md transition-all ${typePl === pt.id
                ? "bg-[var(--c-placement)]/10 text-[var(--c-placement)] border border-[var(--c-placement)]"
                : "bg-[var(--bg-elevated)] text-[var(--tx2)] border border-[var(--brd)] hover:border-[var(--c-placement)]"}`}>
              {pt.l}
            </button>
          ))}
        </div>
        <div className="text-[9.5px] text-[var(--tx2)] mt-2 leading-relaxed">{ptInfo.d}</div>
      </div>

      <Slider label="Capital initial" value={d.capital || 0} min={0} max={500000} step={1000} onChange={v => onData("capital", v)} suffix="€" />
      <Slider label="Versement mensuel" value={d.versementMensuel || 0} min={0} max={5000} step={50} onChange={v => onData("versementMensuel", v)} suffix="€/m" />
      <Slider label="Rendement brut annuel" value={d.rendement || 3} min={0} max={20} step={0.1} onChange={v => onData("rendement", v)} suffix="%" />
      <Slider label="Frais annuels" value={d.fraisAnnuels || 1.6} min={0} max={5} step={0.1} onChange={v => onData("fraisAnnuels", v)} suffix="%" />
      <Slider label="Durée (années)" value={d.duree || 10} min={1} max={30} step={1} onChange={v => onData("duree", v)} suffix="ans" />

      {/* Résumé intérêts composés */}
      {c.lastP && (
        <div className="mt-4 p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--c-placement)]/15">
          <Label>Intérêts composés</Label>
          <ResultRow label="Capital final" value={`${fMoney(c.lastP.capital)} €`} bold positive />
          <ResultRow label="Total versé" value={`${fMoney(c.lastP.totalVerse)} €`} />
          <ResultRow label="Gains bruts" value={`+${fMoney(c.lastP.gainBrut)} €`} positive />
          <ResultRow label={`Fiscalité (${c.lastP.fiscLabel})`} value={`-${fMoney(c.lastP.fiscalite)} €`} negative />
          <ResultRow label="Gains nets" value={`+${fMoney(c.lastP.gainNet)} €`} bold positive />
          <div className="mt-2 text-[9.5px] text-[var(--tx2)]">
            Rendement net total: {c.lastP.totalVerse > 0 ? ((c.lastP.gainNet / c.lastP.totalVerse) * 100).toFixed(1) : "0"}%
            {" "}soit ~{c.duree > 0 && c.lastP.totalVerse > 0 ? (((c.lastP.gainNet / c.lastP.totalVerse) / c.duree) * 100).toFixed(1) : "0"}%/an
          </div>
        </div>
      )}

      {/* Projection détaillée */}
      {c.proj && c.proj.length > 0 && (
        <div className="mt-4 p-3 bg-[var(--bg-elevated)] rounded-xl">
          <Label>Projection année par année</Label>
          <div className="flex justify-between text-[8px] text-[var(--tx2)] font-semibold uppercase tracking-wider pb-1 border-b border-[var(--brd)]">
            <span className="w-7">An</span>
            <span className="flex-1 text-right">Capital</span>
            <span className="flex-1 text-right">Gains</span>
            <span className="flex-1 text-right">Net fiscal</span>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {c.proj.map(p => (
              <div key={p.y} className="flex justify-between text-[10px] py-1 border-b border-[var(--brd)]">
                <span className="w-7 text-[var(--tx2)]">{p.y}</span>
                <span className="flex-1 text-right font-medium">{fMoney(p.capital)} €</span>
                <span className="flex-1 text-right text-[var(--c-placement)]">+{fMoney(p.gainBrut)} €</span>
                <span className="flex-1 text-right text-[#0d7c5f] font-medium">+{fMoney(p.gainNet)} €</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
