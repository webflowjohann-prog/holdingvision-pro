import Slider from "../ui/Slider.jsx";
import Label from "../ui/Label.jsx";
import { FLOWS } from "../lib/constants.js";
import { fMoney } from "../lib/format.js";

export default function EdgePanel({ edge, amount, nodes, onUpdate, onRemove }) {
  const fromNode = nodes.find(n => n.id === edge.from);
  const toNode = nodes.find(n => n.id === edge.to);
  const fl = FLOWS.find(f => f.id === edge.flow);
  const isManual = edge.montantFixe != null;

  return (
    <>
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ background: fl?.c || "#999" }} />
          <span className="text-sm font-semibold">{fl?.l || edge.flow}</span>
        </div>
        <div className="text-xs text-[var(--tx2)]">
          {fromNode?.l || edge.from} → {toNode?.l || edge.to}
        </div>
      </div>

      <div className="text-2xl font-bold mb-4">{fMoney(amount)} €</div>

      {/* Flow type selector */}
      <div className="mb-4">
        <Label>Type de flux</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {FLOWS.map(f => (
            <button key={f.id} onClick={() => onUpdate({ flow: f.id })}
              className={`px-2 py-1 text-[9px] font-medium rounded-md transition-all ${edge.flow === f.id
                ? "bg-[var(--bg-elevated)] text-[var(--tx)] border border-[var(--gold)]"
                : "bg-[var(--bg-elevated)] text-[var(--tx2)] border border-[var(--brd)] hover:border-[var(--gold)]"}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Auto / Manual toggle */}
      <div className="mb-4">
        <Label>Mode de calcul</Label>
        <div className="flex gap-2 mt-1">
          <button onClick={() => {
            const { montantFixe, ...rest } = edge;
            onUpdate({ montantFixe: undefined });
          }}
            className={`flex-1 px-3 py-2 text-[10px] font-medium rounded-lg transition-all ${!isManual
              ? "bg-[rgba(200,150,80,0.1)] text-[var(--gold)] border border-[var(--gold)]"
              : "bg-[var(--bg-elevated)] text-[var(--tx2)] border border-[var(--brd)]"}`}>
            Automatique
          </button>
          <button onClick={() => onUpdate({ montantFixe: amount || 0 })}
            className={`flex-1 px-3 py-2 text-[10px] font-medium rounded-lg transition-all ${isManual
              ? "bg-[rgba(200,150,80,0.1)] text-[var(--gold)] border border-[var(--gold)]"
              : "bg-[var(--bg-elevated)] text-[var(--tx2)] border border-[var(--brd)]"}`}>
            Manuel
          </button>
        </div>
      </div>

      {isManual && (
        <Slider label="Montant fixe" value={edge.montantFixe || 0} min={0} max={200000} step={500}
          onChange={v => onUpdate({ montantFixe: v })} suffix="€/an" />
      )}

      <div className="mt-6">
        <button onClick={onRemove}
          className="w-full px-3 py-2 text-xs text-[var(--c-fisc)] bg-[rgba(240,128,112,0.08)] rounded-lg hover:bg-[rgba(240,128,112,0.15)] transition-colors">
          Supprimer ce flux
        </button>
      </div>
    </>
  );
}
