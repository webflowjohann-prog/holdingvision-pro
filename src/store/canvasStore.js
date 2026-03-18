import { create } from "zustand";
import { uid } from "../lib/format.js";
import { TEMPLATES, getTemplatesByProfile } from "../engine/templates.js";

const DEFAULT_TEMPLATE = TEMPLATES[0]; // holding_familiale

// ═══ NEUTRAL STARTER TEMPLATE ═══
// New projects start with a basic structure, all values at zero
const STARTER_NODES = [
  { id: "s1", type: "societe", l: "Société A", x: 120, y: 80, w: 220, h: 64, data: { forme: "SASU", ca: 0, tauxCharges: 10, tauxDistrib: 100, remuneration: 0 } },
  { id: "s2", type: "societe", l: "Société B", x: 500, y: 80, w: 220, h: 64, data: { forme: "SASU", ca: 0, tauxCharges: 10, tauxDistrib: 100, remuneration: 0 } },
  { id: "h1", type: "holding", l: "Holding", x: 300, y: 380, w: 220, h: 64, data: { forme: "SAS", tauxDistrib: 60, tauxCharges: 2, remuneration: 0, associes: [] } },
  { id: "sci1", type: "sci", l: "SCI", x: 60, y: 280, w: 220, h: 64, data: { forme: "SCI-IS", loyersMensuels: 0, chargesAnnuelles: 0, interetsEmprunt: 0, amortissement: 0, bienValeur: 0 } },
  { id: "f1", type: "foyer", l: "Foyer fiscal", x: 500, y: 280, w: 220, h: 64, data: { loyer: 0, voiture: 0, energie: 0, mutuelle: 0, credit: 0, divers: 0 } },
  { id: "fisc1", type: "fisc", l: "État / Fisc", x: 680, y: 160, w: 180, h: 64, data: {} },
];
const STARTER_EDGES = [
  { id: "e1", from: "s1", to: "h1", flow: "dividendes" },
  { id: "e2", from: "s2", to: "h1", flow: "dividendes" },
  { id: "e3", from: "h1", to: "f1", flow: "dividendes" },
  { id: "e4", from: "s1", to: "sci1", flow: "loyer" },
  { id: "e5", from: "s1", to: "fisc1", flow: "is" },
  { id: "e6", from: "s2", to: "fisc1", flow: "is" },
  { id: "e7", from: "h1", to: "fisc1", flow: "is" },
];

const useCanvasStore = create((set, get) => ({
  nodes: STARTER_NODES,
  edges: STARTER_EDGES,
  selectedNode: null,
  selectedEdge: null,
  zoom: 0.88,
  pan: { x: 0, y: 0 },

  // Node actions
  setNodes: (nodes) => set({ nodes }),
  updateNode: (id, updates) => set(s => ({
    nodes: s.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
  })),
  updateNodeData: (id, key, value) => set(s => ({
    nodes: s.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, [key]: value } } : n),
  })),
  addNode: (type, x, y) => {
    const id = uid();
    const defaults = {
      societe: { forme: "SASU", ca: 0, tauxCharges: 10, tauxDistrib: 100, remuneration: 0 },
      holding: { forme: "SAS", tauxDistrib: 60, tauxCharges: 2, remuneration: 0, associes: [] },
      foyer: { loyer: 0, voiture: 0, energie: 0, mutuelle: 0, credit: 0, divers: 0 },
      sci: { forme: "SCI-IS", loyersMensuels: 0, chargesAnnuelles: 0, interetsEmprunt: 0, amortissement: 0, bienValeur: 0 },
      placement: { typePlacement: "av", capital: 0, rendement: 3, fraisAnnuels: 1.6, duree: 10, versementMensuel: 0 },
      invest: { valeur: 0, rendement: 5 },
      fisc: {},
      source: {},
      emprunt: { capitalEmprunte: 0, tauxInteret: 3.5, dureeAns: 20, assuranceMensuelle: 0 },
      cession: { prixCession: 0, prixAcquisition: 0, dureeDetention: 0, isApportCession: false },
      donation: { valeurBien: 0, ageDonateur: 60, nbEnfants: 1, isDemembre: false },
      contrat_av: { capitalInitial: 0, versementMensuel: 0, rendementFE: 2.5, rendementUC: 6, partUC: 50, fraisGestion: 0.8, fraisEntree: 0, ageContrat: 0, ageAssure: 50, nbBeneficiaires: 1 },
      employeur: { salaireBrut: 0, statut: "cadre", interessement: 0, participation: 0 },
      personne: { prenom: "Personne", statut: "cadre", partsFiscales: 1, salaireBrut: 0 },
    };
    const labels = { societe: "Nouvelle société", holding: "Nouvelle holding", foyer: "Foyer", sci: "SCI", placement: "Placement", invest: "Participation", fisc: "État", source: "Source", emprunt: "Emprunt", cession: "Cession", donation: "Donation", contrat_av: "Contrat AV", employeur: "Employeur", personne: "Personne" };
    const newNode = { id, type, l: labels[type] || type, x, y, w: 200, h: 64, data: defaults[type] || {} };
    set(s => ({ nodes: [...s.nodes, newNode], selectedNode: id }));
  },
  removeNode: (id) => set(s => ({
    nodes: s.nodes.filter(n => n.id !== id),
    edges: s.edges.filter(e => e.from !== id && e.to !== id),
    selectedNode: s.selectedNode === id ? null : s.selectedNode,
  })),

  // Edge actions
  setEdges: (edges) => set({ edges }),
  addEdge: (from, to, flow) => {
    const id = uid();
    set(s => ({ edges: [...s.edges, { id, from, to, flow }], selectedEdge: id }));
  },
  updateEdge: (id, updates) => set(s => ({
    edges: s.edges.map(e => e.id === id ? { ...e, ...updates } : e),
  })),
  removeEdge: (id) => set(s => ({
    edges: s.edges.filter(e => e.id !== id),
    selectedEdge: s.selectedEdge === id ? null : s.selectedEdge,
  })),

  // Selection
  selectNode: (id) => set({ selectedNode: id, selectedEdge: null }),
  selectEdge: (id) => set({ selectedEdge: id, selectedNode: null }),
  clearSelection: () => set({ selectedNode: null, selectedEdge: null }),

  // Viewport
  setZoom: (zoom) => set({ zoom: Math.max(0.3, Math.min(2, zoom)) }),
  setPan: (pan) => set({ pan }),

  // Template loading
  loadTemplate: (templateId) => {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (tpl) set({ nodes: tpl.nodes, edges: tpl.edges, selectedNode: null, selectedEdge: null });
  },

  // Reset
  reset: () => set({ nodes: STARTER_NODES, edges: STARTER_EDGES, selectedNode: null, selectedEdge: null }),
}));

export default useCanvasStore;
