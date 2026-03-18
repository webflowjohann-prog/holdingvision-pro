import { useState, useMemo } from "react";
import { computeKPI } from "../engine/projections.js";
import { fMoney } from "../lib/format.js";

const MODS = [
  { id: "salaire", l: "Ajouter un salaire", defVal: 30000, unit: "€/an", desc: "Ajoute une rémunération au dirigeant de la première société" },
  { id: "ca", l: "Modifier le CA", defVal: 20000, unit: "€", desc: "Augmente le CA de toutes les sociétés" },
  { id: "distribution", l: "Taux distribution holding", defVal: 80, unit: "%", desc: "Change le taux de distribution de la holding" },
  { id: "loyer", l: "Modifier loyers SCI", defVal: 1200, unit: "€/m", desc: "Change le loyer mensuel des SCI" },
  { id: "charges", l: "Modifier charges sociétés", defVal: 15, unit: "%", desc: "Change le taux de charges externes des sociétés" },
  { id: "forme", l: "Passer en SARL (TNS)", defVal: 0, unit: "", desc: "Convertit la première société de SASU en SARL (gérant TNS)" },
];

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function applyModification(nodes, edges, modType, modValue) {
  const nodesB = deepClone(nodes);
  const edgesB = deepClone(edges);
  let label = "";

  switch (modType) {
    case "salaire": {
      const soc = nodesB.find(n => n.type === "societe");
      if (soc) {
        soc.data.remuneration = modValue;
        label = `Salaire ${fMoney(modValue)}€/an`;
        // Ensure a salary edge exists from this société to a foyer
        const foyer = nodesB.find(n => n.type === "foyer");
        if (foyer) {
          const hasSalaryEdge = edgesB.some(e => e.from === soc.id && e.to === foyer.id && e.flow === "salaire");
          if (!hasSalaryEdge) {
            edgesB.push({ id: `_sim_sal_${Date.now()}`, from: soc.id, to: foyer.id, flow: "salaire" });
          }
        }
      }
      break;
    }
    case "ca": {
      nodesB.filter(n => n.type === "societe").forEach(n => {
        n.data.ca = (n.data.ca || 0) + modValue;
      });
      label = `CA +${fMoney(modValue)}€/société`;
      break;
    }
    case "distribution": {
      const hold = nodesB.find(n => n.type === "holding");
      if (hold) {
        hold.data.tauxDistrib = modValue;
        label = `Distribution holding ${modValue}%`;
      }
      break;
    }
    case "loyer": {
      nodesB.filter(n => n.type === "sci").forEach(n => {
        n.data.loyersMensuels = modValue;
      });
      // Also update loyer edges (montantFixe)
      edgesB.filter(e => e.flow === "loyer" && e.montantFixe != null).forEach(e => {
        e.montantFixe = modValue * 12;
      });
      label = `Loyers ${fMoney(modValue)}€/m`;
      break;
    }
    case "charges": {
      nodesB.filter(n => n.type === "societe").forEach(n => {
        n.data.tauxCharges = modValue;
      });
      label = `Charges ${modValue}%`;
      break;
    }
    case "forme": {
      const soc = nodesB.find(n => n.type === "societe");
      if (soc) {
        const wasSASU = soc.data.forme === "SASU" || soc.data.forme === "SAS";
        soc.data.forme = wasSASU ? "SARL" : "SASU";
        label = wasSASU ? "SASU → SARL (TNS)" : "SARL → SASU";
      }
      break;
    }
    default:
      label = "Scénario modifié";
  }

  return { nodes: nodesB, edges: edgesB, label };
}

function compare(kpiA, kpiB) {
  const fields = [
    { key: "caTotal", label: "CA total", fmt: "€" },
    { key: "isTotal", label: "IS total", fmt: "€", invert: true },
    { key: "chargesTotal", label: "Charges sociales", fmt: "€", invert: true },
    { key: "tresoHolding", label: "Trésorerie holding", fmt: "€" },
    { key: "revFoyer", label: "Revenu foyer", fmt: "€" },
    { key: "margeMensuelle", label: "Marge mensuelle foyer", fmt: "€/m" },
    { key: "divVersesFoyer", label: "Dividendes versés foyer", fmt: "€" },
    { key: "flatTaxFoyer", label: "Flat tax foyer", fmt: "€", invert: true },
    { key: "patrimoinePlacements", label: "Patrimoine placements", fmt: "€" },
    { key: "patrimoineImmo", label: "Patrimoine immobilier", fmt: "€" },
    { key: "patrimoineTotal", label: "Patrimoine total", fmt: "€" },
  ];

  return fields.map(f => {
    const vA = kpiA[f.key] || 0;
    const vB = kpiB[f.key] || 0;
    const delta = vB - vA;
    const pct = vA !== 0 ? ((delta / Math.abs(vA)) * 100) : 0;
    const better = f.invert ? delta < 0 : delta > 0;
    return { ...f, vA, vB, delta, pct, better };
  });
}

export default function CompareScenarios({ currentNodes, currentEdges }) {
  const [modType, setModType] = useState("salaire");
  const [modValue, setModValue] = useState(30000);
  const [hasCompared, setHasCompared] = useState(false);
  const [scenarioB, setScenarioB] = useState(null);
  const [labelB, setLabelB] = useState("");

  const kpiA = useMemo(() => computeKPI(currentNodes, currentEdges), [currentNodes, currentEdges]);

  const doCompare = () => {
    const result = applyModification(currentNodes, currentEdges, modType, modValue);
    setScenarioB(result);
    setLabelB(result.label);
    setHasCompared(true);
  };

  const kpiB = useMemo(() => {
    if (!scenarioB) return null;
    return computeKPI(scenarioB.nodes, scenarioB.edges);
  }, [scenarioB]);

  const comparisons = useMemo(() => {
    if (!kpiB) return [];
    return compare(kpiA, kpiB);
  }, [kpiA, kpiB]);

  const winsA = comparisons.filter(c => !c.better && c.delta !== 0).length;
  const winsB = comparisons.filter(c => c.better && c.delta !== 0).length;

  const mod = MODS.find(m => m.id === modType);

  return (
    <div style={{ padding: 24, maxWidth: 920, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "Instrument Serif", fontSize: 24, color: "var(--tx-primary)", marginBottom: 4 }}>Comparaison de scénarios</h2>
      <p style={{ fontSize: 12, color: "var(--tx-tertiary)", marginBottom: 24 }}>Modifiez un paramètre et visualisez l'impact sur toute la structure</p>

      {/* Scenario builder */}
      <div style={{ background: "var(--bg-card)", borderRadius: 14, padding: 20, border: "1px solid var(--border)", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 12 }}>Créer un scénario alternatif</div>
        
        {/* Modification type buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {MODS.map(m => (
            <button key={m.id} onClick={() => { setModType(m.id); setModValue(m.defVal); setHasCompared(false); }}
              style={{
                padding: "6px 14px", fontSize: 10, fontWeight: 600, borderRadius: 8, cursor: "pointer",
                border: modType === m.id ? "1.5px solid var(--copper)" : "1px solid var(--border)",
                background: modType === m.id ? "rgba(200,150,80,0.12)" : "var(--bg-elevated)",
                color: modType === m.id ? "var(--copper-bright)" : "var(--tx-secondary)",
                fontFamily: "Syne", transition: "all 0.15s",
              }}>{m.l}</button>
          ))}
        </div>

        {/* Description */}
        <div style={{ fontSize: 10, color: "var(--tx-tertiary)", marginBottom: 12, lineHeight: 1.5 }}>{mod?.desc}</div>

        {/* Value input */}
        {modType !== "forme" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 10, color: "var(--tx-secondary)" }}>Valeur :</span>
            <input type="number" value={modValue} onChange={e => { setModValue(parseFloat(e.target.value) || 0); setHasCompared(false); }}
              className="input-dark" style={{ width: 140, fontSize: 13, fontWeight: 600, textAlign: "right" }} />
            <span style={{ fontSize: 10, color: "var(--tx-tertiary)" }}>{mod?.unit}</span>
          </div>
        )}

        <button onClick={doCompare}
          style={{
            padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, var(--copper), var(--copper-dim))",
            color: "#0e0d0a", fontWeight: 800, fontSize: 12, fontFamily: "Syne",
          }}>Comparer</button>
      </div>

      {/* Results */}
      {hasCompared && kpiB && (
        <>
          {/* Score cards */}
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={{
              flex: 1, padding: 16, borderRadius: 14,
              border: winsA >= winsB ? "2px solid var(--copper)" : "1px solid var(--border)",
              background: winsA >= winsB ? "rgba(200,150,80,0.05)" : "var(--bg-card)",
            }}>
              <div style={{ fontSize: 10, color: "var(--tx-tertiary)", marginBottom: 4 }}>Configuration actuelle</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: winsA >= winsB ? "var(--copper-bright)" : "var(--tx-secondary)" }}>
                {winsA} avantage{winsA !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: 14, fontWeight: 800, color: "var(--tx-tertiary)" }}>VS</div>
            <div style={{
              flex: 1, padding: 16, borderRadius: 14,
              border: winsB > winsA ? "2px solid var(--copper)" : "1px solid var(--border)",
              background: winsB > winsA ? "rgba(200,150,80,0.05)" : "var(--bg-card)",
            }}>
              <div style={{ fontSize: 10, color: "var(--tx-tertiary)", marginBottom: 4 }}>{labelB}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: winsB > winsA ? "var(--copper-bright)" : "var(--tx-secondary)" }}>
                {winsB} avantage{winsB !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div style={{ background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: "var(--tx-secondary)", borderBottom: "1px solid var(--border)" }}>Indicateur</th>
                  <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600, color: "var(--tx-secondary)", borderBottom: "1px solid var(--border)" }}>Actuel</th>
                  <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600, color: "var(--tx-secondary)", borderBottom: "1px solid var(--border)" }}>{labelB}</th>
                  <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600, color: "var(--tx-secondary)", borderBottom: "1px solid var(--border)" }}>Delta</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map(c => (
                  <tr key={c.key} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 16px", fontWeight: 500, color: "var(--tx-primary)" }}>{c.label}</td>
                    <td style={{ padding: "8px 16px", textAlign: "right", fontFamily: "Space Mono", color: "var(--tx-secondary)" }}>{fMoney(c.vA)} {c.fmt}</td>
                    <td style={{ padding: "8px 16px", textAlign: "right", fontFamily: "Space Mono", color: "var(--tx-secondary)" }}>{fMoney(c.vB)} {c.fmt}</td>
                    <td style={{
                      padding: "8px 16px", textAlign: "right", fontFamily: "Space Mono", fontWeight: 700,
                      color: c.delta === 0 ? "var(--tx-tertiary)" : c.better ? "#40c880" : "#f07060",
                    }}>
                      {c.delta > 0 ? "+" : ""}{fMoney(c.delta)} {c.fmt}
                      {c.pct !== 0 && (
                        <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>
                          ({c.pct > 0 ? "+" : ""}{c.pct.toFixed(1)}%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Analysis */}
          <div style={{ padding: 16, background: "var(--bg-elevated)", borderRadius: 14, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 8 }}>Analyse automatique</div>
            <div style={{ fontSize: 11, color: "var(--tx-secondary)", lineHeight: 1.6 }}>
              {winsB > winsA && `Le scénario "${labelB}" est plus avantageux sur ${winsB} indicateur${winsB > 1 ? "s" : ""}.`}
              {winsA > winsB && `La configuration actuelle reste plus avantageuse sur ${winsA} indicateur${winsA > 1 ? "s" : ""}.`}
              {winsA === winsB && winsA > 0 && `Les deux scénarios sont équilibrés (${winsA} avantages chacun).`}
              {winsA === 0 && winsB === 0 && `Les deux scénarios sont identiques sur tous les indicateurs.`}
              {(() => {
                const isDelta = comparisons.find(c => c.key === "isTotal")?.delta || 0;
                const margeDelta = comparisons.find(c => c.key === "margeMensuelle")?.delta || 0;
                const tresoDelta = comparisons.find(c => c.key === "tresoHolding")?.delta || 0;
                const parts = [];
                if (isDelta < 0) parts.push(`IS réduit de ${fMoney(Math.abs(isDelta))}€`);
                if (isDelta > 0) parts.push(`IS augmenté de ${fMoney(isDelta)}€`);
                if (margeDelta > 0) parts.push(`marge mensuelle +${fMoney(margeDelta)}€/m`);
                if (margeDelta < 0) parts.push(`marge mensuelle ${fMoney(margeDelta)}€/m`);
                if (tresoDelta > 0) parts.push(`trésorerie holding +${fMoney(tresoDelta)}€`);
                if (tresoDelta < 0) parts.push(`trésorerie holding ${fMoney(tresoDelta)}€`);
                return parts.length > 0 ? ` Points clés : ${parts.join(", ")}.` : "";
              })()}
              {" "}Résultats indicatifs. Consultez un expert-comptable ou avocat fiscaliste pour valider.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
