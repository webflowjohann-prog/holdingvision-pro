/**
 * HoldingVision Pro — Système de Briques Modulaires
 * 
 * Socle commun : Société, Holding, SCI, Placement, Foyer, Source, Fisc
 * Brique CGP : Retraite, Comparateur AV/PER/PEA, Projections 30 ans
 * Brique Juridique : Cession (150-0 B ter), Donation (barème 669, Dutreil), Alertes CGI
 * Brique Immobilier : Bien immobilier (rendement), Emprunt (amortissement), LMNP, TRI
 */

// ═══ DÉFINITION DES BRIQUES ═══

export const BRICKS = {
  socle: {
    id: "socle", label: "Socle commun", icon: "◈",
    description: "Société, Holding, SCI, Placements, Foyer fiscal. Moteur IS, mère-fille, flat tax.",
    color: "#c89650",
    nodeTypes: ["societe", "holding", "sci", "placement", "foyer", "fisc", "source", "invest", "employeur", "personne"],
    included: true, // toujours actif
    price: 0,
  },
  cgp: {
    id: "cgp", label: "Gestion de Patrimoine", icon: "◆",
    description: "Simulateur IR complet, projections retraite, comparateur AV/PER/PEA, patrimoine 30 ans.",
    color: "#b8d860",
    nodeTypes: [], // pas de nouveaux noeuds, enrichit les existants
    features: ["ir_complet", "projection_retraite", "comparateur_enveloppes", "patrimoine_30ans"],
    included: false,
    price: 50,
  },
  juridique: {
    id: "juridique", label: "Conseil Juridique", icon: "⚖",
    description: "Cession (150-0 B ter), Donation (barème 669), Pacte Dutreil, alertes conditions légales, références CGI.",
    color: "#6890e0",
    nodeTypes: ["cession", "donation"],
    features: ["alertes_cgi", "bareme_669", "dutreil", "report_pv"],
    included: false,
    price: 50,
  },
  immo: {
    id: "immo", label: "Investissement Immobilier", icon: "⬡",
    description: "Bien immobilier (rendement brut/net/net-net), Emprunt (tableau amortissement), LMNP, TRI, cash-flow détaillé.",
    color: "#e8a850",
    nodeTypes: ["emprunt"],
    features: ["rendement_detail", "tableau_amortissement", "lmnp", "tri", "cashflow_detail"],
    included: false,
    price: 50,
  },
  assurance: {
    id: "assurance", label: "Assurance & Épargne", icon: "◉",
    description: "Assurance-vie détaillée (rachat, transmission, clause bénéficiaire), PER, comparateur enveloppes, simulation rachat partiel.",
    color: "#c070d0",
    nodeTypes: ["contrat_av"],
    features: ["rachat_partiel", "clause_beneficiaire", "transmission_av", "comparateur_av_per", "abattement_8ans"],
    included: false,
    price: 50,
  },
};

// ═══ PROFILS D'ENTRÉE (pré-activation) ═══

export const ENTRY_PROFILES = [
  {
    id: "cgp",
    title: "Gestion de Patrimoine",
    subtitle: "CGP, CGPI, Family Office",
    icon: "◈",
    color: "#b8d860",
    charImage: "/char-cgp.png",
    activeBricks: ["socle", "cgp"],
    description: "Structuration holding, optimisation fiscale, placements, projections retraite, transmission.",
    features: ["Holding + filiales", "Régime mère-fille", "Placements (AV, PER, PEA)", "Simulateur IR complet"],
    defaultTemplate: "holding_familiale",
  },
  {
    id: "avocat",
    title: "Conseil Juridique & Fiscal",
    subtitle: "Avocats, Experts-comptables, Notaires",
    icon: "⚖",
    color: "#6890e0",
    charImage: "/char-avocat.png",
    activeBricks: ["socle", "juridique"],
    description: "Apport-cession, intégration fiscale, donation-démembrement, avec références aux articles du CGI.",
    features: ["Apport-cession 150-0 B ter", "Donation barème 669", "Pacte Dutreil", "Alertes conditions légales"],
    defaultTemplate: "apport_cession",
  },
  {
    id: "immo",
    title: "Investissement Immobilier",
    subtitle: "Agents immobiliers, Investisseurs, Promoteurs",
    icon: "⬡",
    color: "#e8a850",
    charImage: "/char-immo.png",
    activeBricks: ["socle", "immo"],
    description: "SCI IS/IR, rendements locatifs, cash-flow, effet de levier, tableau d'amortissement emprunt.",
    features: ["Cash-flow locatif", "Rendement brut/net/net-net", "Tableau amortissement", "Comparatif IR vs IS"],
    defaultTemplate: "investisseur_mono",
  },
  {
    id: "assurance",
    title: "Assurance & Épargne",
    subtitle: "Courtiers, Assureurs, Banquiers privés",
    icon: "◉",
    color: "#c070d0",
    charImage: "/char-assurance.png",
    activeBricks: ["socle", "assurance"],
    description: "Assurance-vie, PER, PEA, rachats partiels, clause bénéficiaire, transmission, comparateur d'enveloppes fiscales.",
    features: ["Assurance-vie détaillée", "Rachat partiel/total", "Clause bénéficiaire", "Comparateur AV/PER/PEA"],
    defaultTemplate: "holding_familiale",
  },
];

// ═══ COULEURS PAR PROFIL D'ENTRÉE ═══

export const PROFILE_THEMES = {
  cgp: {
    canvasBg: "#1a2210",
    sidebarBg: "#1c2412",
    gridDot: "#2e3a20",
    accent: "#b8d860",
    accentBright: "#d4f080",
    accentDim: "#7a9038",
    accentGlow: "rgba(180,216,96,0.15)",
    nodeBg: "#243018",
    flowParticle: "#c8e848",
    topBarBg: "rgba(26,34,16,0.95)",
    borderAccent: "rgba(180,216,96,0.18)",
    borderHover: "rgba(180,216,96,0.30)",
    btnActive: "rgba(180,216,96,0.15)",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(140,180,60,0.06) 0%, transparent 60%)",
    cardBg: "linear-gradient(170deg, #1e2418 0%, #1a2010 40%, #151a0e 100%)",
    cardBorder: "rgba(180,200,100,0.15)",
    btnBg: "linear-gradient(135deg, #c8d870, #a0b848)",
    btnText: "#0e1208",
    tagBg: "rgba(180,200,100,0.10)",
    tagBorder: "rgba(180,200,100,0.20)",
  },
  avocat: {
    canvasBg: "#101828",
    sidebarBg: "#121a2a",
    gridDot: "#1e2840",
    accent: "#6890e0",
    accentBright: "#88b0ff",
    accentDim: "#405888",
    accentGlow: "rgba(104,144,224,0.15)",
    nodeBg: "#182238",
    flowParticle: "#68a8f0",
    topBarBg: "rgba(16,24,40,0.95)",
    borderAccent: "rgba(104,144,224,0.18)",
    borderHover: "rgba(104,144,224,0.30)",
    btnActive: "rgba(104,144,224,0.15)",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(60,100,200,0.06) 0%, transparent 60%)",
    cardBg: "linear-gradient(170deg, #1a1c24 0%, #141620 40%, #101218 100%)",
    cardBorder: "rgba(100,140,220,0.15)",
    btnBg: "linear-gradient(135deg, #6890e0, #4868b8)",
    btnText: "#080a10",
    tagBg: "rgba(100,140,220,0.10)",
    tagBorder: "rgba(100,140,220,0.20)",
  },
  immo: {
    canvasBg: "#201408",
    sidebarBg: "#22160a",
    gridDot: "#3a2818",
    accent: "#e8a850",
    accentBright: "#f8c870",
    accentDim: "#a07030",
    accentGlow: "rgba(232,168,80,0.15)",
    nodeBg: "#2e1e0e",
    flowParticle: "#f0b840",
    topBarBg: "rgba(32,20,8,0.95)",
    borderAccent: "rgba(232,168,80,0.18)",
    borderHover: "rgba(232,168,80,0.30)",
    btnActive: "rgba(232,168,80,0.15)",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(200,140,40,0.06) 0%, transparent 60%)",
    cardBg: "linear-gradient(170deg, #241c18 0%, #201810 40%, #1a140e 100%)",
    cardBorder: "rgba(230,160,80,0.15)",
    btnBg: "linear-gradient(135deg, #e8a850, #c88030)",
    btnText: "#120e08",
    tagBg: "rgba(230,160,80,0.10)",
    tagBorder: "rgba(230,160,80,0.20)",
  },
  assurance: {
    canvasBg: "#180c20",
    sidebarBg: "#1a0e22",
    gridDot: "#2a1838",
    accent: "#c070d0",
    accentBright: "#e098f0",
    accentDim: "#884898",
    accentGlow: "rgba(192,112,208,0.15)",
    nodeBg: "#221430",
    flowParticle: "#d080e0",
    topBarBg: "rgba(24,12,32,0.95)",
    borderAccent: "rgba(192,112,208,0.18)",
    borderHover: "rgba(192,112,208,0.30)",
    btnActive: "rgba(192,112,208,0.15)",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(160,80,200,0.06) 0%, transparent 60%)",
    cardBg: "linear-gradient(170deg, #201428 0%, #1a1020 40%, #140c1a 100%)",
    cardBorder: "rgba(192,112,208,0.15)",
    btnBg: "linear-gradient(135deg, #c070d0, #9850a8)",
    btnText: "#0e0812",
    tagBg: "rgba(192,112,208,0.10)",
    tagBorder: "rgba(192,112,208,0.20)",
  },
};

// ═══ AI CONTEXTS PAR BRICK ═══

export const AI_CONTEXTS = {
  socle: `Tu connais le droit fiscal français : IS barème (15%/25%), régime mère-fille (art. 145/216 CGI), flat tax 30%, formes juridiques (SASU, SAS, EURL, SARL, SCI).`,
  cgp: `Tu es expert en gestion de patrimoine. Tu conseilles sur l'optimisation fiscale, les placements (AV, PER, PEA, PE), la retraite et la transmission. Tu calcules l'IR au barème progressif, le TMI, et tu compares les enveloppes fiscales.`,
  juridique: `Tu es expert en droit fiscal et structuration juridique. Tu maîtrises l'apport-cession (art. 150-0 B ter CGI), l'intégration fiscale (art. 223 A CGI), le régime mère-fille (art. 145 et 216 CGI), les donations avec démembrement (art. 669 CGI), le Pacte Dutreil, et les risques d'abus de droit (art. L64 LPF). Tu cites les références légales.`,
  immo: `Tu es expert en investissement immobilier. Tu conseilles sur les SCI (IS vs IR), le cash-flow locatif, l'effet de levier bancaire, les rendements bruts et nets, le LMNP vs SCI à l'IS, les travaux déductibles, les tableaux d'amortissement emprunt, et le TRI.`,
  assurance: `Tu es expert en assurance-vie, épargne et placements financiers. Tu maîtrises les contrats d'assurance-vie (fonds euros, unités de compte, gestion pilotée), le PER (déductibilité, sorties en rente ou capital), le PEA (exonération après 5 ans). Tu connais la fiscalité des rachats partiels (avant/après 8 ans, abattement 4 600€ célibataire / 9 200€ couple), la clause bénéficiaire (abattement 152 500€ par bénéficiaire pour versements avant 70 ans, art. 990 I CGI), et l'art. 757 B CGI pour les versements après 70 ans (abattement 30 500€ global). Tu compares les enveloppes fiscales AV vs PER vs PEA vs CTO net de fiscalité sur différents horizons.`,
};

// ═══ FONCTIONS UTILITAIRES ═══

export function getActiveBricks(brickIds) {
  return brickIds.map(id => BRICKS[id]).filter(Boolean);
}

export function getAvailableNodeTypes(brickIds) {
  const types = new Set();
  brickIds.forEach(id => {
    const b = BRICKS[id];
    if (b) b.nodeTypes.forEach(t => types.add(t));
  });
  return [...types];
}

export function getAISystemPrompt(brickIds) {
  const parts = brickIds.map(id => AI_CONTEXTS[id]).filter(Boolean);
  return parts.join("\n\n") + `\n\nTu as accès au canvas HoldingVision Pro. Réponds en français, de manière concise et pragmatique. Donne des chiffres précis. N'utilise jamais de tirets longs. Rappelle que tu n'es pas un conseiller financier agréé.`;
}

export function getProfileTheme(profileId) {
  return PROFILE_THEMES[profileId] || PROFILE_THEMES.cgp;
}
