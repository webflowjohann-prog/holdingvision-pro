/**
 * HoldingVision Pro — Profil professionnel
 * Trois entrées métier qui adaptent l'expérience.
 */

export const PROFILES = [
  {
    id: "cgp",
    title: "Gestion de Patrimoine",
    subtitle: "CGP, CGPI, Family Office",
    icon: "◈",
    color: "#f0c878",
    description: "Structuration holding, optimisation fiscale, placements, projections retraite, transmission. Pour les conseillers en gestion de patrimoine et leurs clients.",
    features: ["Holding + filiales", "Régime mère-fille", "Placements (AV, PER, PEA, PE)", "Projections 15 ans", "Flat tax & IS", "Transmission"],
    templates: ["holding_familiale", "freelance_sasu", "liberal"],
  },
  {
    id: "avocat",
    title: "Conseil Juridique & Fiscal",
    subtitle: "Avocats, Experts-comptables, Notaires",
    icon: "⚖",
    color: "#70b8f8",
    description: "Structuration juridique, montages complexes, apport-cession, intégration fiscale, donation-démembrement. Avec références aux articles du CGI et conditions légales.",
    features: ["Apport-cession 150-0 B ter", "Intégration fiscale (95%)", "Donation démembrement", "Cession d'entreprise", "Risques requalification", "Articles CGI"],
    templates: ["holding_familiale", "liberal", "ecommerce"],
  },
  {
    id: "immo",
    title: "Investissement Immobilier",
    subtitle: "Agents immobiliers, Investisseurs, Promoteurs",
    icon: "⬡",
    color: "#b898f0",
    description: "SCI IS/IR, rendements locatifs, cash-flow, effet de levier bancaire, multi-biens, LMNP. Simulation complète d'un parc immobilier avec financement.",
    features: ["SCI IS vs IR", "Cash-flow locatif", "Effet de levier emprunt", "Multi-biens / Multi-SCI", "LMNP vs SCI", "Holding immo"],
    templates: ["investisseur_immo", "holding_familiale"],
  },
];

export const AI_CONTEXTS = {
  cgp: `Tu es un expert en gestion de patrimoine. Tu conseilles des CGP et leurs clients sur l'optimisation fiscale, la structuration de holdings, les placements financiers (assurance-vie, PER, PEA, private equity), la retraite et la transmission. Tu connais le régime mère-fille, la flat tax 30%, l'IS barème français (15%/25%), les FPCI fiscaux, et les différentes formes juridiques (SASU, SAS, EURL, SARL, SCI).`,

  avocat: `Tu es un expert en droit fiscal et structuration juridique. Tu conseilles des avocats fiscalistes, experts-comptables et notaires sur les montages complexes. Tu maîtrises l'apport-cession (art. 150-0 B ter CGI), l'intégration fiscale (art. 223 A CGI), le régime mère-fille (art. 145 et 216 CGI), les donations avec démembrement (art. 669 CGI), et les risques d'abus de droit (art. L64 LPF). Tu cites les références légales quand c'est pertinent.`,

  immo: `Tu es un expert en investissement immobilier. Tu conseilles sur les SCI (IS vs IR), le cash-flow locatif, l'effet de levier bancaire, les rendements bruts et nets, le LMNP vs la SCI à l'IS, les travaux déductibles, et la structuration en holding immobilière pour du multi-biens. Tu calcules les rendements, les mensualités d'emprunt, et les projections de patrimoine immobilier.`,
};

export function getProfileTemplates(profileId) {
  const profile = PROFILES.find(p => p.id === profileId);
  return profile?.templates || [];
}

export function getAIContext(profileId) {
  return AI_CONTEXTS[profileId] || AI_CONTEXTS.cgp;
}
