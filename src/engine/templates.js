/**
 * HoldingVision Pro — Templates par profil professionnel
 */

export const TEMPLATES = [
  // ═══ CGP TEMPLATES ═══
  {
    id: "holding_familiale", profile: "cgp",
    nom: "Holding familiale + SCI", categorie: "holding", icon: "◈",
    description: "Couple entrepreneurs, holding commune, 2 filiales SASU, SCI immobilière, placements retraite. Montage dividendes only.",
    nodes: [
      { id: "src", type: "source", l: "Clients", x: 400, y: 20, w: 140, h: 44, data: {} },
      { id: "s1", type: "societe", l: "Société A", x: 120, y: 130, w: 220, h: 68, data: { forme: "SASU", ca: 66000, tauxCharges: 10, tauxDistrib: 100, remuneration: 0, associes: [{ n: "Holding", p: 100 }] } },
      { id: "s2", type: "societe", l: "Société B", x: 560, y: 130, w: 220, h: 68, data: { forme: "SASU", ca: 30000, tauxCharges: 10, tauxDistrib: 100, remuneration: 0, associes: [{ n: "Holding", p: 100 }] } },
      { id: "h1", type: "holding", l: "Holding Familiale", x: 340, y: 310, w: 240, h: 68, data: { forme: "SAS", tauxDistrib: 60, tauxCharges: 2, remuneration: 0, associes: [{ n: "Associé 1", p: 51 }, { n: "Associé 2", p: 49 }] } },
      { id: "sci1", type: "sci", l: "SCI Immobilière", x: 60, y: 490, w: 220, h: 68, data: { forme: "SCI-IS", loyersMensuels: 0, chargesAnnuelles: 3000, interetsEmprunt: 4000, amortissement: 5000, bienValeur: 200000, associes: [{ n: "Holding", p: 99 }, { n: "Associé 1", p: 1 }] } },
      { id: "pl1", type: "placement", l: "FPCI Retraite", x: 680, y: 480, w: 210, h: 68, data: { typePlacement: "cto", capital: 0, rendement: 13, fraisAnnuels: 2, duree: 15, versementMensuel: 1000 } },
      { id: "f1", type: "foyer", l: "Foyer fiscal", x: 680, y: 300, w: 220, h: 68, data: { loyer: 1350, voiture: 400, energie: 300, mutuelle: 300, credit: 300, divers: 500 } },
      { id: "tx", type: "fisc", l: "État / URSSAF", x: 0, y: 300, w: 150, h: 50, data: {} },
    ],
    edges: [
      { id: "e1", from: "src", to: "s1", flow: "ca" }, { id: "e2", from: "src", to: "s2", flow: "ca" },
      { id: "e3", from: "s1", to: "h1", flow: "dividendes" }, { id: "e5", from: "s1", to: "tx", flow: "is" },
      { id: "e6", from: "s1", to: "sci1", flow: "loyer", montantFixe: 14400 },
      { id: "e7", from: "s2", to: "h1", flow: "dividendes" }, { id: "e8", from: "s2", to: "tx", flow: "is" },
      { id: "e9", from: "sci1", to: "h1", flow: "dividendes" }, { id: "e10", from: "sci1", to: "tx", flow: "is" },
      { id: "e11", from: "h1", to: "tx", flow: "is" },
      { id: "e12", from: "h1", to: "f1", flow: "dividendes", montantFixe: 48000 },
      { id: "e13", from: "f1", to: "pl1", flow: "invest", montantFixe: 12000 },
    ],
  },
  {
    id: "freelance_sasu", profile: "cgp",
    nom: "Freelance SASU", categorie: "freelance", icon: "◆",
    description: "Entrepreneur solo en SASU. Optimisation salaire/dividendes. Simple et efficace.",
    nodes: [
      { id: "src", type: "source", l: "Clients", x: 400, y: 20, w: 140, h: 44, data: {} },
      { id: "s1", type: "societe", l: "Ma SASU", x: 300, y: 150, w: 220, h: 68, data: { forme: "SASU", ca: 80000, tauxCharges: 10, tauxDistrib: 80, remuneration: 30000, associes: [{ n: "Moi", p: 100 }] } },
      { id: "f1", type: "foyer", l: "Mon foyer", x: 600, y: 150, w: 200, h: 68, data: { loyer: 1000, voiture: 300, energie: 200, mutuelle: 150, credit: 0, divers: 400 } },
      { id: "tx", type: "fisc", l: "État / URSSAF", x: 50, y: 150, w: 150, h: 50, data: {} },
      { id: "pl1", type: "placement", l: "Épargne", x: 400, y: 320, w: 200, h: 68, data: { typePlacement: "av", capital: 0, rendement: 5, fraisAnnuels: 1.6, duree: 10, versementMensuel: 500 } },
    ],
    edges: [
      { id: "e1", from: "src", to: "s1", flow: "ca" },
      { id: "e2", from: "s1", to: "f1", flow: "salaire" }, { id: "e3", from: "s1", to: "tx", flow: "is" },
      { id: "e4", from: "s1", to: "f1", flow: "dividendes" },
      { id: "e5", from: "f1", to: "pl1", flow: "invest", montantFixe: 6000 },
    ],
  },
  {
    id: "liberal", profile: "cgp",
    nom: "Profession libérale (SEL)", categorie: "liberal", icon: "◆",
    description: "Médecin, avocat, architecte en SEL/SELARL. Optimisation TNS + holding patrimoniale.",
    nodes: [
      { id: "src", type: "source", l: "Patients / Clients", x: 400, y: 20, w: 160, h: 44, data: {} },
      { id: "s1", type: "societe", l: "SEL / SELARL", x: 300, y: 150, w: 220, h: 68, data: { forme: "SARL", ca: 150000, tauxCharges: 15, tauxDistrib: 60, remuneration: 60000, associes: [{ n: "Praticien", p: 100 }] } },
      { id: "h1", type: "holding", l: "Holding patrimoniale", x: 300, y: 310, w: 220, h: 68, data: { forme: "SASU", tauxDistrib: 40, tauxCharges: 2, remuneration: 0, associes: [{ n: "Praticien", p: 100 }] } },
      { id: "pl1", type: "placement", l: "PER", x: 100, y: 480, w: 200, h: 68, data: { typePlacement: "per", capital: 0, rendement: 4, fraisAnnuels: 1.5, duree: 20, versementMensuel: 800 } },
      { id: "pl2", type: "placement", l: "Assurance-vie", x: 500, y: 480, w: 200, h: 68, data: { typePlacement: "av", capital: 30000, rendement: 4, fraisAnnuels: 1.6, duree: 15, versementMensuel: 500 } },
      { id: "f1", type: "foyer", l: "Foyer", x: 600, y: 150, w: 200, h: 68, data: { loyer: 1500, voiture: 500, energie: 250, mutuelle: 400, credit: 500, divers: 600 } },
      { id: "tx", type: "fisc", l: "État / URSSAF", x: 50, y: 150, w: 150, h: 50, data: {} },
    ],
    edges: [
      { id: "e1", from: "src", to: "s1", flow: "ca" },
      { id: "e2", from: "s1", to: "f1", flow: "salaire" }, { id: "e3", from: "s1", to: "tx", flow: "is" },
      { id: "e4", from: "s1", to: "h1", flow: "dividendes" }, { id: "e5", from: "h1", to: "tx", flow: "is" },
      { id: "e6", from: "f1", to: "pl1", flow: "invest", montantFixe: 9600 },
      { id: "e7", from: "h1", to: "pl2", flow: "invest", montantFixe: 6000 },
    ],
  },

  // ═══ AVOCAT TEMPLATES ═══
  {
    id: "apport_cession", profile: "avocat",
    nom: "Apport-cession (150-0 B ter)", categorie: "cession", icon: "⚖",
    description: "Cession d'entreprise via holding. Report d'imposition sur la plus-value. Réinvestissement 60% dans les 2 ans. Art. 150-0 B ter CGI.",
    nodes: [
      { id: "vendeur", type: "foyer", l: "Cédant (personne physique)", x: 100, y: 40, w: 240, h: 68, data: { membres: "Entrepreneur cédant", loyer: 2000, voiture: 500, energie: 300, mutuelle: 300, credit: 0, divers: 800 } },
      { id: "h1", type: "holding", l: "Holding de reprise", x: 340, y: 200, w: 240, h: 68, data: { forme: "SASU", tauxDistrib: 10, tauxCharges: 3, remuneration: 0, associes: [{ n: "Cédant", p: 100 }] } },
      { id: "s1", type: "societe", l: "Société cédée", x: 100, y: 350, w: 220, h: 68, data: { forme: "SAS", ca: 500000, tauxCharges: 40, tauxDistrib: 50, remuneration: 80000, associes: [{ n: "Holding", p: 100 }] } },
      { id: "reinvest", type: "placement", l: "Réinvestissement 60%", x: 500, y: 350, w: 220, h: 68, data: { typePlacement: "cto", capital: 300000, rendement: 8, fraisAnnuels: 2, duree: 10, versementMensuel: 0 } },
      { id: "tx", type: "fisc", l: "État (PV en report)", x: 600, y: 40, w: 180, h: 50, data: {} },
    ],
    edges: [
      { id: "e1", from: "s1", to: "h1", flow: "dividendes" },
      { id: "e2", from: "h1", to: "vendeur", flow: "dividendes", montantFixe: 60000 },
      { id: "e3", from: "h1", to: "reinvest", flow: "invest", montantFixe: 300000 },
      { id: "e4", from: "s1", to: "tx", flow: "is" }, { id: "e5", from: "h1", to: "tx", flow: "is" },
    ],
  },
  {
    id: "integration_fiscale", profile: "avocat",
    nom: "Intégration fiscale (95%)", categorie: "integration", icon: "⚖",
    description: "Groupe intégré fiscalement. Détention ≥95%. Consolidation des résultats. Compensation déficits/bénéfices entre filiales. Art. 223 A CGI.",
    nodes: [
      { id: "h1", type: "holding", l: "Holding tête de groupe", x: 340, y: 40, w: 240, h: 68, data: { forme: "SAS", tauxDistrib: 30, tauxCharges: 5, remuneration: 0, associes: [{ n: "Dirigeant", p: 100 }] } },
      { id: "s1", type: "societe", l: "Filiale bénéficiaire", x: 100, y: 220, w: 220, h: 68, data: { forme: "SAS", ca: 300000, tauxCharges: 30, tauxDistrib: 80, remuneration: 60000, associes: [{ n: "Holding", p: 100 }] } },
      { id: "s2", type: "societe", l: "Filiale déficitaire", x: 500, y: 220, w: 220, h: 68, data: { forme: "SAS", ca: 50000, tauxCharges: 80, tauxDistrib: 0, remuneration: 40000, associes: [{ n: "Holding", p: 100 }] } },
      { id: "f1", type: "foyer", l: "Foyer dirigeant", x: 600, y: 40, w: 200, h: 68, data: { loyer: 1500, voiture: 500, energie: 300, mutuelle: 300, credit: 0, divers: 600 } },
      { id: "tx", type: "fisc", l: "État (IS consolidé)", x: 0, y: 130, w: 180, h: 50, data: {} },
    ],
    edges: [
      { id: "e1", from: "s1", to: "h1", flow: "dividendes" }, { id: "e2", from: "s2", to: "h1", flow: "dividendes" },
      { id: "e3", from: "h1", to: "f1", flow: "dividendes", montantFixe: 48000 },
      { id: "e4", from: "s1", to: "tx", flow: "is" }, { id: "e5", from: "h1", to: "tx", flow: "is" },
    ],
  },
  {
    id: "donation_demembrement", profile: "avocat",
    nom: "Donation avec démembrement", categorie: "transmission", icon: "⚖",
    description: "Transmission anticipée via démembrement de propriété. Donation de la nue-propriété, conservation de l'usufruit. Art. 669 CGI (barème fiscal).",
    nodes: [
      { id: "parents", type: "foyer", l: "Parents (usufruitiers)", x: 100, y: 40, w: 240, h: 68, data: { membres: "Parents donateurs", loyer: 0, voiture: 400, energie: 250, mutuelle: 500, credit: 0, divers: 800 } },
      { id: "h1", type: "holding", l: "Holding familiale", x: 340, y: 200, w: 240, h: 68, data: { forme: "SAS", tauxDistrib: 50, tauxCharges: 2, remuneration: 0, associes: [{ n: "Parents (usufruit)", p: 60 }, { n: "Enfants (nue-prop.)", p: 40 }] } },
      { id: "sci1", type: "sci", l: "SCI Patrimoine", x: 120, y: 370, w: 220, h: 68, data: { forme: "SCI-IS", loyersMensuels: 2000, chargesAnnuelles: 5000, interetsEmprunt: 6000, amortissement: 8000, bienValeur: 500000, associes: [{ n: "Holding", p: 100 }] } },
      { id: "enfants", type: "foyer", l: "Enfants (nus-propriétaires)", x: 500, y: 370, w: 240, h: 68, data: { membres: "Enfants donataires", loyer: 800, voiture: 0, energie: 150, mutuelle: 100, credit: 0, divers: 300 } },
      { id: "tx", type: "fisc", l: "État (droits mutation)", x: 600, y: 40, w: 180, h: 50, data: {} },
    ],
    edges: [
      { id: "e1", from: "sci1", to: "h1", flow: "dividendes" }, { id: "e2", from: "sci1", to: "tx", flow: "is" },
      { id: "e3", from: "h1", to: "parents", flow: "dividendes", montantFixe: 36000 },
      { id: "e4", from: "h1", to: "tx", flow: "is" },
    ],
  },

  // ═══ IMMO TEMPLATES ═══
  {
    id: "investisseur_mono", profile: "immo",
    nom: "Investisseur mono-bien (SCI)", categorie: "immobilier", icon: "⬡",
    description: "Premier investissement locatif en SCI. Simulation rendement brut/net, cash-flow mensuel, effet de levier bancaire.",
    nodes: [
      { id: "sci1", type: "sci", l: "SCI Mon bien", x: 300, y: 150, w: 240, h: 68, data: { forme: "SCI-IS", loyersMensuels: 800, chargesAnnuelles: 2400, interetsEmprunt: 3600, amortissement: 4000, bienValeur: 180000, associes: [{ n: "Investisseur", p: 99 }, { n: "Conjoint", p: 1 }] } },
      { id: "f1", type: "foyer", l: "Mon foyer", x: 600, y: 150, w: 200, h: 68, data: { loyer: 900, voiture: 300, energie: 200, mutuelle: 200, credit: 800, divers: 400 } },
      { id: "tx", type: "fisc", l: "État", x: 50, y: 150, w: 140, h: 50, data: {} },
    ],
    edges: [
      { id: "e1", from: "sci1", to: "f1", flow: "dividendes" },
      { id: "e2", from: "sci1", to: "tx", flow: "is" },
    ],
  },
  {
    id: "investisseur_multi", profile: "immo",
    nom: "Multi-SCI + Holding immo", categorie: "immobilier", icon: "⬡",
    description: "Holding + 3 SCI pour multi-biens. Centralisation des flux, mutualisation, réinvestissement. Stratégie de croissance patrimoniale.",
    nodes: [
      { id: "h1", type: "holding", l: "Holding Immo", x: 340, y: 40, w: 240, h: 68, data: { forme: "SAS", tauxDistrib: 20, tauxCharges: 3, remuneration: 0, associes: [{ n: "Investisseur", p: 100 }] } },
      { id: "sci1", type: "sci", l: "SCI Appart T3 Centre", x: 60, y: 220, w: 220, h: 68, data: { forme: "SCI-IS", loyersMensuels: 900, chargesAnnuelles: 2000, interetsEmprunt: 3000, amortissement: 3500, bienValeur: 150000 } },
      { id: "sci2", type: "sci", l: "SCI Maison Périph.", x: 340, y: 220, w: 220, h: 68, data: { forme: "SCI-IS", loyersMensuels: 1200, chargesAnnuelles: 3000, interetsEmprunt: 5000, amortissement: 5000, bienValeur: 250000 } },
      { id: "sci3", type: "sci", l: "SCI Local Commercial", x: 620, y: 220, w: 220, h: 68, data: { forme: "SCI-IS", loyersMensuels: 1800, chargesAnnuelles: 2500, interetsEmprunt: 4000, amortissement: 4500, bienValeur: 200000 } },
      { id: "f1", type: "foyer", l: "Mon foyer", x: 600, y: 40, w: 200, h: 68, data: { loyer: 1200, voiture: 400, energie: 250, mutuelle: 250, credit: 0, divers: 500 } },
      { id: "tx", type: "fisc", l: "État", x: 0, y: 40, w: 140, h: 50, data: {} },
    ],
    edges: [
      { id: "e1", from: "sci1", to: "h1", flow: "dividendes" }, { id: "e2", from: "sci2", to: "h1", flow: "dividendes" },
      { id: "e3", from: "sci3", to: "h1", flow: "dividendes" },
      { id: "e4", from: "sci1", to: "tx", flow: "is" }, { id: "e5", from: "sci2", to: "tx", flow: "is" },
      { id: "e6", from: "sci3", to: "tx", flow: "is" }, { id: "e7", from: "h1", to: "tx", flow: "is" },
      { id: "e8", from: "h1", to: "f1", flow: "dividendes", montantFixe: 24000 },
    ],
  },
  {
    id: "sci_ir_vs_is", profile: "immo",
    nom: "Comparatif SCI IR vs IS", categorie: "comparatif", icon: "⬡",
    description: "Même bien en SCI à l'IR et SCI à l'IS côte à côte. Visualisez la différence fiscale sur 15 ans.",
    nodes: [
      { id: "sci_ir", type: "sci", l: "SCI à l'IR", x: 100, y: 100, w: 240, h: 68, data: { forme: "SCI-IR", loyersMensuels: 1000, chargesAnnuelles: 2500, interetsEmprunt: 3500, amortissement: 0, bienValeur: 200000 } },
      { id: "sci_is", type: "sci", l: "SCI à l'IS", x: 500, y: 100, w: 240, h: 68, data: { forme: "SCI-IS", loyersMensuels: 1000, chargesAnnuelles: 2500, interetsEmprunt: 3500, amortissement: 5000, bienValeur: 200000 } },
      { id: "f_ir", type: "foyer", l: "Foyer (scénario IR)", x: 100, y: 280, w: 200, h: 68, data: { loyer: 1000, voiture: 300, energie: 200, mutuelle: 200, credit: 0, divers: 400 } },
      { id: "f_is", type: "foyer", l: "Foyer (scénario IS)", x: 500, y: 280, w: 200, h: 68, data: { loyer: 1000, voiture: 300, energie: 200, mutuelle: 200, credit: 0, divers: 400 } },
      { id: "tx", type: "fisc", l: "État", x: 340, y: 40, w: 140, h: 50, data: {} },
    ],
    edges: [
      { id: "e1", from: "sci_ir", to: "f_ir", flow: "dividendes" },
      { id: "e2", from: "sci_is", to: "f_is", flow: "dividendes" },
      { id: "e3", from: "sci_is", to: "tx", flow: "is" },
    ],
  },
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByProfile(profileId) {
  return TEMPLATES.filter(t => t.profile === profileId);
}

export function getTemplatesByCategory(cat) {
  return TEMPLATES.filter(t => t.categorie === cat);
}
