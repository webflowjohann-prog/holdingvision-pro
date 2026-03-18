import { useState, useMemo } from "react";
import { computeFlows } from "../engine/flows.js";
import { computeKPI } from "../engine/projections.js";
import { analyzeAlerts } from "../engine/alerts.js";
import { ETYPES } from "../lib/constants.js";
import { fMoney, uid } from "../lib/format.js";
import useCanvasStore from "../store/canvasStore.js";

// Action generators for each alert type
function getAlertActions(alert, nodes, edges) {
  const actions = [];

  // Holding recommandée
  if (alert.title === "Holding recommandée") {
    actions.push({
      label: "Créer une holding",
      description: "Ajoute une holding SAS entre vos sociétés et le foyer avec le régime mère-fille.",
      execute: (store) => {
        const societes = nodes.filter(n => n.type === "societe");
        const foyer = nodes.find(n => n.type === "foyer");
        const fisc = nodes.find(n => n.type === "fisc");
        // Add holding
        store.addNode("holding", 350, 200);
        const newNodes = useCanvasStore.getState().nodes;
        const holding = newNodes[newNodes.length - 1];
        store.updateNode(holding.id, { l: "Holding Familiale" });
        store.updateNodeData(holding.id, "forme", "SAS");
        store.updateNodeData(holding.id, "tauxDistrib", 60);
        // Connect societes → holding
        societes.forEach(s => {
          store.addEdge(s.id, holding.id, "dividendes");
        });
        // Connect holding → foyer
        if (foyer) store.addEdge(holding.id, foyer.id, "dividendes");
        if (fisc) store.addEdge(holding.id, fisc.id, "is");
        return `Holding "Holding Familiale" créée, connectée à ${societes.length} société${societes.length > 1 ? "s" : ""}.`;
      },
    });
  }

  // TMI élevé sans PER
  if (alert.title.includes("PER") && alert.sev === "opportunity") {
    actions.push({
      label: "Ajouter un PER",
      description: "Crée un noeud PER avec déduction fiscale estimée.",
      execute: (store) => {
        store.addNode("placement", 500, 450);
        const newNodes = useCanvasStore.getState().nodes;
        const per = newNodes[newNodes.length - 1];
        store.updateNode(per.id, { l: "PER" });
        store.updateNodeData(per.id, "typePlacement", "per");
        store.updateNodeData(per.id, "capital", 0);
        store.updateNodeData(per.id, "rendement", 4);
        store.updateNodeData(per.id, "duree", 20);
        store.updateNodeData(per.id, "versementMensuel", 500);
        return `PER créé avec versement de 500€/mois.`;
      },
    });
  }

  // Aucun placement
  if (alert.title === "Aucun placement détecté") {
    actions.push({
      label: "Créer une assurance-vie",
      description: "Ajoute un contrat d'assurance-vie avec 50/50 fonds euros et UC.",
      execute: (store) => {
        store.addNode("contrat_av", 400, 450);
        const newNodes = useCanvasStore.getState().nodes;
        const av = newNodes[newNodes.length - 1];
        store.updateNode(av.id, { l: "Assurance-vie" });
        store.updateNodeData(av.id, "capitalInitial", 10000);
        store.updateNodeData(av.id, "versementMensuel", 200);
        store.updateNodeData(av.id, "partUC", 50);
        return `Assurance-vie créée: 10 000€ initial + 200€/mois.`;
      },
    });
  }

  // PEA sous-utilisé
  if (alert.title.includes("PEA sous-utilisé")) {
    actions.push({
      label: "Augmenter le PEA à 50 000€",
      description: "Configure le PEA avec un objectif de 50 000€.",
      execute: (store) => {
        const pea = nodes.find(n => n.type === "placement" && n.data?.typePlacement === "pea");
        if (pea) {
          store.updateNodeData(pea.id, "capital", 50000);
          return `PEA mis à jour: capital 50 000€.`;
        }
        return "PEA non trouvé.";
      },
    });
  }

  // Marge négative
  if (alert.title.includes("Marge mensuelle négative") || alert.title.includes("Marge mensuelle faible")) {
    actions.push({
      label: "Réduire les charges de 20%",
      description: "Applique une réduction de 20% sur les charges du foyer.",
      execute: (store) => {
        const foyer = nodes.find(n => n.type === "foyer");
        if (foyer) {
          const d = foyer.data || {};
          ["loyer", "voiture", "energie", "mutuelle", "divers"].forEach(k => {
            if (d[k] > 0) store.updateNodeData(foyer.id, k, Math.round(d[k] * 0.8));
          });
          return `Charges du foyer réduites de 20%.`;
        }
        return "Foyer non trouvé.";
      },
    });
  }

  // Patrimoine sans transmission
  if (alert.title.includes("stratégie de transmission")) {
    actions.push({
      label: "Créer une donation-démembrement",
      description: "Ajoute un noeud donation avec démembrement (barème 669 CGI).",
      execute: (store) => {
        store.addNode("donation", 550, 500);
        const newNodes = useCanvasStore.getState().nodes;
        const don = newNodes[newNodes.length - 1];
        store.updateNode(don.id, { l: "Donation-Démembrement" });
        store.updateNodeData(don.id, "isDemembre", true);
        store.updateNodeData(don.id, "ageDonateur", 60);
        store.updateNodeData(don.id, "nbEnfants", 2);
        return `Donation-démembrement créée (donateur 60 ans, 2 enfants).`;
      },
    });
  }

  // IFI
  if (alert.title.includes("IFI")) {
    actions.push({
      label: "Ajouter AV pour réduire l'IFI",
      description: "Les UC immobilières en assurance-vie ne sont pas soumises à l'IFI.",
      execute: (store) => {
        store.addNode("contrat_av", 300, 500);
        const newNodes = useCanvasStore.getState().nodes;
        const av = newNodes[newNodes.length - 1];
        store.updateNode(av.id, { l: "AV SCPI (hors IFI)" });
        store.updateNodeData(av.id, "capitalInitial", 100000);
        store.updateNodeData(av.id, "rendementUC", 5);
        store.updateNodeData(av.id, "partUC", 100);
        return `Assurance-vie SCPI créée (100 000€, hors IFI).`;
      },
    });
  }

  // Société sans rémunération
  if (alert.title.includes("pas de rémunération")) {
    const societe = nodes.find(n => n.type === "societe" && alert.title.includes(n.l));
    if (societe) {
      actions.push({
        label: "Ajouter une rémunération de 30 000€",
        description: "Configure une rémunération optimale pour valider des trimestres retraite.",
        execute: (store) => {
          store.updateNodeData(societe.id, "remuneration", 30000);
          return `Rémunération de ${societe.l} fixée à 30 000€.`;
        },
      });
    }
  }

  return actions;
}

const SEV_COLORS = { critical: "#f05050", warning: "#f0b040", opportunity: "#40c880", info: "#68a0f0" };
const SEV_ICONS = { critical: "⚠", warning: "⚡", opportunity: "💡", info: "ℹ" };

export default function PresentationMode({ nodes, edges, theme, client, onClose }) {
  const store = useCanvasStore();
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 50, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showKPI, setShowKPI] = useState(true);
  const [alertsHover, setAlertsHover] = useState(false);
  const [appliedMsg, setAppliedMsg] = useState(null);

  // Recompute from store (live updates after applying actions)
  const liveNodes = useCanvasStore(s => s.nodes);
  const liveEdges = useCanvasStore(s => s.edges);

  const { fv, nc } = useMemo(() => computeFlows(liveNodes, liveEdges), [liveNodes, liveEdges]);
  const kpi = useMemo(() => computeKPI(liveNodes, liveEdges), [liveNodes, liveEdges]);
  const alerts = useMemo(() => analyzeAlerts(liveNodes, liveEdges), [liveNodes, liveEdges]);

  const edgePath = (from, to) => {
    const fn = liveNodes.find(n => n.id === from);
    const tn = liveNodes.find(n => n.id === to);
    if (!fn || !tn) return { d: "", mx: 0, my: 0 };
    const x1 = fn.x + (fn.w || 200) / 2, y1 = fn.y + (fn.h || 60) / 2;
    const x2 = tn.x + (tn.w || 200) / 2, y2 = tn.y + (tn.h || 60) / 2;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = (x2 - x1) * 0.3;
    return { d: `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`, mx, my };
  };

  const onBg = (e) => { setIsPanning(true); setPanStart({ x: e.clientX - pan.x * zoom, y: e.clientY - pan.y * zoom }); };
  const onMM = (e) => { if (isPanning) setPan({ x: (e.clientX - panStart.x) / zoom, y: (e.clientY - panStart.y) / zoom }); };
  const onMU = () => setIsPanning(false);
  const onWh = (e) => { e.preventDefault(); setZoom(z => Math.max(0.3, Math.min(2, z * (1 - e.deltaY * 0.001)))); };

  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const weather = alerts.some(a => a.sev === "critical") ? "🌩️" : alerts.some(a => a.sev === "warning") ? "⛅" : alerts.some(a => a.sev === "opportunity") ? "🌤️" : "☀️";

  const applyAction = (action) => {
    const msg = action.execute(store);
    setAppliedMsg(msg);
    setTimeout(() => setAppliedMsg(null), 3000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: theme.canvasBg, display: "flex", flexDirection: "column" }}>
      
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: theme.accent, fontFamily: "Instrument Serif" }}>HoldingVision <span style={{ fontWeight: 400 }}>Pro</span></span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--tx-primary)", fontFamily: "Syne" }}>{client || "Client"}</span>
          <span style={{ fontSize: 10, color: "var(--tx-tertiary)", fontFamily: "Space Mono" }}>{date}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Weather icon with hover popup */}
          <div style={{ position: "relative" }}
            onMouseEnter={() => setAlertsHover(true)}
            onMouseLeave={() => setAlertsHover(false)}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              background: alerts.length > 0 ? "rgba(255,255,255,0.08)" : "rgba(64,200,128,0.1)",
              border: `1px solid ${alerts.some(a => a.sev === "critical") ? "rgba(240,80,80,0.3)" : alerts.some(a => a.sev === "warning") ? "rgba(240,180,60,0.3)" : "rgba(64,200,128,0.3)"}`,
              cursor: "pointer", fontSize: 20, transition: "all 0.2s",
            }}>
              {weather}
            </div>
            {alerts.length > 0 && (
              <div style={{
                position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9,
                background: alerts.some(a => a.sev === "critical") ? "#f05050" : "#f0b040",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 800, color: "#fff",
              }}>{alerts.length}</div>
            )}

            {/* Hover popup - alerts with actionable buttons */}
            {alertsHover && alerts.length > 0 && (
              <div style={{
                position: "absolute", top: 50, right: 0, width: 420, maxHeight: "70vh",
                overflowY: "auto", padding: 0,
                background: "rgba(14,13,10,0.95)", backdropFilter: "blur(20px)",
                borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
                zIndex: 300,
              }}
              onMouseEnter={() => setAlertsHover(true)}
              onMouseLeave={() => setAlertsHover(false)}>
                {/* Popup header */}
                <div style={{
                  padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 18 }}>{weather}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--tx-primary)", fontFamily: "Syne" }}>
                      {alerts.some(a => a.sev === "critical") ? "Alertes critiques" : alerts.some(a => a.sev === "warning") ? "Points d'attention" : "Opportunités détectées"}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--tx-tertiary)", fontFamily: "Space Mono" }}>
                      {alerts.length} recommandation{alerts.length > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Alerts list */}
                <div style={{ padding: "8px 12px 12px" }}>
                  {alerts.map((a, i) => {
                    const actions = getAlertActions(a, liveNodes, liveEdges);
                    return (
                      <div key={i} style={{
                        padding: "12px 14px", marginBottom: 8, borderRadius: 14,
                        background: `rgba(${a.sev === "critical" ? "240,80,80" : a.sev === "warning" ? "240,180,60" : a.sev === "opportunity" ? "64,200,128" : "100,160,240"},0.06)`,
                        border: `1px solid rgba(${a.sev === "critical" ? "240,80,80" : a.sev === "warning" ? "240,180,60" : a.sev === "opportunity" ? "64,200,128" : "100,160,240"},0.15)`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 11 }}>{SEV_ICONS[a.sev]}</span>
                          <span style={{ fontSize: 8, fontWeight: 700, color: SEV_COLORS[a.sev], fontFamily: "Space Mono", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {a.sev === "critical" ? "CRITIQUE" : a.sev === "warning" ? "ATTENTION" : a.sev === "opportunity" ? "OPPORTUNITÉ" : "INFO"}
                          </span>
                          <span style={{ fontSize: 8, color: "var(--tx-tertiary)", fontFamily: "Space Mono" }}>{a.cat}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 4 }}>{a.title}</div>
                        <div style={{ fontSize: 10, color: "var(--tx-secondary)", lineHeight: 1.5, marginBottom: a.impact || actions.length > 0 ? 8 : 0 }}>{a.detail}</div>
                        {a.impact && (
                          <div style={{ fontSize: 10, fontWeight: 600, color: SEV_COLORS[a.sev], marginBottom: actions.length > 0 ? 8 : 0, fontFamily: "Space Mono" }}>{a.impact}</div>
                        )}
                        
                        {/* Actionable buttons */}
                        {actions.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {actions.map((act, j) => (
                              <button key={j} onClick={() => applyAction(act)}
                                style={{
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                  width: "100%", padding: "8px 12px", borderRadius: 10,
                                  border: `1px solid ${SEV_COLORS[a.sev]}33`,
                                  background: `${SEV_COLORS[a.sev]}0a`,
                                  cursor: "pointer", transition: "all 0.2s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = `${SEV_COLORS[a.sev]}20`; e.currentTarget.style.borderColor = `${SEV_COLORS[a.sev]}66`; }}
                                onMouseLeave={e => { e.currentTarget.style.background = `${SEV_COLORS[a.sev]}0a`; e.currentTarget.style.borderColor = `${SEV_COLORS[a.sev]}33`; }}>
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: SEV_COLORS[a.sev], textAlign: "left" }}>{act.label}</div>
                                  <div style={{ fontSize: 9, color: "var(--tx-tertiary)", textAlign: "left", marginTop: 2 }}>{act.description}</div>
                                </div>
                                <span style={{ fontSize: 10, color: SEV_COLORS[a.sev], fontWeight: 800, flexShrink: 0, marginLeft: 8 }}>Appliquer →</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setShowKPI(!showKPI)} style={{
            padding: "6px 14px", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer",
            background: showKPI ? theme.btnActive : "transparent", color: showKPI ? theme.accent : "var(--tx-tertiary)",
            fontSize: 10, fontWeight: 600,
          }}>KPI</button>
          <button onClick={onClose} style={{
            padding: "6px 16px", borderRadius: 10, border: "1px solid var(--border)",
            background: "var(--bg-elevated)", color: "var(--tx-tertiary)",
            cursor: "pointer", fontSize: 10, fontWeight: 600,
          }}>✕ Quitter</button>
        </div>
      </div>

      {/* Applied action toast */}
      {appliedMsg && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", zIndex: 400,
          padding: "10px 24px", borderRadius: 12,
          background: "rgba(64,200,128,0.15)", border: "1px solid rgba(64,200,128,0.4)",
          color: "#40c880", fontSize: 12, fontWeight: 700, fontFamily: "Syne",
          backdropFilter: "blur(12px)", animation: "fadeIn 0.3s ease",
        }}>
          ✓ {appliedMsg}
        </div>
      )}

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: theme.canvasGradient, pointerEvents: "none", zIndex: 1 }} />
        
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: isPanning ? "grabbing" : "grab", background: theme.canvasBg }}
          onMouseDown={onBg} onMouseMove={onMM} onMouseUp={onMU} onWheel={onWh}>
          <g transform={`translate(${pan.x * zoom},${pan.y * zoom}) scale(${zoom})`}>
            {liveEdges.map(e => {
              const p = edgePath(e.from, e.to);
              const et = ETYPES.find(t => t.id === liveNodes.find(n => n.id === e.from)?.type);
              const c = et?.c || "#888";
              const amt = fv[e.id] || 0;
              return (
                <g key={e.id}>
                  <path d={p.d} fill="none" stroke={c} strokeWidth={2} strokeOpacity={0.3} />
                  {amt > 0 && [0, 1, 2].map(j => (
                    <circle key={j} r={3} fill={theme.flowParticle || c} opacity={0.7}>
                      <animateMotion dur={`${Math.max(2, 5 - amt / 10000)}s`} repeatCount="indefinite" begin={`${j * 0.8}s`} path={p.d} />
                    </circle>
                  ))}
                  {amt > 0 && (
                    <g>
                      <rect x={p.mx - 36} y={p.my - 10} width={72} height={18} rx={9} fill={theme.nodeBg || "var(--bg-card)"} stroke={c} strokeWidth={0.5} strokeOpacity={0.3} />
                      <text x={p.mx} y={p.my + 2} textAnchor="middle" fontSize={10} fontWeight={700} fill={c} fontFamily="Space Mono">{fMoney(amt)}€</text>
                    </g>
                  )}
                </g>
              );
            })}

            {liveNodes.map(node => {
              const et = ETYPES.find(t => t.id === node.type);
              const c = et?.c || "#666";
              const comp = nc[node.id];
              let sub = "";
              if (node.type === "societe" && comp) sub = `CA ${fMoney(comp.ca)}€ · IS ${fMoney(comp.is)}€ · Distrib. ${fMoney(comp.dist)}€`;
              else if (node.type === "holding" && comp) sub = `Tréso ${fMoney(comp.rNet)}€ · IS ${fMoney(comp.is)}€`;
              else if (node.type === "foyer" && comp) sub = `Revenus ${fMoney(comp.inc)}€ · Marge ${fMoney(comp.margeM)}€/m`;
              else if (node.type === "sci" && comp) sub = `Loyers ${fMoney((comp.totalLoyers || 0) + (comp.inc || 0))}€ · Net ${fMoney(comp.rNet)}€`;
              else if (node.type === "personne" && comp) sub = `Net ${fMoney(comp.netMensuel)}€/m · TMI ${comp.tmi}%`;
              else if (node.type === "employeur" && comp) sub = `Brut ${fMoney(comp.salaireBrut)}€/an`;
              else if (node.type === "contrat_av" && comp) sub = `${fMoney(comp.capitalNet)}€ · An8: ${fMoney(comp.capital8ans)}€`;
              else if (node.type === "placement" && comp?.lastP) sub = `An${comp.duree}: ${fMoney(comp.lastP.capital)}€`;

              return (
                <g key={node.id}>
                  <rect x={node.x - 2} y={node.y - 2} width={(node.w || 200) + 4} height={(node.h || 64) + 4} rx={16}
                    fill="none" stroke={c} strokeWidth={0.5} strokeOpacity={0.15} />
                  <rect x={node.x} y={node.y} width={node.w || 200} height={node.h || 64} rx={14}
                    fill={theme.nodeBg || "var(--bg-card)"} stroke={c} strokeWidth={1.5} strokeOpacity={0.4} />
                  <line x1={node.x} y1={node.y} x2={node.x + (node.w || 200)} y2={node.y} stroke={c} strokeWidth={2.5} strokeLinecap="round" />
                  <text x={node.x + 10} y={node.y + 20} fontSize={13} fontWeight={700} fill="var(--tx-primary)" fontFamily="Syne">
                    <tspan fill={c} fontSize={11}>{et?.icon} </tspan>{node.l}
                  </text>
                  {node.data?.forme && (
                    <>
                      <rect x={node.x + (node.w || 200) - 48} y={node.y + 7} width={40} height={18} rx={9} fill={c} fillOpacity={0.12} />
                      <text x={node.x + (node.w || 200) - 28} y={node.y + 20} textAnchor="middle" fontSize={9} fontWeight={600} fill={c} fontFamily="Space Mono">{node.data.forme}</text>
                    </>
                  )}
                  {sub && <text x={node.x + 10} y={node.y + 38} fontSize={9} fill="var(--tx-tertiary)" fontFamily="Space Mono">{sub.substring(0, 60)}</text>}
                </g>
              );
            })}
          </g>
        </svg>

        {/* KPI bar */}
        {showKPI && (
          <div style={{
            position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 10,
            display: "flex", gap: 10, padding: 14,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(16px)",
            borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {[
              { l: "CA total", v: fMoney(kpi.caTotal) + "€", c: "#0d7c5f" },
              { l: "IS total", v: fMoney(kpi.isTotal) + "€", c: "#b83d2a" },
              { l: "Trésorerie", v: fMoney(kpi.tresoHolding) + "€", c: "#a08430" },
              { l: "Revenu foyer", v: fMoney(kpi.revFoyer) + "€/an", c: "#2d6ab8" },
              { l: "Marge", v: fMoney(kpi.margeMensuelle) + "€/m", c: kpi.margeMensuelle >= 0 ? "#40c880" : "#f05050" },
              { l: "Patrimoine", v: fMoney(kpi.patrimoineTotal) + "€", c: "#2a7d3f" },
              ...(kpi.ifi?.isAssujetti ? [{ l: "IFI", v: fMoney(kpi.ifi.ifi) + "€", c: "#f05050" }] : []),
            ].map((k, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", fontFamily: "Space Mono", textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.l}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: k.c, fontFamily: "Syne", marginTop: 2 }}>{k.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
