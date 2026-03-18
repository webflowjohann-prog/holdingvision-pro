/**
 * HoldingVision Pro — Brand Themes (Marque Blanche)
 * 4 thèmes complets inspirés de vrais cabinets.
 * Chaque thème transforme TOUTE l'interface : fond, sidebar, noeuds, textes, boutons.
 */

export const BRAND_THEMES = {
  // ═══════════════════════════════════════════════
  // 1. HOLISTIK PATRIMOINE — CGP (Bois-Guillaume)
  //    Fond clair, bleu marine #1e274a, accent bleu #1e73be
  //    Esprit : sobre, confiance, premium light
  // ═══════════════════════════════════════════════
  holistik: {
    id: "holistik",
    name: "Holistik Patrimoine",
    subtitle: "Cabinet de conseil en gestion de patrimoine",
    profileId: "cgp",
    logoUrl: "https://holistik-patrimoine.com/wp-content/uploads/2023/05/holistik-patrimoine-1.jpg",
    sourceUrl: "https://holistik-patrimoine.com",

    // Mode light
    mode: "light",

    // Canvas & layout
    canvasBg: "#f4f5f8",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(30,39,74,0.04) 0%, transparent 60%)",
    sidebarBg: "#1e274a",
    topBarBg: "#1e274a",
    gridDot: "#d0d4de",

    // Accent colors
    accent: "#1e73be",
    accentBright: "#2a8fd8",
    accentDim: "#15527a",
    accentGlow: "rgba(30,115,190,0.12)",

    // Nodes — bleu marine like sidebar
    nodeBg: "#1e274a",
    nodeBorder: "rgba(30,115,190,0.40)",
    nodeSelBorder: "#1e73be",
    nodeText: "#ffffff",
    nodeSubtext: "rgba(255,255,255,0.65)",

    // Flows
    flowParticle: "#1e73be",
    flowLine: "rgba(30,115,190,0.35)",

    // Borders
    borderAccent: "rgba(30,39,74,0.12)",
    borderHover: "rgba(30,115,190,0.30)",

    // Buttons
    btnActive: "rgba(30,115,190,0.12)",
    btnBg: "linear-gradient(135deg, #1e73be, #1e274a)",
    btnText: "#ffffff",

    // Cards
    cardBg: "#ffffff",
    cardBorder: "rgba(30,39,74,0.10)",

    // Tags
    tagBg: "rgba(30,115,190,0.08)",
    tagBorder: "rgba(30,115,190,0.20)",

    // Text hierarchy (light mode)
    txPrimary: "#1e274a",
    txSecondary: "#5a6384",
    txTertiary: "#9aa0b8",
    txMuted: "#c8cce0",

    // Sidebar text (white on dark sidebar)
    sidebarText: "#ffffff",
    sidebarTextDim: "rgba(255,255,255,0.6)",
    sidebarAccent: "#5ca0e0",
    sidebarBorder: "rgba(255,255,255,0.10)",
    sidebarBtnActive: "rgba(255,255,255,0.12)",

    // Logo area — white background for the logo at top of sidebar
    sidebarLogoBg: "#ffffff",

    // Input
    inputBg: "#f0f1f6",
    inputBorder: "rgba(30,39,74,0.15)",
    inputText: "#1e274a",

    // KPI specific
    kpiCardBg: "#ffffff",
    kpiBorder: "rgba(30,39,74,0.08)",

    // Secondary color (for highlights)
    secondary: "#ea5045",
  },

  // ═══════════════════════════════════════════════
  // 2. FIDAL — Cabinet d'Avocats en Droit des Affaires
  //    Fond sombre, bleu nuit #0f2238, accent turquoise #6dd5dc
  //    Esprit : authority, legal, premium dark
  // ═══════════════════════════════════════════════
  fidal: {
    id: "fidal",
    name: "Fidal",
    subtitle: "Cabinet d'Avocats en Droit des Affaires",
    profileId: "avocat",
    logoUrl: "https://www.fidal.com/themes/custom/fidal/assets/img/logo-fidal.svg",
    sourceUrl: "https://www.fidal.com",

    mode: "dark",

    canvasBg: "#0a1525",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(109,213,220,0.04) 0%, transparent 60%)",
    sidebarBg: "#0f1e38",
    topBarBg: "rgba(10,21,37,0.95)",
    gridDot: "#162840",

    accent: "#6dd5dc",
    accentBright: "#8ae8ee",
    accentDim: "#3a8a90",
    accentGlow: "rgba(109,213,220,0.12)",

    nodeBg: "#132238",
    nodeBorder: "rgba(109,213,220,0.15)",
    nodeSelBorder: "#6dd5dc",
    nodeText: "#e0e8f0",
    nodeSubtext: "#7a90a8",

    flowParticle: "#6dd5dc",
    flowLine: "rgba(109,213,220,0.35)",

    borderAccent: "rgba(109,213,220,0.15)",
    borderHover: "rgba(109,213,220,0.30)",

    btnActive: "rgba(109,213,220,0.12)",
    btnBg: "linear-gradient(135deg, #6dd5dc, #3a8a90)",
    btnText: "#0a1020",

    cardBg: "#0f1e38",
    cardBorder: "rgba(109,213,220,0.12)",

    tagBg: "rgba(109,213,220,0.08)",
    tagBorder: "rgba(109,213,220,0.20)",

    txPrimary: "#e0e8f0",
    txSecondary: "#8a9ab0",
    txTertiary: "#4a5a70",
    txMuted: "#2a3a50",

    sidebarText: "#e0e8f0",
    sidebarTextDim: "rgba(224,232,240,0.5)",
    sidebarAccent: "#6dd5dc",
    sidebarBorder: "rgba(109,213,220,0.10)",
    sidebarBtnActive: "rgba(109,213,220,0.12)",

    inputBg: "#0a1525",
    inputBorder: "rgba(109,213,220,0.15)",
    inputText: "#e0e8f0",

    kpiCardBg: "#132238",
    kpiBorder: "rgba(109,213,220,0.08)",

    secondary: "#ffe764",
  },

  // ═══════════════════════════════════════════════
  // 3. AXA — Assurance
  //    Fond clair, bleu AXA #00008f, accent rouge #c91432
  //    Esprit : institutionnel, confiance, bleu profond
  // ═══════════════════════════════════════════════
  axa: {
    id: "axa",
    name: "AXA",
    subtitle: "Assurances Particuliers et Professionnels",
    profileId: "assurance",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/AXA_Logo.svg/320px-AXA_Logo.svg.png",
    sourceUrl: "https://www.axa.fr",

    mode: "light",

    canvasBg: "#f5f5fb",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(0,0,143,0.04) 0%, transparent 60%)",
    sidebarBg: "#00008f",
    topBarBg: "rgba(255,255,255,0.95)",
    gridDot: "#d8d8e8",

    accent: "#00008f",
    accentBright: "#2020b0",
    accentDim: "#000060",
    accentGlow: "rgba(0,0,143,0.10)",

    nodeBg: "#ffffff",
    nodeBorder: "rgba(0,0,143,0.12)",
    nodeSelBorder: "#00008f",
    nodeText: "#1a1a3a",
    nodeSubtext: "#6a6a90",

    flowParticle: "#00008f",
    flowLine: "rgba(0,0,143,0.30)",

    borderAccent: "rgba(0,0,143,0.10)",
    borderHover: "rgba(0,0,143,0.25)",

    btnActive: "rgba(0,0,143,0.10)",
    btnBg: "linear-gradient(135deg, #00008f, #000060)",
    btnText: "#ffffff",

    cardBg: "#ffffff",
    cardBorder: "rgba(0,0,143,0.08)",

    tagBg: "rgba(0,0,143,0.06)",
    tagBorder: "rgba(0,0,143,0.18)",

    txPrimary: "#1a1a3a",
    txSecondary: "#5a5a80",
    txTertiary: "#9a9ab0",
    txMuted: "#d0d0e0",

    sidebarText: "#ffffff",
    sidebarTextDim: "rgba(255,255,255,0.6)",
    sidebarAccent: "#8080d0",
    sidebarBorder: "rgba(255,255,255,0.12)",
    sidebarBtnActive: "rgba(255,255,255,0.15)",

    inputBg: "#f0f0f8",
    inputBorder: "rgba(0,0,143,0.12)",
    inputText: "#1a1a3a",

    kpiCardBg: "#ffffff",
    kpiBorder: "rgba(0,0,143,0.06)",

    secondary: "#c91432",
  },

  // ═══════════════════════════════════════════════
  // 4. BARNES — Immobilier de luxe
  //    Fond sombre, noir #141414, accent rouge carmin #c70a33
  //    Esprit : luxe, exclusivité, dark élégant
  // ═══════════════════════════════════════════════
  barnes: {
    id: "barnes",
    name: "BARNES International",
    subtitle: "Immobilier de prestige",
    profileId: "immo",
    logoUrl: "https://www.barnes-international.com/templates/biv6/images/logo/logo.png",
    sourceUrl: "https://www.barnes-international.com",

    mode: "dark",

    canvasBg: "#0e0e0e",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(199,10,51,0.04) 0%, transparent 60%)",
    sidebarBg: "#141414",
    topBarBg: "rgba(14,14,14,0.95)",
    gridDot: "#252525",

    accent: "#c70a33",
    accentBright: "#e82050",
    accentDim: "#8a0822",
    accentGlow: "rgba(199,10,51,0.12)",

    nodeBg: "#1c1c1c",
    nodeBorder: "rgba(199,10,51,0.15)",
    nodeSelBorder: "#c70a33",
    nodeText: "#f0ece8",
    nodeSubtext: "#8a8480",

    flowParticle: "#c70a33",
    flowLine: "rgba(199,10,51,0.35)",

    borderAccent: "rgba(199,10,51,0.15)",
    borderHover: "rgba(199,10,51,0.30)",

    btnActive: "rgba(199,10,51,0.12)",
    btnBg: "linear-gradient(135deg, #c70a33, #8a0822)",
    btnText: "#ffffff",

    cardBg: "#1c1c1c",
    cardBorder: "rgba(199,10,51,0.12)",

    tagBg: "rgba(199,10,51,0.08)",
    tagBorder: "rgba(199,10,51,0.20)",

    txPrimary: "#f0ece8",
    txSecondary: "#9a9490",
    txTertiary: "#5a5450",
    txMuted: "#2a2825",

    sidebarText: "#f0ece8",
    sidebarTextDim: "rgba(240,236,232,0.5)",
    sidebarAccent: "#e82050",
    sidebarBorder: "rgba(199,10,51,0.12)",
    sidebarBtnActive: "rgba(199,10,51,0.12)",

    inputBg: "#0e0e0e",
    inputBorder: "rgba(199,10,51,0.15)",
    inputText: "#f0ece8",

    kpiCardBg: "#1c1c1c",
    kpiBorder: "rgba(199,10,51,0.08)",

    secondary: "#d4a060",
  },
};

// Helper: get brand theme by id
export function getBrandTheme(brandId) {
  return BRAND_THEMES[brandId] || null;
}

// Helper: list all available brand demos
export function getBrandDemos() {
  return Object.values(BRAND_THEMES);
}

// Convert a brand theme to the effectiveTheme format used by AppMain
export function brandToEffectiveTheme(brand) {
  if (!brand) return null;
  return {
    canvasBg: brand.canvasBg,
    sidebarBg: brand.sidebarBg,
    gridDot: brand.gridDot,
    accent: brand.accent,
    accentBright: brand.accentBright,
    accentDim: brand.accentDim,
    accentGlow: brand.accentGlow,
    nodeBg: brand.nodeBg,
    flowParticle: brand.flowParticle,
    topBarBg: brand.topBarBg,
    borderAccent: brand.borderAccent,
    borderHover: brand.borderHover,
    btnActive: brand.btnActive,
    canvasGradient: brand.canvasGradient,
    cardBg: brand.cardBg,
    cardBorder: brand.cardBorder,
    btnBg: brand.btnBg,
    btnText: brand.btnText,
    tagBg: brand.tagBg,
    tagBorder: brand.tagBorder,
    nodeSelBorder: brand.nodeSelBorder || brand.accent,
    nodeBorder: brand.nodeBorder,
    nodeText: brand.nodeText,
    nodeSubtext: brand.nodeSubtext,
    sidebarLogoBg: brand.sidebarLogoBg,
    // Extra properties for full theming
    mode: brand.mode,
    txPrimary: brand.txPrimary,
    txSecondary: brand.txSecondary,
    txTertiary: brand.txTertiary,
    txMuted: brand.txMuted,
    sidebarText: brand.sidebarText,
    sidebarTextDim: brand.sidebarTextDim,
    sidebarAccent: brand.sidebarAccent,
    sidebarBorder: brand.sidebarBorder,
    sidebarBtnActive: brand.sidebarBtnActive,
    inputBg: brand.inputBg,
    inputBorder: brand.inputBorder,
    inputText: brand.inputText,
    secondary: brand.secondary,
  };
}
