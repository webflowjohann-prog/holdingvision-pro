/**
 * HoldingVision Pro — Projections patrimoniales
 * Calcule l'évolution du patrimoine global sur N années.
 */

import { computeFlows } from "./flows.js";
import { calcIFI, calcTRIImmo } from "./fiscal.js";

/**
 * Projette le patrimoine total sur N années.
 * Hypothèse simplifiée: les flux annuels restent constants,
 * les placements capitalisent avec intérêts composés.
 * @param {Array} nodes
 * @param {Array} edges
 * @param {number} years - nombre d'années à projeter
 * @returns {Array} [{year, tresoHolding, totalPlacements, totalVerse, revenuFoyer, isTotal, patrimoineNet}]
 */
export function projectPatrimoine(nodes, edges, years = 15) {
  const { nc, tot } = computeFlows(nodes, edges);
  const proj = [];

  // Données annuelles fixes (on suppose CA constant)
  const tresoAn = tot.treso || 0;
  const isAn = tot.is || 0;
  const revFoyer = nodes.filter(n => n.type === "foyer").reduce((s, n) => s + (nc[n.id]?.inc || 0), 0);
  const margeFoyer = nodes.filter(n => n.type === "foyer").reduce((s, n) => s + (nc[n.id]?.marge || 0), 0);

  // Placements: extraire capital, versement mensuel, rendement net
  const placements = nodes.filter(n => n.type === "placement").map(n => {
    const d = n.data || {};
    const rdmtNet = Math.max(0, ((d.rendement || 3) - (d.fraisAnnuels || 1.6)) / 100);
    return {
      id: n.id,
      label: n.l,
      capital: d.capital || 0,
      versementMensuel: d.versementMensuel || 0,
      rdmtNet,
    };
  });

  // SCI: valeur du bien
  const sciValeur = nodes.filter(n => n.type === "sci").reduce((s, n) => s + (n.data?.bienValeur || 0), 0);

  let cumTreso = 0;
  const placementCum = placements.map(p => ({ ...p, cum: p.capital }));

  for (let y = 1; y <= years; y++) {
    // Trésorerie holding cumule chaque année (simplifié: reste dans la holding)
    cumTreso += tresoAn;

    // Placements: intérêts composés mensuels
    for (const p of placementCum) {
      if (p.rdmtNet > 0 && p.versementMensuel > 0) {
        let cumM = p.cum;
        for (let m = 1; m <= 12; m++) {
          cumM = cumM * (1 + p.rdmtNet / 12) + p.versementMensuel;
        }
        p.cum = Math.round(cumM);
      } else {
        p.cum = Math.round((p.cum + p.versementMensuel * 12) * (1 + p.rdmtNet));
      }
    }

    const totalPlacements = placementCum.reduce((s, p) => s + p.cum, 0);
    const totalVerse = placements.reduce((s, p) => s + p.capital + p.versementMensuel * 12 * y, 0);

    proj.push({
      year: y,
      tresoHolding: cumTreso,
      totalPlacements,
      totalVerse,
      gainsPlacements: totalPlacements - totalVerse,
      sciValeur,
      revenuFoyer: revFoyer,
      isTotal: isAn * y,
      patrimoineNet: cumTreso + totalPlacements + sciValeur,
    });
  }

  return proj;
}

/**
 * Calcule un résumé des KPI pour le dashboard
 */
export function computeKPI(nodes, edges) {
  const { nc, tot, fv } = computeFlows(nodes, edges);

  const revFoyer = nodes.filter(n => n.type === "foyer").reduce((s, n) => s + (nc[n.id]?.inc || 0), 0);
  const margeFoyer = nodes.filter(n => n.type === "foyer").reduce((s, n) => s + (nc[n.id]?.marge || 0), 0);
  const margeMensuelle = nodes.filter(n => n.type === "foyer").reduce((s, n) => s + (nc[n.id]?.margeM || 0), 0);

  const caTotal = nodes.filter(n => n.type === "societe").reduce((s, n) => s + (nc[n.id]?.ca || 0), 0);
  const isTotal = tot.is || 0;
  const chargesTotal = nodes.filter(n => n.type === "societe").reduce((s, n) => s + (nc[n.id]?.chS || 0) + (nc[n.id]?.cotMin || 0), 0);
  const tresoHolding = tot.treso || 0;

  // Taux d'imposition effectif global
  const tauxEffectif = caTotal > 0 ? ((isTotal / caTotal) * 100).toFixed(1) : "0";

  // Flat tax sur dividendes versés au foyer
  const divVersesFoyer = edges.filter(e => e.flow === "dividendes" && nodes.find(n => n.id === e.to)?.type === "foyer")
    .reduce((s, e) => s + (fv[e.id] || 0), 0);
  const flatTaxFoyer = Math.round(divVersesFoyer * 0.30);

  // Patrimoine placements
  const patrimoinePlacements = nodes.filter(n => n.type === "placement").reduce((s, n) => {
    const lp = nc[n.id]?.lastP;
    return s + (lp?.capital || n.data?.capital || 0);
  }, 0);

  // Patrimoine immobilier
  const patrimoineImmo = nodes.filter(n => n.type === "sci").reduce((s, n) => s + (n.data?.bienValeur || 0), 0);

  // IFI
  const dettesImmo = nodes.filter(n => n.type === "emprunt").reduce((s, n) => s + (n.data?.capitalEmprunte || 0), 0);
  const ifi = calcIFI(patrimoineImmo, dettesImmo, 0);

  // TRI moyen des SCI
  const triImmo = nodes.filter(n => n.type === "sci").map(n => {
    const d = n.data || {};
    const valeur = d.bienValeur || 0;
    const loyers = (d.loyersMensuels || 0) * 12;
    const charges = d.chargesAnnuelles || 0;
    if (valeur > 0) return { label: n.l, tri: calcTRIImmo(valeur, loyers, charges, 15, 0) };
    return null;
  }).filter(Boolean);

  // Patrimoine contrats AV
  const patrimoineAV = nodes.filter(n => n.type === "contrat_av").reduce((s, n) => {
    const c = nc[n.id];
    return s + (c?.capitalNet || n.data?.capitalInitial || 0);
  }, 0);

  return {
    caTotal, isTotal, chargesTotal, tresoHolding, tauxEffectif,
    revFoyer, margeFoyer, margeMensuelle,
    divVersesFoyer, flatTaxFoyer,
    patrimoinePlacements, patrimoineImmo, patrimoineAV,
    patrimoineTotal: tresoHolding + patrimoinePlacements + patrimoineImmo + patrimoineAV,
    ifi, triImmo,
    nc, fv, tot,
  };
}
