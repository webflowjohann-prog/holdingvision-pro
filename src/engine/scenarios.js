/**
 * HoldingVision Pro — Comparaison de scénarios
 * Compare deux configurations canvas et affiche les différences.
 */

import { computeKPI } from "./projections.js";

/**
 * Compare deux scénarios et retourne les différences.
 * @param {Object} scenarioA - { nodes, edges, name }
 * @param {Object} scenarioB - { nodes, edges, name }
 * @returns {Object} Comparaison avec deltas
 */
export function compareScenarios(scenarioA, scenarioB) {
  const kpiA = computeKPI(scenarioA.nodes, scenarioA.edges);
  const kpiB = computeKPI(scenarioB.nodes, scenarioB.edges);

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

  const comparisons = fields.map(f => {
    const vA = kpiA[f.key] || 0;
    const vB = kpiB[f.key] || 0;
    const delta = vB - vA;
    const pct = vA !== 0 ? ((delta / Math.abs(vA)) * 100) : 0;
    // invert: for costs, negative delta is good (less tax = better)
    const better = f.invert ? delta < 0 : delta > 0;
    return { ...f, vA, vB, delta, pct, better };
  });

  return {
    nameA: scenarioA.name || "Scénario A",
    nameB: scenarioB.name || "Scénario B",
    comparisons,
    kpiA,
    kpiB,
    // Winner summary
    winsA: comparisons.filter(c => !c.better && c.delta !== 0).length,
    winsB: comparisons.filter(c => c.better && c.delta !== 0).length,
  };
}
