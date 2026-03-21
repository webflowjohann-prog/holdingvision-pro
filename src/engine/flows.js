/**
 * HoldingVision Pro — Universal Flow Computation Engine v3
 * 
 * INTELLIGENT FLOW ROUTING:
 * Every connection auto-calculates its amount based on the source node type,
 * target node type, and flow type. The user only needs to create the edge;
 * the engine figures out the correct amount.
 *
 * PASS ORDER:
 * 1. Manual overrides (montantFixe)
 * 2. Loyer distribution (SCI loyers → locataires)
 * 3. CA edges (source → société)
 * 4. Emprunt nodes (feed SCI + foyer)
 * 5. Employeur nodes (feed personne)
 * 6. Personne nodes (feed foyer + fisc)
 * 7. Sociétés (with loyer deductions)
 * 8. SCI (with emprunt intérêts)
 * 9. Holdings (first pass, mère-fille)
 * 10. Cession nodes
 * 11. Donation nodes
 * 12. Placements + Contrats AV
 * 13. Invest/Participation
 * 14. Holdings (second pass, after all flows settled)
 * 15. Foyer (final, receives everything)
 * 16. Fisc (aggregates all taxes)
 * 17. Source + default nodes
 */

import { calcNode } from "./fiscal.js";

export function computeFlows(nodes, edges) {
  const fv = {};  // edge.id → montant
  const nc = {};  // node.id → computed results

  const getInEdges = (nodeId) => edges.filter(e => e.to === nodeId);
  const getOutEdges = (nodeId) => edges.filter(e => e.from === nodeId);
  const findNode = (id) => nodes.find(n => n.id === id);

  const processNode = (n) => {
    const ie = getInEdges(n.id);
    const c = calcNode(n, ie, fv);
    nc[n.id] = c;
    return c;
  };

  // Set outgoing flows based on rules. montantFixe always takes priority.
  const setOutFlows = (nodeId, c, rules) => {
    getOutEdges(nodeId).forEach(e => {
      if (e.montantFixe != null) return; // manual override preserved
      const rule = rules[e.flow];
      if (rule !== undefined) {
        fv[e.id] = typeof rule === "function" ? rule(c, e) : rule;
      }
    });
  };

  // ══════════════════════════════════════════════════
  // PASS 1: Set all manual (montantFixe) amounts
  // ══════════════════════════════════════════════════
  edges.forEach(e => {
    if (e.montantFixe != null) fv[e.id] = e.montantFixe;
  });

  // ══════════════════════════════════════════════════
  // PASS 2: Auto-calculate LOYER flows
  // Edge loyer Société→SCI (auto): amount = SCI.loyersMensuels * 12 / nb locataires
  // Edge loyer SCI→foyer/holding (auto): amount = SCI.loyersMensuels * 12
  // If SCI.loyersMensuels = 0, all auto loyer flows = 0
  // montantFixe edges are NEVER touched (set in PASS 1)
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "sci").forEach(sci => {
    const loyerTotal = (sci.data?.loyersMensuels || 0) * 12;
    
    // Incoming loyer edges (auto only)
    const inLoyerEdges = edges.filter(e => e.to === sci.id && e.flow === "loyer" && e.montantFixe == null);
    if (inLoyerEdges.length > 0) {
      const perLocataire = loyerTotal > 0 ? Math.round(loyerTotal / inLoyerEdges.length) : 0;
      inLoyerEdges.forEach(e => { fv[e.id] = perLocataire; });
    }
    
    // Outgoing loyer edges (auto only)
    const outLoyerEdges = edges.filter(e => e.from === sci.id && e.flow === "loyer" && e.montantFixe == null);
    outLoyerEdges.forEach(e => { fv[e.id] = loyerTotal; });
  });

  // ══════════════════════════════════════════════════
  // PASS 3: CA edges (source → sociétés)
  // ══════════════════════════════════════════════════
  edges.filter(e => e.flow === "ca").forEach(e => {
    if (e.montantFixe != null) return;
    const toNode = findNode(e.to);
    if (toNode?.data?.ca) fv[e.id] = toNode.data.ca;
  });

  // ══════════════════════════════════════════════════
  // PASS 4: Compute EMPRUNT nodes (feed SCI + foyer)
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "emprunt").forEach(n => {
    const c = processNode(n);
    
    getOutEdges(n.id).forEach(e => {
      if (e.montantFixe != null) return;
      const target = findNode(e.to);
      
      if (target?.type === "sci") {
        // Emprunt → SCI: inject intérêts déductibles into SCI
        if (c.interetsAn1 > 0) {
          target.data = { ...target.data, _empruntInterets: c.interetsAn1, _empruntMensualite: c.mensualiteAssurance };
        }
        fv[e.id] = c.mensualiteAnnuelle || 0;
      } else if (target?.type === "foyer") {
        // Emprunt → foyer: charge mensuelle (annualisée)
        fv[e.id] = c.mensualiteAnnuelle || 0;
      } else if (e.flow === "emprunt") {
        fv[e.id] = c.mensualiteAnnuelle || 0;
      } else if (e.flow === "invest") {
        fv[e.id] = c.capital || 0;
      }
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 4b: Compute BANQUE nodes (financing → targets)
  // Banque → SCI: financement immo (inject intérêts déductibles)
  // Banque → Société: crédit pro (inject intérêts déductibles)
  // Banque → Foyer/Personne: charge mensuelle crédit immo
  // Banque → Holding: ligne de trésorerie
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "banque").forEach(n => {
    const c = processNode(n);
    
    getOutEdges(n.id).forEach(e => {
      if (e.montantFixe != null) return;
      const target = findNode(e.to);
      
      if (e.flow === "emprunt" || e.flow === "financement") {
        // Generic emprunt/financement: use credit immo charge
        if (target?.type === "sci") {
          if (c.interetsImmoAn1 > 0) {
            target.data = { ...target.data, _empruntInterets: c.interetsImmoAn1 };
          }
          fv[e.id] = c.mensualiteImmoAnnuelle || 0;
        } else if (target?.type === "foyer" || target?.type === "personne") {
          fv[e.id] = c.mensualiteImmoAnnuelle || 0;
        } else {
          fv[e.id] = c.mensualiteImmoAnnuelle || 0;
        }
      } else if (e.flow === "credit_pro") {
        if (target?.type === "societe" || target?.type === "holding") {
          if (c.interetsProAn1 > 0) {
            target.data = { ...target.data, _creditProInterets: c.interetsProAn1 };
          }
        }
        fv[e.id] = c.mensualiteProAnnuelle || 0;
      } else if (e.flow === "ligne_treso") {
        fv[e.id] = c.ligneTreso?.coutAnnuel || 0;
      } else if (e.flow === "invest") {
        fv[e.id] = c.financementImmo || c.financementPro || 0;
      }
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 5: Compute EMPLOYEURS (salary source → personne)
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "employeur").forEach(n => {
    const c = processNode(n);
    setOutFlows(n.id, c, {
      salaire: (c) => c.salaireBrut || 0,
      autre: (c) => c.totalBrut || 0,
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 6: Compute PERSONNES / SALARIÉS
  // Personne → foyer: net après IR
  // Personne → fisc: IR payé
  // Personne → placement/AV: épargne mensuelle
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "personne").forEach(n => {
    const c = processNode(n);
    setOutFlows(n.id, c, {
      salaire: (c) => c.netApresIR || 0,
      is: (c) => c.ir || 0,
      invest: (c) => c.netApresIR || 0,
      dividendes: (c) => c.netApresIR || 0,
      autre: (c) => c.netApresIR || 0,
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 7: Compute SOCIÉTÉS (with loyer deductions)
  // Société → holding: dividendes (100% du distribuable)
  // Société → foyer: dividendes OU salaire
  // Société → SCI: loyer (déjà calculé en PASS 2)
  // Société → fisc: IS
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "societe").forEach(n => {
    // Sum outgoing loyers (already calculated in PASS 2)
    const loyersSortants = getOutEdges(n.id)
      .filter(e => e.flow === "loyer")
      .reduce((s, e) => s + (fv[e.id] || 0), 0);

    const origData = n.data;
    if (loyersSortants > 0) {
      n.data = { ...origData, _loyersSortants: loyersSortants };
    }

    const c = processNode(n);
    n.data = origData;

    setOutFlows(n.id, c, {
      dividendes: (c) => c.dist || 0,
      salaire: (c) => (c.remN || 0) + (c.ik || 0),
      is: (c) => c.is || 0,
      invest: (c) => c.dist || 0,
      loyer: (c, e) => fv[e.id] || 0,  // preserve PASS 2 calculation
      rendement: (c) => c.dist || 0,
      autre: (c) => c.dist || 0,
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 8: Compute SCI (with emprunt intérêts injected)
  // SCI → holding: dividendes (net IS)
  // SCI → foyer: dividendes or loyer
  // SCI → fisc: IS
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "sci").forEach(n => {
    const empruntInterets = n.data?._empruntInterets || 0;
    const origData = n.data;
    if (empruntInterets > 0 && !(origData.interetsEmprunt > 0)) {
      n.data = { ...origData, interetsEmprunt: empruntInterets };
    }

    const c = processNode(n);
    n.data = origData;

    setOutFlows(n.id, c, {
      dividendes: (c) => c.dist || 0,
      loyer: (c, e) => fv[e.id] || 0,  // preserve PASS 2 calculation
      is: (c) => c.is || 0,
      rendement: (c) => c.dist || 0,
      autre: (c) => c.dist || 0,
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 9: Compute HOLDINGS (first pass)
  // Holding → foyer: dividendes (tauxDistrib)
  // Holding → fisc: IS (mère-fille: 5% taxable)
  // Holding → placement: invest (trésorerie excédentaire)
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "holding").forEach(n => {
    const c = processNode(n);
    setOutFlows(n.id, c, {
      dividendes: (c) => c.dist || 0,
      is: (c) => c.is || 0,
      salaire: (c) => c.remN || 0,
      invest: (c) => Math.round((c.rNet || 0) - (c.dist || 0)),
      rendement: (c) => c.dist || 0,
      autre: (c) => c.dist || 0,
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 10: Compute CESSION nodes
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "cession").forEach(n => {
    const c = processNode(n);
    setOutFlows(n.id, c, {
      cession: (c) => c.prixCession || 0,
      dividendes: (c) => c.dist || 0,
      is: (c) => c.impotPV || 0,
      invest: (c) => c.reinvestObligation || 0,
      autre: (c) => c.dist || 0,
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 11: Compute DONATION nodes
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "donation").forEach(n => {
    const c = processNode(n);
    setOutFlows(n.id, c, {
      donation_flux: (c) => c.valeurTransmise || 0,
      is: (c) => c.droitsTotal || 0,
      autre: (c) => c.valeurTransmise || 0,
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 12: Compute PLACEMENTS + CONTRATS AV
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "placement").forEach(n => { processNode(n); });
  nodes.filter(n => n.type === "contrat_av").forEach(n => { processNode(n); });

  // ══════════════════════════════════════════════════
  // PASS 13: Compute INVEST/PARTICIPATION
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "invest").forEach(n => {
    const c = processNode(n);
    setOutFlows(n.id, c, {
      rendement: (c) => c.revAn || 0,
      dividendes: (c) => c.revAn || 0,
      autre: (c) => c.revAn || 0,
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 14: Re-compute HOLDINGS (after all flows settled)
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "holding").forEach(n => {
    const c = processNode(n);
    setOutFlows(n.id, c, {
      dividendes: (c) => c.dist || 0,
      is: (c) => c.is || 0,
      salaire: (c) => c.remN || 0,
      invest: (c) => Math.round((c.rNet || 0) - (c.dist || 0)),
      rendement: (c) => c.dist || 0,
      autre: (c) => c.dist || 0,
    });
  });

  // ══════════════════════════════════════════════════
  // PASS 15: Compute FOYER (final - receives all flows)
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "foyer").forEach(n => {
    const empruntCharges = getInEdges(n.id)
      .filter(e => findNode(e.from)?.type === "emprunt")
      .reduce((s, e) => s + (fv[e.id] || 0), 0);

    const origData = n.data;
    if (empruntCharges > 0) {
      n.data = { ...origData, _empruntChargeAnnuelle: empruntCharges };
    }

    processNode(n);
    n.data = origData;
  });

  // ══════════════════════════════════════════════════
  // PASS 16: Compute FISC (aggregates all IS + taxes)
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "fisc").forEach(n => {
    nc[n.id] = { inc: getInEdges(n.id).reduce((s, e) => s + (fv[e.id] || 0), 0) };
  });

  // ══════════════════════════════════════════════════
  // PASS 17: Source nodes + defaults
  // ══════════════════════════════════════════════════
  nodes.filter(n => n.type === "source").forEach(n => { nc[n.id] = { inc: 0 }; });
  // Ensure every node has at least an entry
  nodes.forEach(n => { if (!nc[n.id]) nc[n.id] = { inc: getInEdges(n.id).reduce((s, e) => s + (fv[e.id] || 0), 0) }; });

  // ══════════════════════════════════════════════════
  // TOTALS
  // ══════════════════════════════════════════════════
  const treso = nodes.filter(n => n.type === "holding").reduce((s, n) => s + (nc[n.id]?.rNet || 0), 0);
  const totalIS = nodes
    .filter(n => ["societe", "holding", "sci"].includes(n.type))
    .reduce((s, n) => s + (nc[n.id]?.is || 0), 0);
  const sal = nodes.filter(n => n.type === "societe").reduce((s, n) => s + ((nc[n.id]?.remN || 0) + (nc[n.id]?.ik || 0)), 0);
  const totalEmpruntMensuel = nodes.filter(n => n.type === "emprunt").reduce((s, n) => s + (nc[n.id]?.mensualiteAssurance || 0), 0);
  const totalPV = nodes.filter(n => n.type === "cession").reduce((s, n) => s + (nc[n.id]?.plusValue || 0), 0);
  const totalDroitsDonation = nodes.filter(n => n.type === "donation").reduce((s, n) => s + (nc[n.id]?.droitsTotal || 0), 0);

  return {
    fv, nc,
    tot: { treso, is: totalIS, sal, empruntMensuel: totalEmpruntMensuel, plusValues: totalPV, droitsDonation: totalDroitsDonation },
  };
}
