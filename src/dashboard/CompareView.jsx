import { useState, useMemo } from "react";
import { computeFlows } from "../engine/flows.js";
import { ETYPES } from "../lib/constants.js";
import { fMoney } from "../lib/format.js";
import { computeKPI } from "../engine/projections.js";

// Mini canvas renderer (simplified, non-interactive)
function MiniCanvas({ nodes, edges, fv, nc, theme, label, isActive, onClick }) {
  const edgePath = (from, to) => {
    const fn = nodes.find(n => n.id === from);
    const tn = nodes.find(n => n.id === to);
    if (!fn || !tn) return "";
    const x1 = fn.x + 100, y1 = fn.y + 30;
    const x2 = tn.x + 100, y2 = tn.y + 30;
    const dx = (x2 - x1) * 0.3;
    return `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`;
  };

  // Auto-fit: find bounding box
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs, 0) - 40;
  const minY = Math.min(...ys, 0) - 20;
  const maxX = Math.max(...xs.map((x, i) => x + (nodes[i]?.w || 200)), 400) + 40;
  const maxY = Math.max(...ys.map((y, i) => y + (nodes[i]?.h || 60)), 300) + 40;

  return (
    <div onClick={onClick} style={{
      flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
      border: isActive ? `2px solid ${theme.accent}` : "1px solid var(--border)",
      borderRadius: 16, background: theme.canvasBg, cursor: "pointer",
      boxShadow: isActive ? `0 0 20px ${theme.accentGlow}` : "none",
      transition: "all 0.2s",
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 14px", borderBottom: "1px solid var(--border)",
        background: isActive ? theme.btnActive : "transparent",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: isActive ? theme.accent : "var(--tx-secondary)", fontFamily: "Syne" }}>{label}</span>
        {isActive && <span style={{ fontSize: 8, color: theme.accent, fontFamily: "Space Mono", fontWeight: 700 }}>ÉDITION ACTIVE</span>}
      </div>
      
      {/* Mini SVG */}
      <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        style={{ flex: 1, width: "100%", background: theme.canvasBg }}>
        {/* Edges */}
        {edges.map(e => {
          const d = edgePath(e.from, e.to);
          const et = ETYPES.find(t => t.id === nodes.find(n => n.id === e.from)?.type);
          const c = et?.c || "#888";
          const amt = fv[e.id] || 0;
          return (
            <g key={e.id}>
              <path d={d} fill="none" stroke={c} strokeWidth={1.5} strokeOpacity={0.3} />
              {amt > 0 && <circle r={2} fill={c} opacity={0.6}>
                <animateMotion dur="3s" repeatCount="indefinite" path={d} />
              </circle>}
            </g>
          );
        })}
        {/* Nodes */}
        {nodes.map(node => {
          const et = ETYPES.find(t => t.id === node.type);
          const c = et?.c || "#666";
          const comp = nc[node.id];
          let sub = "";
          if (node.type === "societe" && comp) sub = `CA ${fMoney(comp.ca)}€`;
          else if (node.type === "holding" && comp) sub = `Tréso ${fMoney(comp.rNet)}€`;
          else if (node.type === "foyer" && comp) sub = `Marge ${fMoney(comp.margeM)}€/m`;
          else if (node.type === "personne" && comp) sub = `Net ${fMoney(comp.netMensuel)}€/m`;
          else if (node.type === "employeur" && comp) sub = `Brut ${fMoney(comp.salaireBrut)}€`;
          
          return (
            <g key={node.id}>
              <rect x={node.x} y={node.y} width={node.w || 200} height={node.h || 60} rx={10}
                fill={theme.nodeBg || "var(--bg-card)"} stroke={c} strokeWidth={1} strokeOpacity={0.4} />
              <line x1={node.x} y1={node.y} x2={node.x + (node.w || 200)} y2={node.y} stroke={c} strokeWidth={2} />
              <text x={node.x + 8} y={node.y + 18} fontSize={10} fontWeight={700} fill="var(--tx-primary)" fontFamily="Syne">
                <tspan fill={c} fontSize={9}>{et?.icon} </tspan>{node.l}
              </text>
              {sub && <text x={node.x + 8} y={node.y + 34} fontSize={8} fill="var(--tx-tertiary)" fontFamily="Space Mono">{sub}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Delta row component
function DeltaRow({ label, valueA, valueB, suffix = "€", icon }) {
  const delta = valueB - valueA;
  const pct = valueA !== 0 ? Math.round((delta / valueA) * 100) : 0;
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const color = isPositive ? "#40c880" : isNegative ? "#f06060" : "var(--tx-tertiary)";
  
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 11 }}>
      {icon && <span style={{ width: 20, fontSize: 10, color: "var(--tx-tertiary)" }}>{icon}</span>}
      <span style={{ flex: 1, color: "var(--tx-secondary)", fontWeight: 500 }}>{label}</span>
      <span style={{ width: 90, textAlign: "right", fontFamily: "Space Mono", fontSize: 10, color: "var(--tx-secondary)" }}>{fMoney(valueA)}{suffix}</span>
      <span style={{ width: 90, textAlign: "right", fontFamily: "Space Mono", fontSize: 10, color: "var(--tx-secondary)" }}>{fMoney(valueB)}{suffix}</span>
      <span style={{ width: 100, textAlign: "right", fontFamily: "Space Mono", fontSize: 10, fontWeight: 700, color }}>
        {delta === 0 ? "=" : `${isPositive ? "+" : ""}${fMoney(delta)}${suffix}`}
        {delta !== 0 && <span style={{ fontSize: 8, opacity: 0.7 }}> ({isPositive ? "+" : ""}{pct}%)</span>}
      </span>
    </div>
  );
}

export default function CompareView({ nodesA, edgesA, theme, onClose, onApplyB }) {
  // Scenario B starts as a deep copy of A
  const [nodesB, setNodesB] = useState(() => JSON.parse(JSON.stringify(nodesA)));
  const [edgesB, setEdgesB] = useState(() => JSON.parse(JSON.stringify(edgesA)));
  const [activeScenario, setActiveScenario] = useState("B"); // Which side is editable
  const [editingNode, setEditingNode] = useState(null);

  // Compute flows for both scenarios
  const resultA = useMemo(() => computeFlows(nodesA, edgesA), [nodesA, edgesA]);
  const resultB = useMemo(() => computeFlows(nodesB, edgesB), [nodesB, edgesB]);
  
  const kpiA = useMemo(() => computeKPI(nodesA, edgesA), [nodesA, edgesA]);
  const kpiB = useMemo(() => computeKPI(nodesB, edgesB), [nodesB, edgesB]);

  // Quick edit: modify a node data value in scenario B
  const updateBNodeData = (nodeId, key, value) => {
    setNodesB(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, [key]: value } } : n));
  };
  const updateBNodeLabel = (nodeId, label) => {
    setNodesB(prev => prev.map(n => n.id === nodeId ? { ...n, l: label } : n));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: theme.canvasBg }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", borderBottom: "1px solid var(--border)",
        background: theme.topBarBg,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--tx-primary)", fontFamily: "Syne" }}>Comparateur A / B</span>
          <span style={{ fontSize: 9, color: "var(--tx-tertiary)", fontFamily: "Space Mono" }}>Modifiez le scénario B puis comparez</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onApplyB && onApplyB(nodesB, edgesB)}
            style={{
              padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #40c878, #30a060)",
              color: "#0a1a10", fontSize: 11, fontWeight: 700, fontFamily: "Syne",
            }}>Appliquer B au canvas</button>
          <button onClick={onClose}
            style={{
              padding: "6px 16px", borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--bg-elevated)", color: "var(--tx-tertiary)",
              cursor: "pointer", fontSize: 11, fontWeight: 600,
            }}>Fermer</button>
        </div>
      </div>

      {/* Split canvases */}
      <div style={{ display: "flex", gap: 12, padding: 12, flex: 1, overflow: "hidden" }}>
        <MiniCanvas
          nodes={nodesA} edges={edgesA} fv={resultA.fv} nc={resultA.nc}
          theme={theme} label="Scénario A (actuel)"
          isActive={activeScenario === "A"} onClick={() => setActiveScenario("A")}
        />
        <MiniCanvas
          nodes={nodesB} edges={edgesB} fv={resultB.fv} nc={resultB.nc}
          theme={theme} label="Scénario B (modifié)"
          isActive={activeScenario === "B"} onClick={() => setActiveScenario("B")}
        />
      </div>

      {/* Quick edit panel for B */}
      <div style={{
        padding: "10px 16px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        background: "var(--bg-elevated)", maxHeight: 140, overflowY: "auto",
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--tx-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Modifier le scénario B (cliquez sur un noeud)
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {nodesB.filter(n => ["societe", "holding", "sci", "foyer", "personne", "employeur", "placement", "contrat_av", "emprunt"].includes(n.type)).map(n => (
            <button key={n.id} onClick={() => setEditingNode(editingNode === n.id ? null : n.id)}
              style={{
                padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 600,
                border: editingNode === n.id ? `1px solid ${theme.accent}` : "1px solid var(--border)",
                background: editingNode === n.id ? theme.btnActive : "var(--bg-card)",
                color: editingNode === n.id ? theme.accent : "var(--tx-secondary)",
              }}>{n.l}</button>
          ))}
        </div>
        {editingNode && (() => {
          const n = nodesB.find(nd => nd.id === editingNode);
          if (!n) return null;
          const d = n.data || {};
          const fields = [];
          if (n.type === "societe" || n.type === "holding") {
            fields.push({ k: "ca", l: "CA", v: d.ca || 0 });
            fields.push({ k: "remuneration", l: "Rémunération", v: d.remuneration || 0 });
            fields.push({ k: "tauxDistrib", l: "Distrib %", v: d.tauxDistrib || 80 });
            fields.push({ k: "tauxCharges", l: "Charges %", v: d.tauxCharges || 10 });
          }
          if (n.type === "sci") {
            fields.push({ k: "loyersMensuels", l: "Loyers /m", v: d.loyersMensuels || 0 });
            fields.push({ k: "chargesAnnuelles", l: "Charges /an", v: d.chargesAnnuelles || 0 });
          }
          if (n.type === "foyer") {
            fields.push({ k: "loyer", l: "Loyer /m", v: d.loyer || 0 });
            fields.push({ k: "divers", l: "Divers /m", v: d.divers || 0 });
          }
          if (n.type === "employeur") {
            fields.push({ k: "salaireBrut", l: "Salaire brut", v: d.salaireBrut || 0 });
          }
          if (n.type === "personne") {
            fields.push({ k: "partsFiscales", l: "Parts fiscales", v: d.partsFiscales || 1 });
          }
          if (n.type === "placement") {
            fields.push({ k: "capital", l: "Capital", v: d.capital || 0 });
            fields.push({ k: "rendement", l: "Rendement %", v: d.rendement || 3 });
            fields.push({ k: "versementMensuel", l: "Versement /m", v: d.versementMensuel || 0 });
          }
          if (n.type === "contrat_av") {
            fields.push({ k: "capitalInitial", l: "Capital", v: d.capitalInitial || 0 });
            fields.push({ k: "rendementUC", l: "Rdt UC %", v: d.rendementUC || 6 });
            fields.push({ k: "versementMensuel", l: "Versement /m", v: d.versementMensuel || 0 });
          }
          if (n.type === "emprunt") {
            fields.push({ k: "capitalEmprunte", l: "Capital", v: d.capitalEmprunte || 0 });
            fields.push({ k: "tauxInteret", l: "Taux %", v: d.tauxInteret || 3.5 });
          }
          
          return (
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent }}>{n.l} :</span>
              {fields.map(f => (
                <div key={f.k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 9, color: "var(--tx-tertiary)" }}>{f.l}</span>
                  <input type="number" value={f.v} onChange={e => updateBNodeData(n.id, f.k, +e.target.value)}
                    className="input-dark" style={{ width: 80, padding: "3px 6px", fontSize: 10 }} />
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Delta comparison table */}
      <div style={{ padding: "12px 20px", overflowY: "auto", maxHeight: 240 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 0 8px", borderBottom: "2px solid var(--border)" }}>
          <span style={{ width: 20 }}></span>
          <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: "var(--tx-tertiary)", textTransform: "uppercase" }}>Métrique</span>
          <span style={{ width: 90, textAlign: "right", fontSize: 9, fontWeight: 700, color: "#6090d0" }}>Scénario A</span>
          <span style={{ width: 90, textAlign: "right", fontSize: 9, fontWeight: 700, color: "#d06090" }}>Scénario B</span>
          <span style={{ width: 100, textAlign: "right", fontSize: 9, fontWeight: 700, color: "var(--tx-tertiary)" }}>Delta</span>
        </div>

        <DeltaRow label="CA total" valueA={kpiA.caTotal} valueB={kpiB.caTotal} icon="◆" />
        <DeltaRow label="IS total" valueA={kpiA.isTotal} valueB={kpiB.isTotal} icon="▣" />
        <DeltaRow label="Trésorerie holding" valueA={kpiA.tresoHolding} valueB={kpiB.tresoHolding} icon="◈" />
        <DeltaRow label="Revenu net foyer" valueA={kpiA.revFoyer} valueB={kpiB.revFoyer} icon="⌂" />
        <DeltaRow label="Marge mensuelle" valueA={kpiA.margeMensuelle} valueB={kpiB.margeMensuelle} suffix="€/m" icon="↑" />
        <DeltaRow label="Charges sociales" valueA={kpiA.chargesTotal} valueB={kpiB.chargesTotal} icon="↓" />
        <DeltaRow label="Flat tax foyer" valueA={kpiA.flatTaxFoyer} valueB={kpiB.flatTaxFoyer} icon="⊘" />
        <DeltaRow label="Patrimoine placements" valueA={kpiA.patrimoinePlacements} valueB={kpiB.patrimoinePlacements} icon="◎" />
        <DeltaRow label="Patrimoine immobilier" valueA={kpiA.patrimoineImmo} valueB={kpiB.patrimoineImmo} icon="⬡" />
      </div>
    </div>
  );
}
