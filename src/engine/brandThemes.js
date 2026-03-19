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
    logoUrl: "/logo-fidal.svg",
    sourceUrl: "https://www.fidal.com",

    mode: "dark",

    canvasBg: "#0a1525",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(109,213,220,0.04) 0%, transparent 60%)",
    sidebarBg: "#0f1e38",
    topBarBg: "#0f1e38",
    gridDot: "#162840",

    accent: "#6dd5dc",
    accentBright: "#8ae8ee",
    accentDim: "#3a8a90",
    accentGlow: "rgba(109,213,220,0.12)",

    nodeBg: "#0f1e38",
    nodeBorder: "rgba(109,213,220,0.20)",
    nodeSelBorder: "#6dd5dc",
    nodeText: "#ffffff",
    nodeSubtext: "rgba(255,255,255,0.60)",

    flowParticle: "#ffe764",
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

    sidebarLogoBg: "#ffffff",

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
    logoUrl: "/logo-axa.png",
    sourceUrl: "https://www.axa.fr",

    mode: "light",

    canvasBg: "#eeeef8",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(0,0,143,0.04) 0%, transparent 60%)",
    sidebarBg: "#00008f",
    topBarBg: "#00008f",
    gridDot: "#d0d0e0",

    accent: "#00008f",
    accentBright: "#2020b0",
    accentDim: "#000060",
    accentGlow: "rgba(0,0,143,0.10)",

    // Noeuds bleu AXA avec texte blanc
    nodeBg: "#00008f",
    nodeBorder: "rgba(0,0,143,0.40)",
    nodeSelBorder: "#c91432",
    nodeText: "#ffffff",
    nodeSubtext: "rgba(255,255,255,0.65)",

    flowParticle: "#c91432",
    flowLine: "rgba(201,20,50,0.35)",

    borderAccent: "rgba(0,0,143,0.10)",
    borderHover: "rgba(0,0,143,0.25)",

    btnActive: "rgba(0,0,143,0.10)",
    btnBg: "linear-gradient(135deg, #00008f, #000060)",
    btnText: "#ffffff",

    cardBg: "#ffffff",
    cardBorder: "rgba(0,0,143,0.08)",

    tagBg: "rgba(0,0,143,0.06)",
    tagBorder: "rgba(0,0,143,0.18)",

    txPrimary: "#0a0a3a",
    txSecondary: "#3a3a70",
    txTertiary: "#7a7aa0",
    txMuted: "#b0b0d0",

    sidebarText: "#ffffff",
    sidebarTextDim: "rgba(255,255,255,0.6)",
    sidebarAccent: "#8080d0",
    sidebarBorder: "rgba(255,255,255,0.12)",
    sidebarBtnActive: "rgba(255,255,255,0.15)",

    sidebarLogoBg: "#00008f",

    inputBg: "#f0f0f8",
    inputBorder: "rgba(0,0,143,0.12)",
    inputText: "#0a0a3a",

    kpiCardBg: "#ffffff",
    kpiBorder: "rgba(0,0,143,0.06)",

    secondary: "#c91432",
  },

  // ═══════════════════════════════════════════════
  // 4. GAN — Assurances
  //    Fond clair, bleu GAN #173461, accent jaune #ffd715
  //    Esprit : proximité, confiance, bleu et jaune
  // ═══════════════════════════════════════════════
  gan: {
    id: "gan",
    name: "GAN Assurances",
    subtitle: "Votre assureur, c'est quelqu'un",
    profileId: "assurance",
    logoUrl: "/logo-gan.svg",
    sourceUrl: "https://www.gan.fr",

    mode: "light",

    canvasBg: "#eef2f8",
    canvasGradient: "radial-gradient(ellipse at 50% 30%, rgba(23,52,97,0.04) 0%, transparent 60%)",
    sidebarBg: "#173461",
    topBarBg: "#173461",
    gridDot: "#c8d0e0",

    accent: "#173461",
    accentBright: "#249ad2",
    accentDim: "#001e49",
    accentGlow: "rgba(23,52,97,0.10)",

    // Noeuds bleu GAN avec texte blanc
    nodeBg: "#173461",
    nodeBorder: "rgba(23,52,97,0.40)",
    nodeSelBorder: "#ffd715",
    nodeText: "#ffffff",
    nodeSubtext: "rgba(255,255,255,0.65)",

    flowParticle: "#ffd715",
    flowLine: "rgba(23,52,97,0.30)",

    borderAccent: "rgba(23,52,97,0.10)",
    borderHover: "rgba(23,52,97,0.25)",

    btnActive: "rgba(23,52,97,0.10)",
    btnBg: "linear-gradient(135deg, #173461, #001e49)",
    btnText: "#ffffff",

    cardBg: "#ffffff",
    cardBorder: "rgba(23,52,97,0.08)",

    tagBg: "rgba(23,52,97,0.06)",
    tagBorder: "rgba(23,52,97,0.18)",

    txPrimary: "#0a1a3a",
    txSecondary: "#3a4a70",
    txTertiary: "#7a8aa0",
    txMuted: "#b0b8d0",

    sidebarText: "#ffffff",
    sidebarTextDim: "rgba(255,255,255,0.6)",
    sidebarAccent: "#ffd715",
    sidebarBorder: "rgba(255,255,255,0.12)",
    sidebarBtnActive: "rgba(255,255,255,0.15)",

    sidebarLogoBg: "#ffffff",

    inputBg: "#f0f2f8",
    inputBorder: "rgba(23,52,97,0.12)",
    inputText: "#0a1a3a",

    kpiCardBg: "#ffffff",
    kpiBorder: "rgba(23,52,97,0.06)",

    secondary: "#ffd715",
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
