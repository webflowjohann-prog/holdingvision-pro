/**
 * HoldingVision Pro — Météo Patrimoniale / Alertes Intelligentes
 * Analyse la structure et détecte les optimisations possibles.
 */

import { fMoney } from "../lib/format.js";
import { computeKPI } from "./projections.js";

// Alert severity levels
const SEV = { info: "info", warning: "warning", opportunity: "opportunity", critical: "critical" };

// Alert categories
const CAT = { fiscal: "Fiscal", structure: "Structure", placement: "Placement", transmission: "Transmission", cashflow: "Cash-flow" };

export function analyzeAlerts(nodes, edges) {
  const kpi = computeKPI(nodes, edges);
  const alerts = [];

  const societes = nodes.filter(n => n.type === "societe");
  const holdings = nodes.filter(n => n.type === "holding");
  const scis = nodes.filter(n => n.type === "sci");
  const placements = nodes.filter(n => n.type === "placement");
  const contratsAV = nodes.filter(n => n.type === "contrat_av");
  const foyers = nodes.filter(n => n.type === "foyer");
  const personnes = nodes.filter(n => n.type === "personne");
  const emprunts = nodes.filter(n => n.type === "emprunt");

  // ═══ STRUCTURE ═══

  // Pas de holding alors que multiple sociétés
  if (societes.length >= 2 && holdings.length === 0) {
    alerts.push({
      sev: SEV.opportunity, cat: CAT.structure,
      title: "Holding recommandée",
      detail: `Vous avez ${societes.length} sociétés sans holding. Une holding permettrait d'appliquer le régime mère-fille (exonération 95% des dividendes remontés, art. 145/216 CGI) et de centraliser la trésorerie.`,
      impact: `Économie potentielle: ${fMoney(Math.round(kpi.isTotal * 0.3))}€/an d'IS`,
    });
  }

  // Société avec CA élevé sans rémunération
  societes.forEach(s => {
    const d = s.data || {};
    if ((d.ca || 0) > 50000 && (d.remuneration || 0) === 0) {
      alerts.push({
        sev: SEV.warning, cat: CAT.fiscal,
        title: `${s.l}: pas de rémunération`,
        detail: `CA de ${fMoney(d.ca)}€ sans rémunération du dirigeant. Si ${d.forme === "EURL" || d.forme === "SARL" ? "gérant TNS" : "président assimilé salarié"}, attention aux cotisations minimales (${d.forme === "EURL" || d.forme === "SARL" ? "1 100€/an même sans rémunération" : "pas de cotisations si non rémunéré en SASU"}).`,
      });
    }
  });

  // EURL/SARL avec dividendes élevés (>10% du capital = charges sociales)
  societes.forEach(s => {
    const d = s.data || {};
    if ((d.forme === "EURL" || d.forme === "SARL") && (d.ca || 0) > 0) {
      const capital = d.capital || 1000;
      const seuilDiv = capital * 0.1;
      const dist = kpi.nc[s.id]?.dist || 0;
      if (dist > seuilDiv) {
        alerts.push({
          sev: SEV.warning, cat: CAT.fiscal,
          title: `${s.l}: dividendes > 10% du capital`,
          detail: `Dividendes estimés: ${fMoney(dist)}€ dépassent le seuil de 10% du capital (${fMoney(seuilDiv)}€). L'excédent (${fMoney(dist - seuilDiv)}€) sera soumis à charges sociales TNS (~45%) au lieu de la flat tax 30%.`,
          impact: `Surcoût: ~${fMoney(Math.round((dist - seuilDiv) * 0.15))}€ de charges supplémentaires`,
        });
      }
    }
  });

  // ═══ FISCAL ═══

  // IS > 42 500€ (taux marginal 25%)
  societes.concat(holdings).forEach(s => {
    const c = kpi.nc[s.id];
    if (c && c.rAv > 42500) {
      alerts.push({
        sev: SEV.info, cat: CAT.fiscal,
        title: `${s.l}: résultat > 42 500€`,
        detail: `Résultat imposable: ${fMoney(c.rAv)}€. Au-delà de 42 500€, le taux marginal d'IS passe de 15% à 25%. Envisagez d'augmenter la rémunération ou de distribuer davantage pour rester sous le seuil réduit.`,
      });
    }
  });

  // Personne avec TMI élevé sans PER
  personnes.forEach(p => {
    const c = kpi.nc[p.id];
    if (c && c.tmi >= 30) {
      const hasPER = placements.some(pl => (pl.data?.typePlacement === "per"));
      if (!hasPER) {
        const economiePotentielle = Math.min(c.salaireNet * 0.1, 37094) * (c.tmi / 100);
        alerts.push({
          sev: SEV.opportunity, cat: CAT.fiscal,
          title: `${p.data?.prenom || p.l}: TMI ${c.tmi}% sans PER`,
          detail: `Avec un TMI à ${c.tmi}%, un PER permettrait de déduire jusqu'à 10% des revenus (plafond ~37 094€/an) de l'assiette imposable.`,
          impact: `Économie IR potentielle: ~${fMoney(Math.round(economiePotentielle))}€/an`,
        });
      }
    }
  });

  // ═══ PLACEMENTS ═══

  // Assurance-vie > 8 ans : rappeler l'abattement
  contratsAV.forEach(av => {
    const d = av.data || {};
    if ((d.ageContrat || 0) >= 8) {
      alerts.push({
        sev: SEV.info, cat: CAT.placement,
        title: `${av.l}: abattement 8 ans activé`,
        detail: `Le contrat a plus de 8 ans. Les rachats bénéficient de l'abattement annuel de 4 600€ (9 200€ couple) sur les gains, puis taux réduit de 7,5% + PS 17,2%.`,
      });
    }
  });

  // Assurance-vie proche de 150K€ par bénéficiaire
  contratsAV.forEach(av => {
    const c = kpi.nc[av.id];
    const d = av.data || {};
    const capital = c?.capitalNet || d.capitalInitial || 0;
    const nbBenef = d.nbBeneficiaires || 1;
    const seuil = 152500 * nbBenef;
    if (capital > seuil * 0.8 && capital < seuil) {
      alerts.push({
        sev: SEV.info, cat: CAT.transmission,
        title: `${av.l}: proche du seuil 152 500€`,
        detail: `Capital: ${fMoney(capital)}€ approche le seuil d'abattement transmission (${fMoney(seuil)}€ pour ${nbBenef} bénéficiaire${nbBenef > 1 ? "s" : ""}). Au-delà, prélèvement de 20%.`,
      });
    }
    if (capital > seuil) {
      const excedent = capital - seuil;
      const droits = Math.round(excedent * 0.20);
      alerts.push({
        sev: SEV.warning, cat: CAT.transmission,
        title: `${av.l}: dépassement abattement 990 I`,
        detail: `Capital ${fMoney(capital)}€ dépasse l'abattement de ${fMoney(seuil)}€. Excédent: ${fMoney(excedent)}€ taxé à 20% = ${fMoney(droits)}€ de droits. Envisagez d'ajouter des bénéficiaires ou d'ouvrir un second contrat.`,
        impact: `Droits estimés: ${fMoney(droits)}€`,
      });
    }
  });

  // PEA sous-utilisé (capital < 50K€ alors que possible 150K€)
  placements.filter(p => p.data?.typePlacement === "pea").forEach(p => {
    const d = p.data || {};
    if ((d.capital || 0) < 50000) {
      alerts.push({
        sev: SEV.opportunity, cat: CAT.placement,
        title: `${p.l}: PEA sous-utilisé`,
        detail: `Capital PEA: ${fMoney(d.capital || 0)}€ sur un plafond de 150 000€. Après 5 ans, exonération IR totale (seuls les PS 17,2% restent). Le PEA est l'enveloppe la plus avantageuse pour les actions européennes.`,
      });
    }
  });

  // ═══ CASH-FLOW ═══

  // Marge mensuelle négative
  if (kpi.margeMensuelle < 0) {
    alerts.push({
      sev: SEV.critical, cat: CAT.cashflow,
      title: "Marge mensuelle négative",
      detail: `Le foyer dépense plus qu'il ne gagne: marge de ${fMoney(kpi.margeMensuelle)}€/mois. Revoyez les charges ou augmentez les revenus (rémunération, dividendes, loyers).`,
    });
  }

  // Marge mensuelle faible (< 500€)
  if (kpi.margeMensuelle >= 0 && kpi.margeMensuelle < 500) {
    alerts.push({
      sev: SEV.warning, cat: CAT.cashflow,
      title: "Marge mensuelle faible",
      detail: `Marge de seulement ${fMoney(kpi.margeMensuelle)}€/mois. Peu de capacité d'épargne. Envisagez d'optimiser les charges ou d'augmenter les revenus.`,
    });
  }

  // Pas d'épargne de précaution
  if (placements.length === 0 && contratsAV.length === 0) {
    alerts.push({
      sev: SEV.warning, cat: CAT.placement,
      title: "Aucun placement détecté",
      detail: "Aucun placement (AV, PER, PEA) n'est configuré. Il est recommandé de constituer une épargne de précaution (3 à 6 mois de charges) et d'investir le surplus.",
    });
  }

  // ═══ TRANSMISSION ═══

  // Patrimoine > 1.3M€ sans stratégie de donation
  const patrimoineTotal = kpi.patrimoinePlacements + kpi.patrimoineImmo;
  const donations = nodes.filter(n => n.type === "donation");

  // IFI alert
  if (kpi.ifi && kpi.ifi.isAssujetti) {
    alerts.push({
      sev: SEV.critical, cat: CAT.fiscal,
      title: `IFI: ${fMoney(kpi.ifi.ifi)}€/an`,
      detail: `Patrimoine immobilier net: ${fMoney(kpi.ifi.patrimoineNet)}€ (seuil: 1 300 000€). Stratégies de réduction: démembrement de propriété, donation avec réserve d'usufruit, investissement en biens exonérés (forêts, PME), contrat d'assurance-vie (les UC immobilières en AV ne sont pas soumises à l'IFI).`,
      impact: `IFI annuel estimé: ${fMoney(kpi.ifi.ifi)}€`,
    });
  }
  if (patrimoineTotal > 500000 && donations.length === 0) {
    alerts.push({
      sev: SEV.opportunity, cat: CAT.transmission,
      title: "Patrimoine significatif sans stratégie de transmission",
      detail: `Patrimoine estimé: ${fMoney(patrimoineTotal)}€. Envisagez une stratégie de donation-démembrement (barème 669 CGI) pour transmettre progressivement et bénéficier de l'abattement de 100 000€ par enfant tous les 15 ans.`,
    });
  }

  // Sort: critical first, then warnings, then opportunities, then info
  const sevOrder = { critical: 0, warning: 1, opportunity: 2, info: 3 };
  alerts.sort((a, b) => sevOrder[a.sev] - sevOrder[b.sev]);

  return alerts;
}
