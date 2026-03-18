import { useState, useMemo, useEffect, useRef } from "react";
import useCanvasStore from "./store/canvasStore.js";
import { computeFlows } from "./engine/flows.js";
import { ETYPES, FLOWS } from "./lib/constants.js";
import { fMoney } from "./lib/format.js";
import { TEMPLATES } from "./engine/templates.js";
import SocietePanel from "./panels/SocietePanel.jsx";
import HoldingPanel from "./panels/HoldingPanel.jsx";
import SCIPanel from "./panels/SCIPanel.jsx";
import PlacementPanel from "./panels/PlacementPanel.jsx";
import FoyerPanel from "./panels/FoyerPanel.jsx";
import EdgePanel from "./panels/EdgePanel.jsx";
import EmpruntPanel from "./panels/EmpruntPanel.jsx";
import CessionPanel from "./panels/CessionPanel.jsx";
import DonationPanel from "./panels/DonationPanel.jsx";
import ContratAVPanel from "./panels/ContratAVPanel.jsx";
import EmployeurPanel from "./panels/EmployeurPanel.jsx";
import PersonnePanel from "./panels/PersonnePanel.jsx";
import ClientWizard from "./ui/ClientWizard.jsx";
import CompareView from "./dashboard/CompareView.jsx";
import AlertsPanel from "./dashboard/AlertsPanel.jsx";
import PresentationMode from "./ui/PresentationMode.jsx";
import Dashboard from "./dashboard/Dashboard.jsx";
import { generatePDFReport } from "./export/PDFReport.jsx";
import ChatBot from "./ai/ChatBot.jsx";
// CompareScenarios removed - simplified to Canvas + Dashboard
import TemplateChooser from "./ui/TemplateChooser.jsx";
import ProfileSelector from "./ui/ProfileSelector.jsx";
import BrandingSetup from "./ui/BrandingSetup.jsx";
import useBrandStore from "./store/brandStore.js";
import { getBrandTheme, brandToEffectiveTheme } from "./engine/brandThemes.js";
import { ENTRY_PROFILES, BRICKS, getAvailableNodeTypes, getAISystemPrompt, getProfileTheme } from "./engine/bricks.js";
import { analyzeAlerts } from "./engine/alerts.js";
import { supabase } from "./lib/supabase.js";
import AuthScreen from "./auth/AuthScreen.jsx";
import ProjectsDashboard from "./auth/ProjectsDashboard.jsx";
import { useAutoSave } from "./hooks/useAutoSave.js";

export default function App() {
  // ═══ AUTH STATE ═══
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);

  // Check existing session on mount + restore project if refreshed
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user || null;
      setUser(u);

      // If user is logged in, check if we had a project open before refresh
      if (u) {
        try {
          const savedProjectId = sessionStorage.getItem("hvpro-current-project");
          if (savedProjectId) {
            setProjectLoading(true);
            const { data, error } = await supabase
              .from("projects")
              .select("*")
              .eq("id", savedProjectId)
              .eq("user_id", u.id)
              .single();
            if (!error && data) {
              const store = useCanvasStore.getState();
              if (data.nodes && data.nodes.length > 0) {
                store.setNodes(data.nodes);
                store.setEdges(data.edges || []);
              } else {
                store.reset();
              }
              setCurrentProject(data);
            } else {
              sessionStorage.removeItem("hvpro-current-project");
            }
            setProjectLoading(false);
          }
        } catch (e) {
          sessionStorage.removeItem("hvpro-current-project");
          setProjectLoading(false);
        }
      }

      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentProject(null);
    sessionStorage.removeItem("hvpro-current-project");
  };

  const handleOpenProject = (project) => {
    const store = useCanvasStore.getState();
    if (project.nodes && project.nodes.length > 0) {
      store.setNodes(project.nodes);
      store.setEdges(project.edges || []);
    } else {
      store.reset();
    }
    setCurrentProject(project);
    // Save project ID so we can restore after page refresh
    try { sessionStorage.setItem("hvpro-current-project", project.id); } catch(e) {}
  };

  const handleBackToProjects = () => {
    setCurrentProject(null);
    sessionStorage.removeItem("hvpro-current-project");
  };

  // Auth loading or project reloading
  if (authLoading || projectLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0e0d0a", color: "#d4b062", fontFamily: "Syne",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, marginBottom: 8 }}>HoldingVision</div>
          <div style={{ fontSize: 12, opacity: 0.5 }}>Chargement...</div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthScreen onAuth={setUser} />;
  }

  // Logged in but no project selected
  if (!currentProject) {
    return <ProjectsDashboard user={user} onOpenProject={handleOpenProject} onLogout={handleLogout} />;
  }

  // Project selected: show the main app
  return <AppWithProject
    user={user}
    project={currentProject}
    onBack={handleBackToProjects}
    onLogout={handleLogout}
  />;
}

function AppWithProject({ user, project, onBack, onLogout }) {
  // Profile + bricks state - persisted
  const [profile, setProfile] = useState(() => {
    try { return localStorage.getItem("hvpro-profile") || null; } catch(e) { return null; }
  });
  const [activeBricks, setActiveBricks] = useState(() => {
    try {
      const saved = localStorage.getItem("hvpro-bricks");
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });
  // Branding step: show after profile selection if no brand saved yet
  const [showBranding, setShowBranding] = useState(false);
  const brandStore = useBrandStore();

  // Init brand on mount with userId (loads from Supabase, applies CSS vars)
  useEffect(() => { brandStore.init(user?.id); }, [user?.id]);

  const handleProfileSelect = (id) => {
    const entry = ENTRY_PROFILES.find(p => p.id === id);
    setProfile(id);
    setActiveBricks(entry?.activeBricks || ["socle"]);
    try {
      localStorage.setItem("hvpro-profile", id);
      localStorage.setItem("hvpro-bricks", JSON.stringify(entry?.activeBricks || ["socle"]));
    } catch(e) {}
    // Show branding setup if no brand configured yet
    if (!brandStore.brand) {
      setShowBranding(true);
    }
  };

  const toggleBrick = (brickId) => {
    if (brickId === "socle") return; // socle always on
    setActiveBricks(prev => {
      const next = prev.includes(brickId)
        ? prev.filter(b => b !== brickId)
        : [...prev, brickId];
      try { localStorage.setItem("hvpro-bricks", JSON.stringify(next)); } catch(e) {}
      return next;
    });
  };

  // Show profile selector if no profile chosen
  if (!profile || !activeBricks) {
    return <ProfileSelector onSelect={handleProfileSelect} />;
  }

  // Show branding setup after profile selection (first time only)
  if (showBranding) {
    return <BrandingSetup
      profileId={profile}
      onComplete={(brand) => {
        brandStore.setBrand(brand, user?.id);
        setShowBranding(false);
      }}
      onSkip={() => setShowBranding(false)}
    />;
  }

  const profileData = ENTRY_PROFILES.find(p => p.id === profile);

  return <AppMain profile={profile} profileData={profileData} activeBricks={activeBricks} toggleBrick={toggleBrick}
    project={project} onBack={onBack} onLogout={onLogout} user={user}
    onChangeProfile={() => { setProfile(null); setActiveBricks(null); try { localStorage.removeItem("hvpro-profile"); localStorage.removeItem("hvpro-bricks"); } catch(e) {} }} />;
}

function AppMain({ profile, profileData, activeBricks, toggleBrick, onChangeProfile, project, onBack, onLogout, user }) {
  const store = useCanvasStore();
  const brandStore = useBrandStore();

  // ═══ AUTO-SAVE to Supabase ═══
  useAutoSave(project?.id, store.nodes, store.edges);

  // ═══ PROFILE THEME SYSTEM ═══
  const theme = getProfileTheme(profile);

  // ═══ BRAND-AWARE THEME: full brand theme replaces profile theme ═══
  const activeBrand = brandStore.brand?.themeId
    ? getBrandTheme(brandStore.brand.themeId)
    : null;

  const effectiveTheme = activeBrand
    ? { ...theme, ...brandToEffectiveTheme(activeBrand) }
    : theme;

  // Apply theme to CSS custom properties (supports both light and dark mode brands)
  useEffect(() => {
    const r = document.documentElement.style;
    const t = effectiveTheme;
    const isLight = t.mode === "light";

    // Layout
    r.setProperty("--bg-canvas", t.canvasBg);
    r.setProperty("--bg-base", t.sidebarBg);
    r.setProperty("--bg-deep", isLight ? "#f0f1f4" : "#0e0d0b");
    r.setProperty("--node-bg", t.nodeBg);
    r.setProperty("--node-border-sel", t.nodeSelBorder || t.accent);
    r.setProperty("--flow-particle", t.flowParticle);
    r.setProperty("--border-hover", t.borderHover);
    r.setProperty("--border-active", t.accent);
    r.setProperty("--shadow-glow", `0 0 20px ${t.accentGlow}`);

    // Accent system
    r.setProperty("--copper", t.accent);
    r.setProperty("--copper-bright", t.accentBright);
    r.setProperty("--copper-dim", t.accentDim);
    r.setProperty("--gold", t.accent);
    r.setProperty("--gold-bright", t.accentBright);
    r.setProperty("--gold-dim", t.accentDim);
    r.setProperty("--accent", t.accent);
    r.setProperty("--orange-accent", t.accentBright);
    r.setProperty("--gold-glow", t.accentGlow);

    // Text hierarchy (critical for light mode)
    if (t.txPrimary) {
      r.setProperty("--tx-primary", t.txPrimary);
      r.setProperty("--tx-secondary", t.txSecondary);
      r.setProperty("--tx-tertiary", t.txTertiary);
      r.setProperty("--tx-muted", t.txMuted);
      r.setProperty("--tx", t.txPrimary);
      r.setProperty("--tx2", t.txSecondary);
      r.setProperty("--tx3", t.txTertiary);
    }

    // Backgrounds for light mode
    if (isLight) {
      r.setProperty("--bg-card", t.cardBg || "#ffffff");
      r.setProperty("--bg-card-hover", t.inputBg || "#f0f1f6");
      r.setProperty("--bg-elevated", t.inputBg || "#f0f1f6");
      r.setProperty("--bg-input", t.inputBg || "#f0f1f6");
      r.setProperty("--bg-surface", t.cardBg || "#ffffff");
      r.setProperty("--bg-hover", t.inputBg || "#f0f1f6");
      r.setProperty("--card", t.cardBg || "#ffffff");
      r.setProperty("--border", t.borderAccent || "rgba(0,0,0,0.08)");
      r.setProperty("--brd", t.borderAccent || "rgba(0,0,0,0.08)");
      r.setProperty("--glass", "rgba(255,255,255,0.92)");
      r.setProperty("--glass-border", t.borderAccent || "rgba(0,0,0,0.06)");
      r.setProperty("--node-border", t.nodeBorder || "rgba(0,0,0,0.10)");
      r.setProperty("--shadow-sm", "0 1px 3px rgba(0,0,0,0.08)");
      r.setProperty("--shadow-md", "0 4px 12px rgba(0,0,0,0.10)");
      r.setProperty("--shadow-lg", "0 8px 32px rgba(0,0,0,0.12)");
    }

    // Borders
    r.setProperty("--brd-light", t.borderHover);
    r.setProperty("--brd-gold", t.accent);
    r.setProperty("--border-hover", t.borderHover);
    r.setProperty("--copper-muted", t.accentDim);

    return () => {
      // Clean up all custom properties on unmount
      const props = [
        "--bg-canvas", "--bg-base", "--bg-deep", "--node-bg", "--node-border-sel",
        "--flow-particle", "--border-hover", "--border-active", "--shadow-glow",
        "--copper", "--copper-bright", "--copper-dim", "--gold", "--gold-bright",
        "--gold-dim", "--accent", "--orange-accent", "--gold-glow",
        "--tx-primary", "--tx-secondary", "--tx-tertiary", "--tx-muted", "--tx", "--tx2", "--tx3",
        "--bg-card", "--bg-card-hover", "--bg-elevated", "--bg-input", "--bg-surface",
        "--bg-hover", "--card", "--border", "--brd", "--glass", "--glass-border",
        "--node-border", "--shadow-sm", "--shadow-md", "--shadow-lg",
        "--brd-light", "--brd-gold", "--copper-muted",
      ];
      props.forEach(p => r.removeProperty(p));
    };
  }, [profile, effectiveTheme]);
  const { nodes, edges, selectedNode, selectedEdge, zoom, pan } = store;
  const { selectNode, selectEdge, clearSelection, updateNodeData, updateNode } = store;
  const { removeNode, addNode, addEdge, updateEdge, removeEdge } = store;
  const { setZoom, setPan, loadTemplate, reset, setNodes, setEdges } = store;

  const [drag, setDrag] = useState(null);
  const [dragOff, setDragOff] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [conn, setConn] = useState(null);
  const [connPt, setConnPt] = useState({ x: 0, y: 0 });
  const [addMenu, setAddMenu] = useState(false);
  const [flowPick, setFlowPick] = useState(null);
  const [tab, setTab] = useState("canvas");
  const [client, setClient] = useState("Client");
  const [displayMode, setDisplayMode] = useState("annuel"); // "annuel" | "mensuel"
  const showTpl_state = useState(false);
  const [showTpl, setShowTpl] = showTpl_state;
  const [showWizard, setShowWizard] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showBrandEdit, setShowBrandEdit] = useState(false);

  // Display helper: converts annual amount to display mode
  const dsp = (annualAmount) => {
    if (displayMode === "mensuel") return Math.round(annualAmount / 12);
    return Math.round(annualAmount);
  };
  const dspLabel = displayMode === "mensuel" ? "/m" : "/an";
  const dspSuffix = displayMode === "mensuel" ? "€/m" : "€";

  // Persistence is now handled by Supabase auto-save (useAutoSave hook)

  const { fv, nc, tot } = useMemo(() => computeFlows(nodes, edges), [nodes, edges]);

  // Edge path calculator
  const ePath = (from, to) => {
    const fn = nodes.find(n => n.id === from), tn = nodes.find(n => n.id === to);
    if (!fn || !tn) return { d: "", mx: 0, my: 0 };
    const x1 = fn.x + (fn.w || 200) / 2, y1 = fn.y + (fn.h || 60) / 2;
    const x2 = tn.x + (tn.w || 200) / 2, y2 = tn.y + (tn.h || 60) / 2;
    const dx = (x2 - x1) * 0.3;
    return { d: `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`, mx: (x1+x2)/2, my: (y1+y2)/2 };
  };

  const onND = (e, node) => {
    e.stopPropagation();
    selectNode(node.id);
    const r = e.currentTarget.closest("svg").getBoundingClientRect();
    setDrag(node.id);
    setDragOff({ x: (e.clientX - r.left) / zoom - pan.x - node.x, y: (e.clientY - r.top) / zoom - pan.y - node.y });
  };

  const onBg = (e) => {
    // Only pan if clicking directly on the SVG background, not on any node element
    const target = e.target;
    if (target.tagName === "svg" || target.getAttribute("data-bg") === "true") {
      clearSelection(); setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x * zoom, y: e.clientY - pan.y * zoom });
    }
  };

  const onMM = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (drag) {
      updateNode(drag, {
        x: Math.round((e.clientX - r.left) / zoom - pan.x - dragOff.x),
        y: Math.round((e.clientY - r.top) / zoom - pan.y - dragOff.y)
      });
    } else if (isPanning) {
      setPan({ x: (e.clientX - panStart.x) / zoom, y: (e.clientY - panStart.y) / zoom });
    } else if (conn) {
      setConnPt({ x: (e.clientX - r.left) / zoom - pan.x, y: (e.clientY - r.top) / zoom - pan.y });
    }
  };

  const onMU = () => { setDrag(null); setIsPanning(false); if (conn) setConn(null); };
  const onWh = (e) => { e.preventDefault(); setZoom(zoom * (1 - e.deltaY * 0.001)); };

  const sN = selectedNode ? nodes.find(n => n.id === selectedNode) : null;
  const sE = selectedEdge ? edges.find(e => e.id === selectedEdge) : null;

  // Sidebar items
  const sideItems = [
    { id: "canvas", icon: "◇", label: "Canvas" },
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "sep1", sep: true },
    { id: "add", icon: "+", label: "Ajouter", action: () => setAddMenu(!addMenu) },
    { id: "tpl", icon: "⬡", label: "Templates", action: () => setShowTpl(true) },
    { id: "wizard", icon: "☻", label: "Nouveau client", action: () => setShowWizard(true) },
    { id: "compare", icon: "⇄", label: "Comparer A/B", action: () => setShowCompare(true) },
    { id: "present", icon: "▶", label: "Présentation", action: () => setShowPresentation(true) },
    { id: "pdf", icon: "↗", label: "Export PDF", action: () => generatePDFReport(nodes, edges, client, brandStore.getDisplayName(), brandStore.brand) },
    { id: "sep2", sep: true },
    { id: "reset", icon: "↺", label: "Reset", action: () => { reset(); try { localStorage.removeItem("hvpro"); } catch(e) {} } },
  ];

  return (
    <div style={{ height: "100vh", display: "flex", background: effectiveTheme.canvasBg }}>

      {/* ═══ LEFT SIDEBAR (reference: vertical icon bar) ═══ */}
      <div style={{
        width: 180, display: "flex", flexDirection: "column",
        paddingTop: 0, paddingBottom: 12, gap: 2,
        background: effectiveTheme.sidebarBg, borderRight: `1px solid ${effectiveTheme.borderAccent}`,
        position: "relative", zIndex: 40,
      }}>
        {/* Logo — White-label aware */}
        {brandStore.isWhiteLabel && brandStore.getLogoUrl() ? (
          <div style={{
            background: effectiveTheme.sidebarLogoBg || "#ffffff",
            padding: "10px 12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderBottom: `1px solid ${effectiveTheme.sidebarBorder || "rgba(255,255,255,0.1)"}`,
            marginBottom: 8, flexShrink: 0,
          }}>
            <img src={brandStore.getLogoUrl()} alt={brandStore.getDisplayName()}
              style={{ maxWidth: "100%", maxHeight: 48, objectFit: "contain" }}
              onError={e => { e.target.style.display = "none"; }}
            />
          </div>
        ) : (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "20px 12px 8px", marginBottom: 8,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${effectiveTheme.accent}, ${effectiveTheme.accentDim})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#0e0d0a", fontFamily: "Instrument Serif",
              boxShadow: `0 0 12px ${effectiveTheme.accentGlow}`,
            }}>H</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: effectiveTheme.sidebarText || "var(--tx-primary)", fontFamily: "Instrument Serif", lineHeight: 1 }}>
                Holding<span style={{ color: effectiveTheme.accent }}>Vision</span>
              </div>
              <div style={{ fontSize: 8, color: effectiveTheme.sidebarTextDim || "var(--tx-tertiary)", fontFamily: "Space Mono", letterSpacing: "0.1em" }}>PRO</div>
            </div>
          </div>
        )}

        <div style={{ width: "100%", height: 1, background: "var(--border)", marginBottom: 4 }} />

        {/* Project info + Back button */}
        {project && (
          <div style={{ padding: "4px 8px", marginBottom: 4 }}>
            <button onClick={onBack}
              style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(212, 176, 98, 0.15)",
                background: "rgba(212, 176, 98, 0.05)", color: effectiveTheme.accent,
                fontSize: 10, fontWeight: 600, fontFamily: "Syne", cursor: "pointer",
                transition: "all 0.2s",
              }}>
              <span style={{ fontSize: 12 }}>←</span> Mes dossiers
            </button>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "var(--tx-primary)",
              marginTop: 6, padding: "0 4px", lineHeight: 1.3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{project.name}</div>
            {project.client_name && (
              <div style={{ fontSize: 9, color: "var(--tx-tertiary)", padding: "0 4px", marginTop: 2 }}>
                {project.client_name}
              </div>
            )}
          </div>
        )}

        <div style={{ width: "100%", height: 1, background: "var(--border)", marginBottom: 4 }} />
        <div style={{ padding: "0 6px", fontSize: 8, fontWeight: 700, color: "var(--tx-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, marginTop: 4, paddingLeft: 12 }}>Navigation</div>
        {sideItems.filter(it => !it.action && !it.sep).map(it => {
          const isActive = tab === it.id;
          return (
            <button key={it.id} onClick={() => setTab(it.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: isActive ? (effectiveTheme.sidebarBtnActive || effectiveTheme.btnActive) : "transparent",
                color: isActive ? (effectiveTheme.sidebarAccent || effectiveTheme.accentBright) : (effectiveTheme.sidebarTextDim || "var(--tx-secondary)"),
                fontSize: 11, fontWeight: isActive ? 700 : 500, fontFamily: "Syne",
                textAlign: "left", transition: "all 0.15s",
                borderLeft: isActive ? `2px solid ${effectiveTheme.sidebarAccent || effectiveTheme.accent}` : "2px solid transparent",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = effectiveTheme.sidebarBtnActive || "var(--bg-card-hover)"; e.currentTarget.style.color = effectiveTheme.sidebarText || "var(--tx-primary)"; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = effectiveTheme.sidebarTextDim || "var(--tx-secondary)"; }}}>
              <span style={{ fontSize: 13, width: 20, textAlign: "center", opacity: isActive ? 1 : 0.6 }}>{it.icon}</span>
              <span>{it.label}</span>
            </button>
          );
        })}

        <div style={{ width: "calc(100% - 24px)", height: 1, background: "var(--border)", margin: "8px 12px" }} />

        {/* Actions */}
        <div style={{ padding: "0 6px", fontSize: 8, fontWeight: 700, color: effectiveTheme.sidebarTextDim || "var(--tx-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, paddingLeft: 12 }}>Actions</div>
        {sideItems.filter(it => it.action).map(it => (
          <button key={it.id} onClick={it.action}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "transparent", color: effectiveTheme.sidebarTextDim || "var(--tx-secondary)",
              fontSize: 11, fontWeight: 500, fontFamily: "Syne",
              textAlign: "left", transition: "all 0.15s",
              borderLeft: "2px solid transparent",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = effectiveTheme.sidebarBtnActive || "var(--bg-card-hover)"; e.currentTarget.style.color = effectiveTheme.sidebarText || "var(--tx-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = effectiveTheme.sidebarTextDim || "var(--tx-secondary)"; }}>
            <span style={{ fontSize: it.icon === "+" ? 16 : 13, width: 20, textAlign: "center", opacity: 0.6 }}>{it.icon}</span>
            <span>{it.label}</span>
          </button>
        ))}

        {/* Bottom: alerts + bricks + profile */}
        <div style={{ marginTop: "auto", padding: "0 12px" }}>
          <div style={{ width: "100%", height: 1, background: "var(--border)", marginBottom: 8 }} />

          {/* Alerts / Météo button */}
          {(() => {
            const alerts = analyzeAlerts(nodes, edges);
            const hasCritical = alerts.some(a => a.sev === "critical");
            const hasWarning = alerts.some(a => a.sev === "warning");
            const weather = hasCritical ? "🌩️" : hasWarning ? "⛅" : alerts.some(a => a.sev === "opportunity") ? "🌤️" : "☀️";
            const borderColor = hasCritical ? "rgba(240,80,80,0.4)" : hasWarning ? "rgba(240,180,60,0.4)" : "rgba(64,200,128,0.3)";
            const bgColor = hasCritical ? "rgba(240,80,80,0.08)" : hasWarning ? "rgba(240,180,60,0.08)" : "rgba(64,200,128,0.06)";
            return (
              <button onClick={() => setShowAlerts(!showAlerts)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "8px 10px", borderRadius: 10, border: `1px solid ${borderColor}`,
                  background: showAlerts ? borderColor : bgColor,
                  cursor: "pointer", marginBottom: 10, transition: "all 0.2s", position: "relative",
                }}>
                <span style={{ fontSize: 16 }}>{weather}</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tx-primary)" }}>Météo</div>
                  <div style={{ fontSize: 8, color: "var(--tx-tertiary)", fontFamily: "Space Mono" }}>
                    {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
                  </div>
                </div>
                {alerts.length > 0 && (
                  <span style={{
                    width: 18, height: 18, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
                    background: hasCritical ? "#f05050" : hasWarning ? "#f0b040" : "#40c880",
                    fontSize: 9, fontWeight: 800, color: "#fff",
                  }}>{alerts.length}</span>
                )}
              </button>
            );
          })()}
          
          {/* Brick toggles */}
          <div style={{ padding: "0 0 8px" }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: "var(--tx-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Briques actives</div>
            {["cgp", "juridique", "immo", "assurance"].map(bId => {
              const b = BRICKS[bId];
              const isOn = activeBricks.includes(bId);
              return (
                <button key={bId} onClick={() => toggleBrick(bId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, width: "100%",
                    padding: "5px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: isOn ? b.color + "15" : "transparent",
                    color: isOn ? b.color : "var(--tx-tertiary)",
                    fontSize: 10, fontWeight: isOn ? 600 : 400, fontFamily: "Syne",
                    textAlign: "left", transition: "all 0.15s", marginBottom: 2,
                  }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                    border: `1.5px solid ${isOn ? b.color : "var(--tx-muted)"}`,
                    background: isOn ? b.color + "30" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: isOn ? b.color : "transparent",
                  }}>{isOn ? "✓" : ""}</span>
                  <span>{b.icon} {b.label}</span>
                </button>
              );
            })}
          </div>
          
          <div style={{ width: "100%", height: 1, background: "var(--border)", marginBottom: 8 }} />
          
          {/* Active profile badge */}
          <div style={{
            padding: "8px 10px", borderRadius: 10, marginBottom: 8,
            background: effectiveTheme.btnActive,
            border: `1px solid ${effectiveTheme.borderHover}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: effectiveTheme.accent }}>{profileData?.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: effectiveTheme.accentBright }}>{profileData?.title}</span>
            </div>
            <div style={{ fontSize: 8, color: "var(--tx-tertiary)", lineHeight: 1.3 }}>{profileData?.subtitle}</div>
          </div>
          
          <button onClick={onChangeProfile}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "transparent", color: "var(--tx-tertiary)",
              fontSize: 10, fontFamily: "Syne", textAlign: "left", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--tx-secondary)"; e.currentTarget.style.background = "var(--bg-card-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--tx-tertiary)"; e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 11 }}>↻</span>
            <span>Changer de profil</span>
          </button>

          <button onClick={() => setShowBrandEdit(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "transparent", color: "var(--tx-tertiary)",
              fontSize: 10, fontFamily: "Syne", textAlign: "left", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--tx-secondary)"; e.currentTarget.style.background = "var(--bg-card-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--tx-tertiary)"; e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 11 }}>◎</span>
            <span>{brandStore.isWhiteLabel ? "Modifier ma marque" : "Personnaliser (marque blanche)"}</span>
          </button>

          <div style={{ fontSize: 8, color: "var(--tx-tertiary)", fontFamily: "Space Mono", padding: "6px 0 2px", textAlign: "center" }}>v1.0</div>
        </div>
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: effectiveTheme.canvasBg }}>

        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px", borderBottom: `1px solid ${effectiveTheme.borderAccent}`,
          background: effectiveTheme.topBarBg, backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: effectiveTheme.sidebarTextDim || "var(--tx-tertiary)" }}>Client :</span>
            <input value={client} onChange={e => setClient(e.target.value)}
              style={{
                width: 180, padding: "5px 12px", fontSize: 13, fontWeight: 600,
                color: effectiveTheme.sidebarText || effectiveTheme.accentBright,
                background: "rgba(255,255,255,0.08)", border: `1px solid ${effectiveTheme.sidebarBorder || "var(--border)"}`,
                borderRadius: 10, outline: "none", fontFamily: "Syne",
              }}
              placeholder="Nom du client" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Annuel / Mensuel toggle */}
            <div style={{
              display: "flex", borderRadius: 6, overflow: "hidden",
              border: `1px solid ${effectiveTheme.sidebarBorder || effectiveTheme.borderAccent}`, marginRight: 12,
            }}>
              {["annuel", "mensuel"].map(mode => (
                <button key={mode} onClick={() => setDisplayMode(mode)}
                  style={{
                    padding: "3px 10px", border: "none", cursor: "pointer",
                    fontSize: 9, fontWeight: 700, fontFamily: "Space Mono", textTransform: "uppercase",
                    background: displayMode === mode ? effectiveTheme.accent : "transparent",
                    color: displayMode === mode ? (effectiveTheme.btnText || "#0e0d0a") : (effectiveTheme.sidebarTextDim || "var(--tx-tertiary)"),
                    transition: "all 0.15s",
                  }}>{mode === "annuel" ? "AN" : "MOIS"}</button>
              ))}
            </div>
            <span style={{ fontSize: 10, color: effectiveTheme.sidebarTextDim || "var(--tx-tertiary)", fontFamily: "Space Mono" }}>
              Tréso <b style={{ color: effectiveTheme.sidebarAccent || effectiveTheme.accent }}>{fMoney(dsp(tot.treso))}{dspSuffix}</b>
              <span style={{ margin: "0 8px", color: effectiveTheme.sidebarBorder || "var(--tx-muted)" }}>|</span>
              IS <b style={{ color: "#f08070" }}>{fMoney(dsp(tot.is))}{dspSuffix}</b>
              <span style={{ margin: "0 8px", color: effectiveTheme.sidebarBorder || "var(--tx-muted)" }}>|</span>
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ═══ CANVAS ═══ */}
          {tab === "canvas" && (
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              {/* Ambient color glow */}
              <div style={{ position: "absolute", inset: 0, background: effectiveTheme.canvasGradient, pointerEvents: "none", zIndex: 1 }} />
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: isPanning ? "grabbing" : "grab", background: effectiveTheme.canvasBg }}
              onMouseDown={onBg} onMouseMove={onMM} onMouseUp={onMU} onWheel={onWh}>
              <defs>
                <marker id="ah" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6" fill="var(--tx-tertiary)" opacity=".4" />
                </marker>
                {/* Glow filter for selected nodes */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <g transform={`translate(${pan.x * zoom},${pan.y * zoom}) scale(${zoom})`}>
                <rect data-bg="true" x="-5000" y="-5000" width="10000" height="10000" fill="transparent" />

                {/* Grid dots */}
                {Array.from({ length: 40 }, (_, i) => Array.from({ length: 30 }, (_, j) => (
                  <circle key={`${i}-${j}`} cx={i * 50 - 500} cy={j * 50 - 300} r={0.7} fill={effectiveTheme.gridDot} />
                )))}

                {/* Edges */}
                {edges.map(e => {
                  const p = ePath(e.from, e.to);
                  const fl = FLOWS.find(f => f.id === e.flow);
                  const c = fl?.c || "#888";
                  const amt = fv[e.id] || 0;
                  const isSel = selectedEdge === e.id;
                  return (
                    <g key={e.id} onClick={ev => { ev.stopPropagation(); selectEdge(e.id); }} style={{ cursor: "pointer" }}>
                      {/* Invisible wider hit area for easy clicking */}
                      <path d={p.d} fill="none" stroke="transparent" strokeWidth={12} style={{ pointerEvents: "stroke" }} />
                      {/* Edge line - brighter */}
                      <path d={p.d} fill="none" stroke={c} strokeWidth={isSel ? 3 : 1.5}
                        strokeOpacity={isSel ? 0.9 : 0.4} markerEnd="url(#ah)" strokeDasharray={amt > 0 ? "" : "4 4"} />
                      {/* Flow particles - YELLOW/GOLD for high visibility */}
                      {amt > 0 && [0, 1, 2].map(j => (
                        <circle key={j} r={Math.min(3.5, 1.5 + amt / 15000)} fill={effectiveTheme.flowParticle} opacity={0.9}>
                          <animateMotion dur={`${Math.max(1.5, 4 - amt / 15000)}s`} repeatCount="indefinite" begin={`${j}s`} path={p.d} />
                        </circle>
                      ))}
                      {/* Amount label - always visible (empty pill when 0) */}
                      <g style={{ cursor: "pointer" }}>
                        <rect x={p.mx - 32} y={p.my - 11} width={64} height={20} rx={10}
                          fill={amt > 0 ? "var(--bg-elevated)" : isSel ? "var(--bg-elevated)" : "rgba(255,255,255,0.04)"}
                          stroke={c} strokeWidth={isSel ? 1.2 : 0.6} strokeOpacity={isSel ? 0.8 : amt > 0 ? 0.5 : 0.2} />
                        {amt > 0 ? (
                          <text x={p.mx} y={p.my + 3} textAnchor="middle" fontSize={8.5} fontWeight={700}
                            fill={effectiveTheme.accentBright} fontFamily="Space Mono">{fMoney(dsp(amt))} {dspSuffix}</text>
                        ) : (
                          <text x={p.mx} y={p.my + 3} textAnchor="middle" fontSize={7.5} fontWeight={500}
                            fill="var(--tx-tertiary)" fontFamily="Space Mono" opacity={isSel ? 0.8 : 0.4}>configurer</text>
                        )}
                      </g>
                    </g>
                  );
                })}

                {/* Connector line */}
                {conn && (() => {
                  const cn = nodes.find(n => n.id === conn);
                  return cn ? <line x1={cn.x + (cn.w || 200) / 2} y1={cn.y + (cn.h || 60) / 2}
                    x2={connPt.x} y2={connPt.y} stroke="var(--copper)" strokeWidth={1.2} strokeDasharray="5 3" opacity={0.5} /> : null;
                })()}

                {/* Nodes */}
                {nodes.map(node => {
                  const et = ETYPES.find(t => t.id === node.type);
                  const c = et?.c || "#888";
                  const isSel = selectedNode === node.id;
                  const comp = nc[node.id];
                  const w = node.w || 200, h = node.h || 60;

                  let sub = "";
                  if (node.type === "societe" && comp) sub = `CA ${fMoney(dsp(comp.ca))}${dspSuffix}  Net ${fMoney(dsp(comp.rNet))}${dspSuffix}`;
                  else if (node.type === "holding" && comp) sub = `Tréso ${fMoney(dsp(comp.rNet))}${dspSuffix}  IS ${fMoney(dsp(comp.is))}${dspSuffix}`;
                  else if (node.type === "sci" && comp) sub = `Loyers ${fMoney(dsp(comp.totalLoyers||0))}${dspSuffix}`;
                  else if (node.type === "placement" && comp?.lastP) sub = `An${comp.duree}: ${fMoney(comp.lastP.capital)}€`;
                  else if (node.type === "foyer" && comp) sub = `Marge ${fMoney(dsp(comp.marge))}${dspSuffix}${comp.empruntChargeMensuelle > 0 ? ` (empr. ${fMoney(comp.empruntChargeMensuelle)}€/m)` : ""}`;
                  else if (node.type === "fisc" && comp) sub = `Total ${fMoney(dsp(comp.inc))}${dspSuffix}`;
                  else if (node.type === "emprunt" && comp) sub = `${fMoney(comp.mensualiteAssurance)}€/m · ${fMoney(comp.mensualiteAnnuelle)}€/an`;
                  else if (node.type === "cession" && comp) sub = `PV ${fMoney(comp.plusValue)}€${comp.isApportCession ? " (report)" : ""}`;
                  else if (node.type === "donation" && comp) sub = `Droits ${fMoney(comp.droitsTotal)}€${comp.isDemembre ? " (NP)" : ""}`;
                  else if (node.type === "contrat_av" && comp) sub = `${fMoney(comp.capitalNet)}€ · Rdt ${comp.rdmtNet}% · An8: ${fMoney(comp.capital8ans)}€`;
                  else if (node.type === "employeur" && comp) sub = `${comp.statut} · Brut ${fMoney(comp.salaireBrut)}€/an`;
                  else if (node.type === "personne" && comp) sub = `Net ${fMoney(comp.netMensuel)}€/m · TMI ${comp.tmi}% · IR ${fMoney(comp.ir)}€`;

                  const darkNode = effectiveTheme.nodeBg && effectiveTheme.nodeText === "#ffffff";
                  // If node is dark, lighten the entity color for visibility
                  const nc2 = darkNode ? (c + "90") : c;
                  const iconColor = darkNode ? "#ffffff" : c;
                  const badgeColor = darkNode ? "rgba(255,255,255,0.85)" : c;
                  const badgeBg = darkNode ? "rgba(255,255,255,0.12)" : (c + "26");
                  const badgeBorder = darkNode ? "rgba(255,255,255,0.25)" : (c + "66");
                  const accentBarColor = darkNode ? effectiveTheme.accent : c;

                  return (
                    <g key={node.id} onMouseDown={e => onND(e, node)}
                      onMouseUp={() => { if (conn && conn !== node.id) { setFlowPick({ from: conn, to: node.id }); setConn(null); } }}
                      filter={isSel ? "url(#glow)" : undefined}
                      style={{ cursor: "pointer" }}>
                      {/* INVISIBLE HIT AREA - ensures click always registers */}
                      <rect x={node.x - 4} y={node.y - 4} width={w + 8} height={h + 8} rx={14}
                        fill="transparent" stroke="none" style={{ pointerEvents: "all" }} />
                      {/* Shadow layer */}
                      <rect x={node.x + 2} y={node.y + 3} width={w} height={h} rx={12}
                        fill={effectiveTheme.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.4)"} />
                      {/* Card bg */}
                      <rect x={node.x} y={node.y} width={w} height={h} rx={12}
                        fill={effectiveTheme.nodeBg} stroke={isSel ? accentBarColor : (darkNode ? "rgba(255,255,255,0.12)" : c + "40")} strokeWidth={isSel ? 2 : 1} />
                      {/* Top accent bar */}
                      <rect x={node.x} y={node.y} width={w} height={3} rx={1.5} fill={accentBarColor} opacity={0.8}
                        style={{ clipPath: `inset(0 0 0 0 round 12px 12px 0 0)` }} />
                      <rect x={node.x + 1} y={node.y + 1} width={w - 2} height={2.5} fill={accentBarColor} opacity={isSel ? 1 : 0.6} />
                      {/* Left color stripe */}
                      <rect x={node.x} y={node.y + 3} width={3} height={h - 6} fill={accentBarColor} opacity={0.4} />
                      {/* Icon circle */}
                      <circle cx={node.x + 20} cy={node.y + 24} r={10} fill={darkNode ? "rgba(255,255,255,0.08)" : c} fillOpacity={darkNode ? 1 : 0.15} stroke={darkNode ? "rgba(255,255,255,0.20)" : c} strokeWidth={0.8} strokeOpacity={darkNode ? 1 : 0.4} />
                      <text x={node.x + 20} y={node.y + 27.5} textAnchor="middle" fontSize={10} fill={iconColor}>{et?.icon}</text>
                      {/* Name */}
                      <text x={node.x + 36} y={node.y + 27} fontSize={12} fontWeight={700} fill={effectiveTheme.nodeText || "#f0ece4"} fontFamily="Syne">
                        {node.l.length > 18 ? node.l.substring(0, 18) + "…" : node.l}
                      </text>
                      {/* Forme badge */}
                      {node.data?.forme && (
                        <>
                          <rect x={node.x + w - 46} y={node.y + 13} width={38} height={18} rx={9}
                            fill={badgeBg} stroke={badgeBorder} strokeWidth={0.6} />
                          <text x={node.x + w - 27} y={node.y + 26} textAnchor="middle" fontSize={8} fontWeight={700}
                            fill={badgeColor} fontFamily="Space Mono">{node.data.forme}</text>
                        </>
                      )}
                      {/* Subtitle */}
                      {sub && (
                        <text x={node.x + 14} y={node.y + h - 10} fontSize={9} fill={effectiveTheme.nodeSubtext || "#b0a890"} fontFamily="Space Mono" fontWeight={500}>
                          {sub.substring(0, 38)}
                        </text>
                      )}
                      {/* Associés */}
                      {node.data?.associes?.length > 0 && h > 55 && (
                        <text x={node.x + 36} y={node.y + 41} fontSize={8.5} fill={effectiveTheme.nodeSubtext || "#807868"} fontFamily="Syne">
                          {node.data.associes.map(a => `${a.n} ${a.p}%`).join(" · ").substring(0, 38)}
                        </text>
                      )}
                      {/* Connector handle */}
                      <circle cx={node.x + w} cy={node.y + h / 2} r={5}
                        fill={darkNode ? effectiveTheme.nodeBg : "#ffffff"} stroke={accentBarColor} strokeWidth={1.5} style={{ cursor: "crosshair" }}
                        onMouseDown={e => { e.stopPropagation(); setConn(node.id); }} />
                    </g>
                  );
                })}
              </g>
            </svg>
            </div>
          )}

          {/* Dashboard */}
          {tab === "dashboard" && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <Dashboard nodes={nodes} edges={edges} profile={profile} />
              </div>
              <div style={{ width: 340, borderLeft: "1px solid var(--border)", overflowY: "auto", padding: 14, background: "var(--bg-card)" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--tx-primary)", fontFamily: "Syne", marginBottom: 12 }}>Alertes & Recommandations</div>
                <AlertsPanel nodes={nodes} edges={edges} />
              </div>
            </div>
          )}

          {/* ═══ RIGHT PANEL ═══ */}
          {tab === "canvas" && (sN || sE) && (
            <div className="anim-slide" style={{
              width: 340, overflowY: "auto",
              background: effectiveTheme.mode === "light" ? "#f4f5f8" : (effectiveTheme.sidebarBg || "var(--bg-card)"),
              color: effectiveTheme.mode === "light" ? "#1e274a" : (effectiveTheme.sidebarText || "var(--tx-primary)"),
              borderLeft: `1px solid ${effectiveTheme.borderAccent || "var(--border)"}`,
              boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
            }}>
              {sN && (() => {
                const et = ETYPES.find(t => t.id === sN.type);
                return (
                <>
                  {/* Panel header with entity color accent */}
                  <div style={{
                    padding: "14px 16px 12px", borderBottom: "1px solid var(--border)",
                    background: `linear-gradient(180deg, rgba(${et?.c === "#40e8b0" ? "64,232,176" : et?.c === "#f0c878" ? "240,200,120" : et?.c === "#70b8f8" ? "112,184,248" : et?.c === "#b898f0" ? "184,152,240" : et?.c === "#70e890" ? "112,232,144" : et?.c === "#f08070" ? "240,128,112" : "168,160,144"},0.06) 0%, transparent 100%)`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <input value={sN.l} onChange={e => updateNode(selectedNode, { l: e.target.value })}
                        style={{
                          fontWeight: 700, fontSize: 15, background: "transparent", border: "none", outline: "none",
                          color: "var(--tx-primary)", flex: 1, fontFamily: "Syne",
                        }} />
                      <button onClick={() => removeNode(selectedNode)}
                        style={{ color: "var(--tx-tertiary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontSize: 11, padding: "3px 8px", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#f08070"; e.currentTarget.style.color = "#f08070"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--tx-tertiary)"; }}>✕</button>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--tx-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: et?.c, fontSize: 12 }}>{et?.icon}</span>
                      <span>{et?.l}</span>
                      {sN.data?.forme && (
                        <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "var(--bg-elevated)", border: "1px solid var(--border)", fontFamily: "Space Mono", color: et?.c }}>{sN.data.forme}</span>
                      )}
                    </div>
                  </div>

                  {/* Panel content */}
                  <div style={{
                    padding: 16,
                    ...(effectiveTheme.mode === "light" ? {
                      "--tx-primary": "#1a1e35",
                      "--tx-secondary": "#3a4060",
                      "--tx-tertiary": "#6a7090",
                      "--tx-muted": "#9aa0b8",
                      "--tx": "#1a1e35",
                      "--tx2": "#3a4060",
                      "--tx3": "#6a7090",
                      "--bg-elevated": "#ffffff",
                      "--bg-input": "#ffffff",
                      "--bg-card": "#ffffff",
                      "--bg-card-hover": "#eef0f5",
                      "--bg-surface": "#ffffff",
                      "--card": "#ffffff",
                      "--border": "rgba(30,39,74,0.15)",
                      "--brd": "rgba(30,39,74,0.15)",
                      "--copper": effectiveTheme.accent,
                      "--gold": effectiveTheme.accent,
                      "--accent": effectiveTheme.accent,
                    } : {}),
                  }}>
                    {sN.type === "societe" && <SocietePanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {sN.type === "holding" && <HoldingPanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {sN.type === "sci" && <SCIPanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {sN.type === "placement" && <PlacementPanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {sN.type === "foyer" && <FoyerPanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {sN.type === "emprunt" && <EmpruntPanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {sN.type === "cession" && <CessionPanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {sN.type === "donation" && <DonationPanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {sN.type === "contrat_av" && <ContratAVPanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {sN.type === "employeur" && <EmployeurPanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {sN.type === "personne" && <PersonnePanel node={sN} computed={nc[selectedNode]} onData={(k, v) => updateNodeData(selectedNode, k, v)} />}
                    {(sN.type === "fisc" || sN.type === "source" || sN.type === "invest") && nc[selectedNode] && (
                      <div style={{ padding: 14, fontSize: 11, color: "var(--tx-secondary)", background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
                        {nc[selectedNode].detail || `Total reçu: ${fMoney(nc[selectedNode].inc || 0)} €`}
                      </div>
                    )}
                  </div>
                </>
              );})()}
              {sE && (
                <div style={{ padding: 16 }}>
                  <EdgePanel edge={sE} amount={fv[sE.id] || 0} nodes={nodes}
                    onUpdate={u => updateEdge(selectedEdge, u)} onRemove={() => removeEdge(selectedEdge)} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Add menu */}
      {addMenu && (
        <div className="anim-scale" style={{
          position: "fixed", left: 190, top: 200, zIndex: 60,
          background: "var(--bg-elevated)", border: `1px solid ${effectiveTheme.borderHover}`,
          borderRadius: 14, padding: 8, minWidth: 200, boxShadow: "var(--shadow-lg)",
        }}>
          {ETYPES.filter(et => !et.brick || activeBricks.includes(et.brick)).map(et => (
            <button key={et.id} onClick={() => { addNode(et.id, 300, 250); setAddMenu(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px",
                background: "transparent", border: "none", borderRadius: 8, cursor: "pointer",
                color: "var(--tx-primary)", fontSize: 11, fontFamily: "Syne", textAlign: "left",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ color: et.c, fontSize: 13 }}>{et.icon}</span>
              <span>{et.l}</span>
            </button>
          ))}
        </div>
      )}

      {/* Flow picker */}
      {flowPick && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setFlowPick(null)}>
          <div className="anim-scale" style={{
            background: "var(--bg-elevated)", border: "1px solid var(--border-hover)",
            borderRadius: 16, padding: 16, minWidth: 220, boxShadow: "var(--shadow-lg)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 12 }}>Type de flux</div>
            {FLOWS.map(f => (
              <button key={f.id} onClick={() => { addEdge(flowPick.from, flowPick.to, f.id); setFlowPick(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px",
                  background: "transparent", border: "none", borderRadius: 8, cursor: "pointer",
                  color: "var(--tx-primary)", fontSize: 11, fontFamily: "Syne", textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: f.c }} />
                {f.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template chooser */}
      {showTpl && <TemplateChooser activeBricks={activeBricks} onSelect={id => { loadTemplate(id); try { localStorage.removeItem("hvpro"); } catch(e) {} }} onClose={() => setShowTpl(false)} />}

      {/* Client wizard */}
      {showWizard && <ClientWizard onClose={() => setShowWizard(false)} />}

      {/* Compare A/B - replaces main content */}
      {showCompare && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90, background: effectiveTheme.canvasBg }}>
          <CompareView
            nodesA={nodes} edgesA={edges} theme={theme}
            onClose={() => setShowCompare(false)}
            onApplyB={(newNodes, newEdges) => {
              store.setNodes(newNodes);
              store.setEdges(newEdges);
              setShowCompare(false);
            }}
          />
        </div>
      )}

      {/* Presentation mode */}
      {showPresentation && (
        <PresentationMode nodes={nodes} edges={edges} theme={theme} client={client} onClose={() => setShowPresentation(false)} />
      )}

      {/* Brand editing overlay */}
      {showBrandEdit && (
        <BrandingSetup
          profileId={profile}
          onComplete={(brand) => {
            brandStore.setBrand(brand, user?.id);
            setShowBrandEdit(false);
          }}
          onSkip={() => setShowBrandEdit(false)}
        />
      )}

      {/* Actionable alerts panel (floating over canvas) */}
      {showAlerts && (() => {
        const alerts = analyzeAlerts(nodes, edges);
        const SEV_COLORS = { critical: "#f05050", warning: "#f0b040", opportunity: "#40c880", info: "#68a0f0" };
        const SEV_ICONS = { critical: "⚠", warning: "⚡", opportunity: "💡", info: "ℹ" };
        const SEV_LABELS = { critical: "CRITIQUE", warning: "ATTENTION", opportunity: "OPPORTUNITÉ", info: "INFO" };
        const weather = alerts.some(a => a.sev === "critical") ? "🌩️" : alerts.some(a => a.sev === "warning") ? "⛅" : alerts.some(a => a.sev === "opportunity") ? "🌤️" : "☀️";

        const applyAction = (action) => {
          const msg = action.execute(store);
          setShowAlerts(false);
        };

        // Simplified action generator
        const getActions = (a) => {
          const actions = [];
          if (a.title === "Holding recommandée") {
            actions.push({ label: "Créer une holding SAS", desc: "Ajoute une holding entre vos sociétés et le foyer.", execute: (st) => {
              const societes = nodes.filter(n => n.type === "societe"); const foyer = nodes.find(n => n.type === "foyer"); const fisc = nodes.find(n => n.type === "fisc");
              st.addNode("holding", 350, 200); const nn = useCanvasStore.getState().nodes; const h = nn[nn.length - 1];
              st.updateNode(h.id, { l: "Holding Familiale" }); st.updateNodeData(h.id, "forme", "SAS"); st.updateNodeData(h.id, "tauxDistrib", 60);
              societes.forEach(s => st.addEdge(s.id, h.id, "dividendes"));
              if (foyer) st.addEdge(h.id, foyer.id, "dividendes"); if (fisc) st.addEdge(h.id, fisc.id, "is");
              return "Holding créée.";
            }});
          }
          if (a.title.includes("PER")) actions.push({ label: "Ajouter un PER 500€/m", desc: "Déduction fiscale immédiate.", execute: (st) => {
            st.addNode("placement", 500, 450); const nn = useCanvasStore.getState().nodes; const p = nn[nn.length - 1];
            st.updateNode(p.id, { l: "PER" }); st.updateNodeData(p.id, "typePlacement", "per"); st.updateNodeData(p.id, "versementMensuel", 500); st.updateNodeData(p.id, "rendement", 4); st.updateNodeData(p.id, "duree", 20);
          }});
          if (a.title === "Aucun placement détecté") actions.push({ label: "Créer une assurance-vie", desc: "10 000€ + 200€/mois, 50/50 FE/UC.", execute: (st) => {
            st.addNode("contrat_av", 400, 450); const nn = useCanvasStore.getState().nodes; const av = nn[nn.length - 1];
            st.updateNode(av.id, { l: "Assurance-vie" }); st.updateNodeData(av.id, "capitalInitial", 10000); st.updateNodeData(av.id, "versementMensuel", 200);
          }});
          if (a.title.includes("stratégie de transmission")) actions.push({ label: "Créer donation-démembrement", desc: "Barème 669 CGI, 2 enfants.", execute: (st) => {
            st.addNode("donation", 550, 500); const nn = useCanvasStore.getState().nodes; const d = nn[nn.length - 1];
            st.updateNode(d.id, { l: "Donation-Démembrement" }); st.updateNodeData(d.id, "isDemembre", true); st.updateNodeData(d.id, "nbEnfants", 2);
          }});
          if (a.title.includes("IFI")) actions.push({ label: "AV SCPI (hors IFI)", desc: "100 000€ en UC immobilières via AV.", execute: (st) => {
            st.addNode("contrat_av", 300, 500); const nn = useCanvasStore.getState().nodes; const av = nn[nn.length - 1];
            st.updateNode(av.id, { l: "AV SCPI (hors IFI)" }); st.updateNodeData(av.id, "capitalInitial", 100000); st.updateNodeData(av.id, "partUC", 100);
          }});
          if (a.title.includes("pas de rémunération")) {
            const soc = nodes.find(n => n.type === "societe" && a.title.includes(n.l));
            if (soc) actions.push({ label: "Rémunération 30 000€", desc: "Valide les trimestres retraite.", execute: (st) => { st.updateNodeData(soc.id, "remuneration", 30000); }});
          }
          return actions;
        };

        return (
          <div style={{
            position: "fixed", left: 200, top: 60, width: 420, maxHeight: "80vh",
            overflowY: "auto", zIndex: 80,
            background: "var(--bg-card)", borderRadius: 20,
            border: "1px solid var(--border-hover)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            {/* Header */}
            <div style={{
              padding: "14px 18px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(180deg, rgba(200,150,80,0.06), transparent)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{weather}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--tx-primary)", fontFamily: "Syne" }}>Recommandations</div>
                  <div style={{ fontSize: 9, color: "var(--tx-tertiary)", fontFamily: "Space Mono" }}>{alerts.length} alerte{alerts.length > 1 ? "s" : ""} détectée{alerts.length > 1 ? "s" : ""}</div>
                </div>
              </div>
              <button onClick={() => setShowAlerts(false)} style={{ color: "var(--tx-tertiary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "4px 10px", fontSize: 11 }}>✕</button>
            </div>

            {/* Alerts list */}
            <div style={{ padding: "10px 14px" }}>
              {alerts.length === 0 && (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>☀️</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#40c880" }}>Au beau fixe</div>
                  <div style={{ fontSize: 10, color: "var(--tx-tertiary)", marginTop: 4 }}>Structure optimisée. Aucune alerte.</div>
                </div>
              )}
              {alerts.map((a, i) => {
                const actions = getActions(a);
                return (
                  <div key={i} style={{
                    padding: "12px 14px", marginBottom: 8, borderRadius: 14,
                    background: `${SEV_COLORS[a.sev]}08`, border: `1px solid ${SEV_COLORS[a.sev]}20`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 11 }}>{SEV_ICONS[a.sev]}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: SEV_COLORS[a.sev], fontFamily: "Space Mono" }}>{SEV_LABELS[a.sev]}</span>
                      <span style={{ fontSize: 8, color: "var(--tx-tertiary)", fontFamily: "Space Mono" }}>{a.cat}</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 4 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: "var(--tx-secondary)", lineHeight: 1.5 }}>{a.detail}</div>
                    {a.impact && <div style={{ fontSize: 10, fontWeight: 600, color: SEV_COLORS[a.sev], marginTop: 4, fontFamily: "Space Mono" }}>{a.impact}</div>}
                    {actions.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                        {actions.map((act, j) => (
                          <button key={j} onClick={() => applyAction(act)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              width: "100%", padding: "7px 12px", borderRadius: 10,
                              border: `1px solid ${SEV_COLORS[a.sev]}30`, background: `${SEV_COLORS[a.sev]}08`,
                              cursor: "pointer", transition: "all 0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${SEV_COLORS[a.sev]}20`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = `${SEV_COLORS[a.sev]}08`; }}>
                            <div style={{ textAlign: "left" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: SEV_COLORS[a.sev] }}>{act.label}</div>
                              <div style={{ fontSize: 9, color: "var(--tx-tertiary)" }}>{act.desc}</div>
                            </div>
                            <span style={{ fontSize: 10, color: SEV_COLORS[a.sev], fontWeight: 800, flexShrink: 0 }}>Appliquer →</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Chatbot */}
      <ChatBot nodes={nodes} edges={edges} profile={profile} activeBricks={activeBricks} />
    </div>
  );
}
