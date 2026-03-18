/**
 * HoldingVision Pro — Moteur Fiscal Français
 * Pure JavaScript, zero dependencies, fully testable.
 *
 * Sources: Code Général des Impôts, Legalstart 2025/2026, juristes vérifiés.
 */

// ═══ FORMES JURIDIQUES ═══
export const FORMES = {
  SASU: {
    l: "SASU", regime: "assimile", cpNet: 0.82, divCS: false, cotMin: false,
    d: "Président assimilé salarié. Charges 82% du net. Pas de cotisations si non rémunéré. Dividendes: flat tax 30%.",
  },
  SAS: {
    l: "SAS", regime: "assimile", cpNet: 0.82, divCS: false, cotMin: false,
    d: "Multi-associés, assimilés salariés. Charges 82% du net. Dividendes: flat tax 30%.",
  },
  EURL: {
    l: "EURL", regime: "tns", cpNet: 0.45, divCS: true, cotMin: true,
    d: "Gérant TNS. Charges ~45%. Cotisations min ~1 100€/an même sans rémunération. Dividendes > 10% capital: charges 45%.",
  },
  SARL: {
    l: "SARL", regime: "tns", cpNet: 0.45, divCS: true, cotMin: true,
    d: "Gérant majoritaire TNS. Charges ~45%. Cotisations min obligatoires. Dividendes > 10% capital: charges sociales.",
  },
  "SCI-IS": {
    l: "SCI à l'IS", regime: "sci-is", cpNet: 0, divCS: false, cotMin: false,
    d: "SCI soumise à l'IS. IS 15% puis 25%. Amortissement déductible. Dividendes: flat tax 30%.",
  },
  "SCI-IR": {
    l: "SCI à l'IR", regime: "sci-ir", cpNet: 0, divCS: false, cotMin: false,
    d: "SCI transparente. Résultat imposé à l'IR des associés. Micro-foncier: abattement 30% si loyers < 15 000€. Pas d'amortissement.",
  },
  Micro: {
    l: "Micro", regime: "micro", cpNet: 0.222, divCS: false, cotMin: false,
    d: "Prélèvement 22,2% du CA. Pas d'IS. Plafond 77 700€.",
  },
};

export function safeFormes(key, fallback = "SASU") {
  if (FORMES[key]) return FORMES[key];
  if (key === "SCI") return FORMES["SCI-IS"];
  return FORMES[fallback] || FORMES.SASU;
}

// ═══ TYPES D'ENTITÉS ═══
export const ETYPES = [
  // Socle commun
  { id: "societe", l: "Société", icon: "◆", c: "#0d7c5f", brick: "socle" },
  { id: "holding", l: "Holding", icon: "◈", c: "#a08430", brick: "socle" },
  { id: "foyer", l: "Foyer fiscal", icon: "⌂", c: "#2d6ab8", brick: "socle" },
  { id: "sci", l: "SCI Immobilière", icon: "⬡", c: "#6b4fa0", brick: "socle" },
  { id: "placement", l: "Placement / Épargne", icon: "◎", c: "#2a7d3f", brick: "socle" },
  { id: "invest", l: "Participation", icon: "△", c: "#5a7a20", brick: "socle" },
  { id: "fisc", l: "État / Fisc", icon: "▣", c: "#b83d2a", brick: "socle" },
  { id: "source", l: "Source revenus", icon: "○", c: "#6b6a65", brick: "socle" },
  { id: "employeur", l: "Employeur", icon: "⊡", c: "#4a6580", brick: "socle" },
  { id: "personne", l: "Personne / Salarié", icon: "☻", c: "#3a8090", brick: "socle" },
  // Brique Immobilier
  { id: "emprunt", l: "Emprunt bancaire", icon: "⊞", c: "#c07020", brick: "immo" },
  // Brique Juridique
  { id: "cession", l: "Cession / PV", icon: "⇄", c: "#5080c0", brick: "juridique" },
  { id: "donation", l: "Donation / Transmission", icon: "⇢", c: "#4898d0", brick: "juridique" },
  // Brique Assurance
  { id: "contrat_av", l: "Contrat Assurance-vie", icon: "◉", c: "#b060c0", brick: "assurance" },
];

// ═══ TYPES DE FLUX ═══
export const FLOWS = [
  { id: "ca", l: "Chiffre d'affaires", c: "#0d7c5f" },
  { id: "dividendes", l: "Dividendes", c: "#a08430" },
  { id: "salaire", l: "Rémunération", c: "#2d6ab8" },
  { id: "loyer", l: "Loyer", c: "#6b4fa0" },
  { id: "is", l: "Impôts / Taxes", c: "#b83d2a" },
  { id: "invest", l: "Investissement", c: "#2a7d3f" },
  { id: "rendement", l: "Rendement / Intérêts", c: "#5a7a20" },
  { id: "emprunt", l: "Mensualité emprunt", c: "#c07020" },
  { id: "cession", l: "Produit de cession", c: "#5080c0" },
  { id: "donation_flux", l: "Donation", c: "#4898d0" },
  { id: "autre", l: "Autre flux", c: "#6b6a65" },
];

// ═══ TYPES DE PLACEMENTS ═══
export const PLACEMENT_TYPES = [
  { id: "av", l: "Assurance-vie", rdmtDef: 3, frais: 1.6, fiscAvant8: "flat30", fiscApres8: "abatt4600",
    d: "Fonds euros 2,5-3% (garanti) + UC/ETF 4-8%. Abattement 4 600€/an après 8 ans. Transmission hors succession 152 500€/bénéficiaire." },
  { id: "per", l: "PER", rdmtDef: 4, frais: 1.5, fiscEntree: "deductible", fiscSortie: "ir",
    d: "Déduction des versements du revenu imposable (plafond 10% revenus, max ~37 000€). Bloqué jusqu'à la retraite sauf achat RP." },
  { id: "pea", l: "PEA", rdmtDef: 7, frais: 0.5, fiscAvant5: "flat30", fiscApres5: "ps172",
    d: "Actions européennes. Exonération IR après 5 ans (PS 17,2% seuls). Plafond 150 000€." },
  { id: "scpi", l: "SCPI (direct)", rdmtDef: 4.7, frais: 8, fiscalite: "irps",
    d: "Rendement 4,7-9,5%. Fiscalité lourde en direct: IR + PS 17,2%." },
  { id: "avscpi", l: "SCPI via AV", rdmtDef: 5, frais: 1.6, fiscalite: "av",
    d: "SCPI dans assurance-vie: fiscalité AV. TRI cible > 6%/an. Horizon 10 ans minimum." },
  { id: "fonds", l: "Fonds euros", rdmtDef: 2.7, frais: 0.6, fiscalite: "av",
    d: "Capital garanti. Rendement 2,5-3%." },
  { id: "livret", l: "Livret (A/LEP)", rdmtDef: 1.7, frais: 0, fiscalite: "exonere",
    d: "Livret A: 1,7% net. LEP: 2,7% net. Épargne de précaution." },
  { id: "cto", l: "Compte-titres / FPCI", rdmtDef: 7, frais: 0.3, fiscalite: "flat30",
    d: "Actions/PE sans restriction. FPCI fiscal: exonération IR après 5 ans (PS 17,2% seuls)." },
  { id: "crypto", l: "Cryptomonnaies", rdmtDef: 0, frais: 0.5, fiscalite: "flat30",
    d: "Flat tax 30% sur plus-values > 305€/an." },
  { id: "crowdf", l: "Crowdfunding immo", rdmtDef: 10, frais: 0, fiscalite: "flat30",
    d: "Rendements 8-12%, durée 12-36 mois. Risque élevé." },
];

// ═══ FONCTIONS UTILITAIRES ═══

/** Calcul IS barème français: 15% jusqu'à 42 500€, 25% au-delà */
export function calcIS(resultat) {
  if (resultat <= 0) return 0;
  return Math.round(Math.min(resultat, 42500) * 0.15 + Math.max(0, resultat - 42500) * 0.25);
}

// ═══ SIMULATEUR IR COMPLET (Barème progressif 2025) ═══

const IR_TRANCHES = [
  { min: 0, max: 11294, taux: 0 },
  { min: 11294, max: 28797, taux: 0.11 },
  { min: 28797, max: 82341, taux: 0.30 },
  { min: 82341, max: 177106, taux: 0.41 },
  { min: 177106, max: Infinity, taux: 0.45 },
];

/**
 * Calcul IR complet au barème progressif
 * @param {number} revenuNet - Revenu net imposable du foyer
 * @param {number} parts - Nombre de parts fiscales (1, 1.5, 2, 2.5, 3...)
 * @returns {Object} { ir, tmi, tauxMoyen, detailTranches }
 */
export function calcIR(revenuNet, parts = 1) {
  if (revenuNet <= 0) return { ir: 0, tmi: 0, tauxMoyen: 0, detailTranches: [] };
  
  const quotient = revenuNet / parts;
  let irParPart = 0;
  let tmi = 0;
  const detailTranches = [];

  for (const tr of IR_TRANCHES) {
    if (quotient <= tr.min) break;
    const trancheBase = Math.min(quotient, tr.max) - tr.min;
    const montant = Math.round(trancheBase * tr.taux);
    if (trancheBase > 0) {
      detailTranches.push({ min: tr.min, max: Math.min(quotient, tr.max), taux: tr.taux, montant });
      if (tr.taux > 0) tmi = tr.taux;
    }
    irParPart += trancheBase * tr.taux;
  }

  const irBrut = Math.round(irParPart * parts);
  
  // Décote pour petits revenus (seuil 2025 : 1929€ célibataire, 3191€ couple)
  let decote = 0;
  const seuilDecote = parts >= 2 ? 3191 : 1929;
  if (irBrut > 0 && irBrut < seuilDecote) {
    decote = Math.round((parts >= 2 ? 1444 : 873) - irBrut * 0.4525);
    if (decote < 0) decote = 0;
  }

  const ir = Math.max(0, irBrut - decote);
  const tauxMoyen = revenuNet > 0 ? Math.round((ir / revenuNet) * 1000) / 10 : 0;

  return { ir, tmi, tauxMoyen, detailTranches, irBrut, decote, quotient: Math.round(quotient), parts };
}

// ═══ CALCULATEUR EMPRUNT ═══

/**
 * Calcul mensualité d'un emprunt (formule classique)
 * @param {number} capital - Montant emprunté
 * @param {number} tauxAnnuel - Taux d'intérêt annuel (ex: 3.5 pour 3.5%)
 * @param {number} dureeMois - Durée en mois
 * @param {number} assuranceMensuelle - Assurance emprunteur mensuelle
 * @returns {Object} { mensualite, mensualiteAssurance, coutTotal, interetsTotal, tableau }
 */
export function calcEmprunt(capital, tauxAnnuel, dureeMois, assuranceMensuelle = 0) {
  if (capital <= 0 || dureeMois <= 0) return { mensualite: 0, coutTotal: 0, interetsTotal: 0, tableau: [] };
  
  const tauxMensuel = (tauxAnnuel / 100) / 12;
  let mensualite;
  
  if (tauxMensuel === 0) {
    mensualite = capital / dureeMois;
  } else {
    mensualite = capital * tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -dureeMois));
  }
  
  mensualite = Math.round(mensualite * 100) / 100;
  const mensualiteAssurance = mensualite + assuranceMensuelle;
  
  // Tableau d'amortissement (annuel pour simplifier)
  let restant = capital;
  let totalInterets = 0;
  const tableau = [];
  
  for (let annee = 1; annee <= Math.ceil(dureeMois / 12); annee++) {
    const moisDansAnnee = Math.min(12, dureeMois - (annee - 1) * 12);
    let interetsAnnee = 0;
    let capitalAnnee = 0;
    
    for (let m = 0; m < moisDansAnnee; m++) {
      const interetMois = restant * tauxMensuel;
      const capitalMois = mensualite - interetMois;
      interetsAnnee += interetMois;
      capitalAnnee += capitalMois;
      restant -= capitalMois;
    }
    
    totalInterets += interetsAnnee;
    tableau.push({
      annee,
      capitalRembourse: Math.round(capitalAnnee),
      interets: Math.round(interetsAnnee),
      restantDu: Math.max(0, Math.round(restant)),
      assurance: Math.round(assuranceMensuelle * moisDansAnnee),
    });
  }
  
  return {
    mensualite: Math.round(mensualite),
    mensualiteAssurance: Math.round(mensualiteAssurance),
    coutTotal: Math.round(mensualite * dureeMois + assuranceMensuelle * dureeMois),
    interetsTotal: Math.round(totalInterets),
    assuranceTotal: Math.round(assuranceMensuelle * dureeMois),
    tableau,
  };
}

// ═══ IFI (Impôt sur la Fortune Immobilière) ═══

const IFI_TRANCHES = [
  { min: 0, max: 800000, taux: 0 },
  { min: 800000, max: 1300000, taux: 0.005 },
  { min: 1300000, max: 2570000, taux: 0.007 },
  { min: 2570000, max: 5000000, taux: 0.01 },
  { min: 5000000, max: 10000000, taux: 0.0125 },
  { min: 10000000, max: Infinity, taux: 0.015 },
];

/**
 * Calcul IFI (Impôt sur la Fortune Immobilière)
 * Seuil d'imposition: 1 300 000€ de patrimoine immobilier net
 * Abattement 30% sur résidence principale
 * @param {number} patrimoineImmo - Valeur totale du patrimoine immobilier
 * @param {number} dettesImmo - Dettes déductibles (emprunts immobiliers)
 * @param {number} residencePrincipale - Valeur de la résidence principale (abattement 30%)
 * @returns {Object} { ifi, detailTranches, patrimoineNet, isAssujetti }
 */
export function calcIFI(patrimoineImmo, dettesImmo = 0, residencePrincipale = 0) {
  const abattRP = Math.round(residencePrincipale * 0.30);
  const patrimoineNet = patrimoineImmo - dettesImmo - abattRP;
  
  if (patrimoineNet <= 1300000) return { ifi: 0, patrimoineNet, isAssujetti: false, detailTranches: [], abattRP };

  let ifi = 0;
  const detailTranches = [];
  for (const tr of IFI_TRANCHES) {
    if (patrimoineNet <= tr.min) break;
    const base = Math.min(patrimoineNet, tr.max) - tr.min;
    const montant = Math.round(base * tr.taux);
    if (base > 0 && tr.taux > 0) {
      detailTranches.push({ min: tr.min, max: Math.min(patrimoineNet, tr.max), taux: tr.taux * 100, montant });
    }
    ifi += montant;
  }

  // Décote pour patrimoine entre 1,3M€ et 1,4M€
  if (patrimoineNet > 1300000 && patrimoineNet <= 1400000) {
    const decote = 17500 - (1.25 / 100) * patrimoineNet;
    if (decote > 0) ifi = Math.max(0, ifi - Math.round(decote));
  }

  return { ifi: Math.round(ifi), patrimoineNet, isAssujetti: true, detailTranches, abattRP };
}

// ═══ TRI (Taux de Rendement Interne) ═══

/**
 * Calcul du TRI par méthode de Newton-Raphson
 * @param {Array} cashflows - Tableau de flux: [{t: 0, montant: -200000}, {t: 1, montant: 12000}, ...]
 *   t = année, montant négatif = investissement, positif = revenu
 * @param {number} guess - Estimation initiale (default 0.10 = 10%)
 * @returns {number} TRI en pourcentage (ex: 8.5 pour 8.5%)
 */
export function calcTRI(cashflows, guess = 0.10) {
  if (!cashflows || cashflows.length < 2) return 0;

  let rate = guess;
  const maxIter = 100;
  const precision = 0.00001;

  for (let i = 0; i < maxIter; i++) {
    let npv = 0;
    let dnpv = 0; // derivative
    for (const cf of cashflows) {
      const pv = cf.montant / Math.pow(1 + rate, cf.t);
      npv += pv;
      dnpv -= cf.t * cf.montant / Math.pow(1 + rate, cf.t + 1);
    }
    if (Math.abs(npv) < precision) break;
    if (dnpv === 0) break;
    rate = rate - npv / dnpv;
  }

  return Math.round(rate * 1000) / 10; // Return as percentage with 1 decimal
}

/**
 * Calcul TRI simplifié pour un investissement immobilier
 * @param {number} investissement - Montant initial (ex: 200000)
 * @param {number} loyerAnnuel - Loyer net annuel (ex: 9600)
 * @param {number} chargesAnnuelles - Charges annuelles (ex: 2400)
 * @param {number} duree - Durée en années (ex: 15)
 * @param {number} plusValue - Plus-value à la revente (ex: 30000)
 * @returns {number} TRI en pourcentage
 */
export function calcTRIImmo(investissement, loyerAnnuel, chargesAnnuelles, duree, plusValue = 0) {
  const cashflows = [{ t: 0, montant: -investissement }];
  for (let y = 1; y <= duree; y++) {
    const flux = loyerAnnuel - chargesAnnuelles;
    cashflows.push({ t: y, montant: y === duree ? flux + investissement + plusValue : flux });
  }
  return calcTRI(cashflows);
}

// ═══ BARÈME DÉMEMBREMENT ART. 669 CGI ═══

const BAREME_669 = [
  { ageMax: 20, usufruit: 90, nuePropriete: 10 },
  { ageMax: 30, usufruit: 80, nuePropriete: 20 },
  { ageMax: 40, usufruit: 70, nuePropriete: 30 },
  { ageMax: 50, usufruit: 60, nuePropriete: 40 },
  { ageMax: 60, usufruit: 50, nuePropriete: 50 },
  { ageMax: 70, usufruit: 40, nuePropriete: 60 },
  { ageMax: 80, usufruit: 30, nuePropriete: 70 },
  { ageMax: 90, usufruit: 20, nuePropriete: 80 },
  { ageMax: 999, usufruit: 10, nuePropriete: 90 },
];

export function getDemembrement(ageUsufruitier) {
  const tr = BAREME_669.find(t => ageUsufruitier <= t.ageMax);
  return tr || { usufruit: 10, nuePropriete: 90 };
}

/**
 * Calcul droits de donation en ligne directe (parent → enfant)
 * Abattement: 100 000€ par enfant, renouvelable tous les 15 ans
 */
export function calcDroitsDonation(valeurDonnee, abattementUtilise = 0) {
  const abattement = Math.max(0, 100000 - abattementUtilise);
  const base = Math.max(0, valeurDonnee - abattement);
  
  const tranches = [
    { max: 8072, taux: 0.05 },
    { max: 12109, taux: 0.10 },
    { max: 15932, taux: 0.15 },
    { max: 552324, taux: 0.20 },
    { max: 902838, taux: 0.30 },
    { max: 1805677, taux: 0.40 },
    { max: Infinity, taux: 0.45 },
  ];
  
  let droits = 0;
  let restant = base;
  for (const tr of tranches) {
    if (restant <= 0) break;
    const tranche = Math.min(restant, tr.max - (droits > 0 ? tranches[tranches.indexOf(tr) - 1]?.max || 0 : 0));
    droits += tranche * tr.taux;
    restant -= tranche;
  }
  
  return { droits: Math.round(droits), base, abattement, valeurDonnee };
}

/** Format monétaire français */
export function fMoney(n) {
  return Math.round(n).toLocaleString("fr-FR");
}

/** Générer un ID unique */
export function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ═══ CALCUL D'UN NOEUD ═══

/**
 * Calcule les résultats financiers d'un noeud en fonction de ses données et flux entrants.
 * @param {Object} node - Le noeud (type, data)
 * @param {Array} inEdges - Les edges entrants avec leur flow value
 * @param {Object} fv - Map edge.id → montant
 * @returns {Object} Résultats calculés (ca, is, rNet, dist, detail, etc.)
 */
export function calcNode(node, inEdges, fv) {
  const d = node.data || {};
  const inc = inEdges.reduce((s, e) => s + (fv[e.id] || 0), 0);

  // ═══ SOCIÉTÉ ou HOLDING ═══
  if (node.type === "societe" || node.type === "holding") {
    const fo = safeFormes(d.forme, "SASU");
    let ca;

    if (node.type === "societe") {
      const extraInc = inEdges.filter(e => e.flow !== "ca").reduce((s, e) => s + (fv[e.id] || 0), 0);
      ca = (d.ca || 0) + extraInc;
    } else {
      ca = inc;
    }

    // Micro-entreprise
    if (fo.regime === "micro") {
      const cot = Math.round(ca * fo.cpNet);
      const net = ca - cot;
      return {
        ca, inc, cot, rNet: net, is: 0, dist: net, remNet: net,
        chS: cot, cRem: 0, chD: 0, am: 0, ik: 0, loyersPaids: 0, rAv: net,
        detail: `Micro: cotisations ${(fo.cpNet * 100).toFixed(1)}% = ${fMoney(cot)}€. Net: ${fMoney(net)}€.`,
        forme: fo.l, tns: false,
      };
    }

    const rem = d.remuneration || 0;
    let chS, remN, cRem;

    if (fo.regime === "assimile") {
      chS = Math.round(rem * 0.42);
      remN = Math.round(rem * 0.78);
      cRem = rem + chS;
    } else if (fo.regime === "tns") {
      chS = Math.round(rem * 0.45);
      remN = Math.round(rem * 0.55);
      cRem = rem + chS;
    } else {
      chS = 0; remN = rem; cRem = rem;
    }

    const cotMin = (fo.cotMin && rem === 0) ? 1100 : 0;
    const chD = Math.round(ca * (d.tauxCharges || 10) / 100);
    const am = d.amortissements || 0;
    const ik = d.ik || 0;
    const loyersPaids = d._loyersSortants || 0;
    const isHold = node.type === "holding";

    let rAv = ca - chD - cRem - cotMin - am - ik - loyersPaids;
    let is2;

    if (isHold) {
      // Régime mère-fille: 95% exonéré, 5% taxable
      const taxableDiv = Math.max(0, inc * 0.05);
      rAv = taxableDiv - chD - cRem - am - ik;
      is2 = calcIS(Math.max(0, rAv));
    } else {
      is2 = calcIS(Math.max(0, rAv));
    }

    const rNet = Math.max(0, isHold ? ca - is2 - cRem - chD - am - ik : rAv - is2);
    const dist = Math.round(rNet * (d.tauxDistrib || 80) / 100);
    const divFlatTax = fo.divCS ? 0 : Math.round(dist * 0.30);
    const divChargesSoc = fo.divCS ? Math.round(Math.max(0, dist - (d.capital || 1000) * 0.10) * 0.45) : 0;
    const regimeLabel = fo.regime === "assimile" ? "Assimilé salarié" : "Gérant TNS";

    const detail = rem > 0
      ? `${regimeLabel} | Brut ${fMoney(rem)}€ → Net ${fMoney(remN)}€ | Charges ${fMoney(chS)}€${cotMin > 0 ? ` + min ${fMoney(cotMin)}€` : ""}${loyersPaids > 0 ? ` | Loyer ${fMoney(loyersPaids)}€` : ""}`
      : fo.cotMin
        ? `${regimeLabel} | Non rémunéré | Cotisations min: ${fMoney(cotMin)}€/an`
        : `${regimeLabel}${loyersPaids > 0 ? ` | Loyer payé: ${fMoney(loyersPaids)}€` : " | Non rémunéré"}`;

    return {
      ca, inc, chS, remN, cRem, chD, am, ik, loyersPaids, rAv, is: is2, rNet, dist,
      cotMin, divFlatTax, divChargesSoc, forme: fo.l, tns: fo.regime === "tns",
      detail, exo: isHold ? Math.round(inc * 0.95) : 0, treso: isHold ? rNet : 0,
    };
  }

  // ═══ SCI ═══
  if (node.type === "sci") {
    const fo = safeFormes(d.forme, "SCI-IS");
    const loyersParam = (d.loyersMensuels || 0) * 12;
    const charges = d.chargesAnnuelles || 0;
    const interets = d.interetsEmprunt || 0;
    const amort = d.amortissement || 0;

    // Calculate loyers from incoming "loyer" edges only (not all inc)
    const loyerEdgesIn = inEdges.filter(e => e.flow === "loyer");
    const loyersFromFlows = loyerEdgesIn.reduce((s, e) => s + (fv[e.id] || 0), 0);
    
    // Other incoming flows (dividendes, autre, etc.) that are NOT loyers
    const otherInc = inEdges.filter(e => e.flow !== "loyer").reduce((s, e) => s + (fv[e.id] || 0), 0);

    // Total loyers: if loyer flows exist, use ONLY those (ignore loyersParam to avoid double counting)
    // If no loyer flows, use the SCI parameter
    const totalLoyers = loyerEdgesIn.length > 0 ? loyersFromFlows : loyersParam;
    
    // Add other non-loyer income
    const totalRevenus = totalLoyers + otherInc;

    if (fo.regime === "sci-ir") {
      const isMicroFoncier = totalLoyers <= 15000 && totalLoyers > 0;
      let revenuImposable;
      if (d.regimeFoncier === "reel" || !isMicroFoncier) {
        revenuImposable = Math.max(0, totalLoyers - charges - interets);
      } else {
        revenuImposable = Math.round(totalLoyers * 0.70);
      }
      const irEstime = Math.round(revenuImposable * 0.30);
      const psEstime = Math.round(revenuImposable * 0.172);
      const detail = isMicroFoncier && d.regimeFoncier !== "reel"
        ? `SCI IR micro-foncier | Abattement 30% | Imposable: ${fMoney(revenuImposable)}€`
        : `SCI IR réel | Charges: ${fMoney(charges + interets)}€ | Imposable: ${fMoney(revenuImposable)}€`;
      return {
        totalLoyers, inc, charges, interets, amort: 0, rAv: revenuImposable, is: 0,
        irEstime, psEstime, rNet: totalLoyers - charges - interets,
        dist: totalLoyers - charges - interets, regimeSCI: "IR", isMicroFoncier, detail,
      };
    } else {
      const rAv = totalLoyers - charges - interets - amort;
      const is2 = calcIS(Math.max(0, rAv));
      const rNet = Math.max(0, rAv - is2);
      const detail = `SCI IS | Loyers ${fMoney(totalLoyers)}€ - Charges ${fMoney(charges)}€ - Intérêts ${fMoney(interets)}€ - Amort ${fMoney(amort)}€ = ${fMoney(rAv)}€ | IS: ${fMoney(is2)}€`;
      return { totalLoyers, inc, charges, interets, amort, rAv, is: is2, rNet, dist: rNet, regimeSCI: "IS", detail };
    }
  }

  // ═══ PLACEMENT ═══
  if (node.type === "placement") {
    const capital = d.capital || 0;
    const rdmt = (d.rendement || 3) / 100;
    const duree = d.duree || 5;
    const versementMensuel = d.versementMensuel || 0;
    const fraisAn = (d.fraisAnnuels || 1.6) / 100;
    const typePl = d.typePlacement || "av";
    const ptInfo = PLACEMENT_TYPES.find(p => p.id === typePl) || PLACEMENT_TYPES[0];
    const rdmtNet = Math.max(0, rdmt - fraisAn);

    const proj = [];
    let cumCapital = capital;
    let totalVerse = capital;

    for (let y = 1; y <= Math.min(duree, 30); y++) {
      const verseAn = versementMensuel * 12;
      totalVerse += verseAn;

      if (rdmtNet > 0 && versementMensuel > 0) {
        let cumM = cumCapital;
        for (let m = 1; m <= 12; m++) {
          cumM = cumM * (1 + rdmtNet / 12) + versementMensuel;
        }
        cumCapital = Math.round(cumM);
      } else {
        cumCapital = Math.round((cumCapital + verseAn) * (1 + rdmtNet));
      }

      const gainBrut = cumCapital - totalVerse;
      let fiscalite = 0;
      let fiscLabel = "";

      if (typePl === "av") {
        if (y < 8) { fiscalite = Math.round(gainBrut * 0.30); fiscLabel = "Flat tax 30%"; }
        else { fiscalite = Math.round(Math.max(0, gainBrut - 4600) * 0.247); fiscLabel = "Après abatt. 4 600€, 24,7%"; }
      } else if (typePl === "pea") {
        if (y < 5) { fiscalite = Math.round(gainBrut * 0.30); fiscLabel = "Flat tax 30%"; }
        else { fiscalite = Math.round(gainBrut * 0.172); fiscLabel = "PS 17,2% seuls"; }
      } else if (typePl === "per") {
        const deductionIR = Math.round(Math.min(verseAn, 37094) * 0.30);
        fiscalite = Math.round(gainBrut * 0.30) - deductionIR * y;
        fiscLabel = `Sortie IR, éco. ~${fMoney(deductionIR)}/an`;
      } else if (typePl === "livret") {
        fiscalite = 0; fiscLabel = "Exonéré";
      } else if (typePl === "cto") {
        // FPCI fiscal: PS 17,2% seuls après 5 ans
        if (y < 5) { fiscalite = Math.round(gainBrut * 0.30); fiscLabel = "Flat tax 30%"; }
        else { fiscalite = Math.round(gainBrut * 0.172); fiscLabel = "FPCI fiscal: PS 17,2%"; }
      } else {
        fiscalite = Math.round(gainBrut * 0.30); fiscLabel = "Flat tax 30%";
      }

      proj.push({
        y, capital: cumCapital, totalVerse, gainBrut,
        fiscalite: Math.max(0, fiscalite),
        gainNet: gainBrut - Math.max(0, fiscalite),
        fiscLabel,
      });
    }

    const revAn = duree > 0 && proj.length > 0 ? Math.round(proj[proj.length - 1].gainBrut / duree) : 0;
    const lastP = proj[proj.length - 1] || { capital, gainBrut: 0, gainNet: 0, totalVerse: capital };
    const detail = `${ptInfo.l} | ${fMoney(capital)}€ + ${fMoney(versementMensuel)}€/m | Rdt net ${(rdmtNet * 100).toFixed(1)}% | An ${duree}: ${fMoney(lastP.capital)}€`;

    return {
      capital, rdmt: d.rendement || 3, duree, revAn, proj, inc, dist: revAn,
      versementMensuel, fraisAn: d.fraisAnnuels || 1.6, typePl, ptInfo, lastP,
      totalVerse: lastP.totalVerse || capital, detail,
    };
  }

  // ═══ FOYER ═══
  if (node.type === "foyer") {
    const ch = ["loyer", "voiture", "energie", "mutuelle", "credit", "divers", "autre1"]
      .reduce((s, k) => s + (d[k] || 0), 0);
    
    // Add emprunt charge if injected by flows engine
    const empruntChargeAnnuelle = d._empruntChargeAnnuelle || 0;
    const empruntChargeMensuelle = Math.round(empruntChargeAnnuelle / 12);
    const totalChargesMensuelles = ch + empruntChargeMensuelle;
    
    // Calcul IR si revenu imposable fourni
    const parts = d.partsFiscales || 1;
    const revenuImposable = d.revenuImposable || 0;
    const irResult = revenuImposable > 0 ? calcIR(revenuImposable, parts) : null;
    
    return {
      inc, 
      chM: totalChargesMensuelles, chA: totalChargesMensuelles * 12,
      marge: inc - totalChargesMensuelles * 12,
      margeM: Math.round((inc - totalChargesMensuelles * 12) / 12),
      ir: irResult, partsFiscales: parts,
      empruntChargeMensuelle,
      chargesFixesMensuelles: ch,
    };
  }

  // ═══ EMPLOYEUR (entité externe qui verse un salaire) ═══
  if (node.type === "employeur") {
    const salaireBrut = d.salaireBrut || 0;
    const statut = d.statut || "cadre";
    const interessement = d.interessement || 0;
    const participation = d.participation || 0;
    const totalBrut = salaireBrut + interessement + participation;
    return { salaireBrut, statut, interessement, participation, totalBrut, inc, dist: salaireBrut };
  }

  // ═══ PERSONNE / SALARIÉ ═══
  if (node.type === "personne") {
    const prenom = d.prenom || "Personne";
    const statut = d.statut || "cadre";
    const parts = d.partsFiscales || 1;
    const tauxCotis = statut === "cadre" ? 0.22 : statut === "fonctionnaire" ? 0.15 : 0.155;
    const salaireBrut = inc || d.salaireBrut || 0;
    const cotisations = Math.round(salaireBrut * tauxCotis);
    const salaireNet = salaireBrut - cotisations;
    const irResult = calcIR(salaireNet, parts);
    const netApresIR = salaireNet - irResult.ir;
    return {
      prenom, statut, parts, salaireBrut, tauxCotis: Math.round(tauxCotis * 100),
      cotisations, salaireNet, ir: irResult.ir, tmi: Math.round(irResult.tmi * 100),
      tauxMoyen: salaireNet > 0 ? Math.round(irResult.ir / salaireNet * 1000) / 10 : 0,
      netApresIR, netMensuel: Math.round(netApresIR / 12),
      inc: salaireBrut, dist: netApresIR,
    };
  }

  // ═══ EMPRUNT BANCAIRE (Brique Immo) ═══
  if (node.type === "emprunt") {
    const capital = d.capitalEmprunte || 0;
    const taux = d.tauxInteret || 3.5;
    const dureeAns = d.dureeAns || 20;
    const assuranceMensuelle = d.assuranceMensuelle || 0;
    const dureeMois = dureeAns * 12;
    
    const empruntResult = calcEmprunt(capital, taux, dureeMois, assuranceMensuelle);
    
    // Intérêts déductibles pour l'année 1
    const interetsAn1 = empruntResult.tableau.length > 0 ? empruntResult.tableau[0].interets : 0;
    
    const detail = `Emprunt ${fMoney(capital)}€ sur ${dureeAns} ans à ${taux}% | Mensualité: ${fMoney(empruntResult.mensualiteAssurance)}€ | Intérêts totaux: ${fMoney(empruntResult.interetsTotal)}€`;
    
    return {
      capital, taux, dureeAns, dureeMois, assuranceMensuelle,
      mensualite: empruntResult.mensualite,
      mensualiteAssurance: empruntResult.mensualiteAssurance,
      mensualiteAnnuelle: empruntResult.mensualiteAssurance * 12,
      interetsTotal: empruntResult.interetsTotal,
      interetsAn1,
      coutTotal: empruntResult.coutTotal,
      tableau: empruntResult.tableau,
      inc, detail,
    };
  }

  // ═══ CESSION / PLUS-VALUE (Brique Juridique) ═══
  if (node.type === "cession") {
    const prixCession = d.prixCession || 0;
    const prixAcquisition = d.prixAcquisition || 0;
    const dureeDetention = d.dureeDetention || 0;
    const isApportCession = d.isApportCession || false;
    
    const plusValue = Math.max(0, prixCession - prixAcquisition);
    
    // Flat tax 30% par défaut
    let impotPV = Math.round(plusValue * 0.30);
    let reportPV = 0;
    let reinvestObligation = 0;
    let articleRef = "Art. 200 A CGI (PFU 30%)";
    
    // Apport-cession 150-0 B ter : report d'imposition
    if (isApportCession) {
      reportPV = impotPV;
      impotPV = 0;
      reinvestObligation = Math.round(prixCession * 0.60);
      articleRef = "Art. 150-0 B ter CGI (report d'imposition, réinvestissement 60% sous 24 mois)";
    }
    
    const detail = isApportCession
      ? `Apport-cession 150-0 B ter | PV: ${fMoney(plusValue)}€ en report | Réinvestir ${fMoney(reinvestObligation)}€ sous 24 mois`
      : `Cession | PV: ${fMoney(plusValue)}€ | Flat tax: ${fMoney(impotPV)}€`;
    
    return {
      prixCession, prixAcquisition, plusValue, impotPV, reportPV, reinvestObligation,
      isApportCession, dureeDetention, articleRef, inc, detail,
      dist: prixCession - impotPV,
    };
  }

  // ═══ DONATION / TRANSMISSION (Brique Juridique) ═══
  if (node.type === "donation") {
    const valeurBien = d.valeurBien || 0;
    const ageDonateur = d.ageDonateur || 60;
    const isDemembre = d.isDemembre || false;
    const nbEnfants = d.nbEnfants || 1;
    
    const demembrement = getDemembrement(ageDonateur);
    const valeurTransmise = isDemembre
      ? Math.round(valeurBien * demembrement.nuePropriete / 100)
      : valeurBien;
    
    const valeurParEnfant = Math.round(valeurTransmise / nbEnfants);
    const droitsParEnfant = calcDroitsDonation(valeurParEnfant);
    const droitsTotal = droitsParEnfant.droits * nbEnfants;
    
    const detail = isDemembre
      ? `Donation démembrée (art. 669 CGI) | Valeur NP ${demembrement.nuePropriete}% = ${fMoney(valeurTransmise)}€ | Droits: ${fMoney(droitsTotal)}€ (${nbEnfants} enfant${nbEnfants > 1 ? "s" : ""})`
      : `Donation pleine propriété | ${fMoney(valeurBien)}€ | Droits: ${fMoney(droitsTotal)}€ (${nbEnfants} enfant${nbEnfants > 1 ? "s" : ""})`;
    
    return {
      valeurBien, ageDonateur, isDemembre, nbEnfants, valeurTransmise, valeurParEnfant,
      demembrement, droitsParEnfant, droitsTotal, inc, detail,
      economie: isDemembre ? Math.round(valeurBien - valeurTransmise) : 0,
    };
  }

  // ═══ CONTRAT ASSURANCE-VIE (Brique Assurance) ═══
  if (node.type === "contrat_av") {
    const capitalInitial = d.capitalInitial || 0;
    const versementMensuel = d.versementMensuel || 0;
    const rendementFondsEuros = (d.rendementFE || 2.5) / 100;
    const rendementUC = (d.rendementUC || 6) / 100;
    const partUC = (d.partUC || 50) / 100;
    const fraisGestion = (d.fraisGestion || 0.8) / 100;
    const fraisEntree = (d.fraisEntree || 0) / 100;
    const ageContrat = d.ageContrat || 0; // années
    const ageAssure = d.ageAssure || 50;
    const nbBeneficiaires = d.nbBeneficiaires || 1;

    // Rendement moyen pondéré net de frais
    const rdmtBrut = rendementFondsEuros * (1 - partUC) + rendementUC * partUC;
    const rdmtNet = Math.max(0, rdmtBrut - fraisGestion);

    // Capital net d'entrée (après frais)
    const capitalNet = Math.round(capitalInitial * (1 - fraisEntree));

    // Projection à 8 ans, 15 ans, 20 ans
    const projeter = (annees) => {
      let cap = capitalNet;
      for (let a = 0; a < annees; a++) {
        cap = cap * (1 + rdmtNet) + versementMensuel * 12;
      }
      return Math.round(cap);
    };

    const capital8ans = projeter(Math.max(0, 8 - ageContrat));
    const capital15ans = projeter(Math.max(0, 15 - ageContrat));
    const capital20ans = projeter(Math.max(0, 20 - ageContrat));
    const capitalActuel = projeter(0) || capitalNet;
    const totalVerse = capitalInitial + versementMensuel * 12 * Math.max(0, 8 - ageContrat);

    // Gains
    const gains8ans = capital8ans - totalVerse;

    // Fiscalité rachat partiel
    const isAvant8ans = ageContrat < 8;
    const flatTaxRachat = isAvant8ans ? 0.30 : 0.247; // PFU 30% avant 8 ans, 24.7% après (7.5% + PS 17.2%)
    const abattementAnnuel = 4600; // célibataire (9200 couple)

    // Transmission : art. 990 I CGI (versements avant 70 ans)
    const abattTransmission = 152500 * nbBeneficiaires; // 152 500€ par bénéficiaire
    const capitalTransmissible = capitalActuel > 0 ? capitalActuel : capitalNet;
    const baseApres990I = Math.max(0, capitalTransmissible - abattTransmission);
    const droitsTransmission = Math.round(baseApres990I * 0.20); // 20% au-delà

    const detail = `AV ${fMoney(capitalNet)}€ | Rdt ${(rdmtNet * 100).toFixed(1)}%/an (FE ${(rendementFondsEuros * 100).toFixed(1)}% + UC ${(rendementUC * 100).toFixed(1)}%) | An 8: ${fMoney(capital8ans)}€ | An 15: ${fMoney(capital15ans)}€ | Transmission: abatt. ${fMoney(abattTransmission)}€`;

    return {
      capitalInitial, capitalNet, versementMensuel,
      rendementFE: d.rendementFE || 2.5, rendementUC: d.rendementUC || 6,
      partUC: d.partUC || 50, rdmtNet: Math.round(rdmtNet * 1000) / 10,
      fraisGestion: d.fraisGestion || 0.8, fraisEntree: d.fraisEntree || 0,
      ageContrat, ageAssure, nbBeneficiaires,
      capitalActuel, capital8ans, capital15ans, capital20ans,
      gains8ans, totalVerse,
      isAvant8ans, flatTaxRachat, abattementAnnuel,
      abattTransmission, droitsTransmission,
      detail, inc, dist: 0,
    };
  }

  // ═══ INVEST / PARTICIPATION ═══
  if (node.type === "invest") {
    const val = d.valeur || 0;
    const rdmt = (d.rendement || 5) / 100;
    const revAn = Math.round(val * rdmt);
    return { val, rdmt: d.rendement || 5, revAn, inc, dist: revAn };
  }

  // ═══ DEFAULT ═══
  return { inc };
}
