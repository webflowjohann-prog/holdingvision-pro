import { useState, useRef, useEffect } from "react";
import useCanvasStore from "../store/canvasStore.js";
import { computeKPI } from "../engine/projections.js";
import { fMoney } from "../lib/format.js";
import { getAISystemPrompt } from "../engine/bricks.js";
import { ETYPES } from "../lib/constants.js";

// ═══ TOOL DEFINITIONS for Claude API ═══
const CANVAS_TOOLS = [
  {
    name: "add_node",
    description: "Ajoute un nouveau noeud (entité) sur le canvas. Types disponibles: societe, holding, sci, foyer, placement, emprunt, cession, donation, contrat_av, employeur, personne, fisc, source. Retourne l'ID du noeud créé.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["societe", "holding", "sci", "foyer", "placement", "emprunt", "cession", "donation", "contrat_av", "employeur", "personne", "fisc", "source"], description: "Type de noeud à créer" },
        label: { type: "string", description: "Nom affiché du noeud (ex: 'Ma SASU', 'SCI Immobilière', 'Assurance-vie')" },
        data: { type: "object", description: "Données initiales du noeud. Pour societe: {forme, ca, tauxCharges, tauxDistrib, remuneration}. Pour placement: {typePlacement, capital, rendement, fraisAnnuels, duree, versementMensuel}. Pour sci: {forme, loyersMensuels, chargesAnnuelles, interetsEmprunt, amortissement, bienValeur}. Pour emprunt: {capitalEmprunte, tauxInteret, dureeAns}. Pour foyer: {loyer, voiture, energie, mutuelle, credit, divers}. Pour contrat_av: {capitalInitial, versementMensuel, rendementFE, rendementUC, partUC, fraisGestion, fraisEntree, ageContrat, ageAssure, nbBeneficiaires}. Pour employeur: {salaireBrut, statut (cadre/non_cadre/fonctionnaire), interessement, participation}. Pour personne: {prenom, statut, partsFiscales, salaireBrut}." },
      },
      required: ["type", "label"],
    },
  },
  {
    name: "modify_node",
    description: "Modifie les données d'un noeud existant. Utilise le nom du noeud pour le trouver. Peut modifier une ou plusieurs propriétés.",
    input_schema: {
      type: "object",
      properties: {
        node_name: { type: "string", description: "Nom du noeud à modifier (ex: 'Société A', 'Holding Familiale')" },
        updates: { type: "object", description: "Propriétés à modifier. Ex: {ca: 80000} ou {forme: 'SARL'} ou {capital: 50000, rendement: 5}" },
        new_label: { type: "string", description: "Optionnel: nouveau nom pour le noeud" },
      },
      required: ["node_name", "updates"],
    },
  },
  {
    name: "add_edge",
    description: "Crée un flux (lien) entre deux noeuds. Types de flux: ca, dividendes, salaire, loyer, is, invest, emprunt, cession, donation_flux, autre.",
    input_schema: {
      type: "object",
      properties: {
        from_name: { type: "string", description: "Nom du noeud source" },
        to_name: { type: "string", description: "Nom du noeud destination" },
        flow_type: { type: "string", enum: ["ca", "dividendes", "salaire", "loyer", "is", "invest", "emprunt", "cession", "donation_flux", "autre"], description: "Type de flux" },
        montant_fixe: { type: "number", description: "Optionnel: montant fixe annuel du flux (sinon calculé automatiquement)" },
      },
      required: ["from_name", "to_name", "flow_type"],
    },
  },
  {
    name: "remove_node",
    description: "Supprime un noeud du canvas (et tous ses flux connectés).",
    input_schema: {
      type: "object",
      properties: {
        node_name: { type: "string", description: "Nom du noeud à supprimer" },
      },
      required: ["node_name"],
    },
  },
  {
    name: "load_template",
    description: "Charge un template prédéfini qui remplace tout le canvas. Templates: holding_familiale, freelance_sasu, liberal, apport_cession, integration_fiscale, donation_demembrement, investisseur_mono, investisseur_multi, sci_ir_vs_is.",
    input_schema: {
      type: "object",
      properties: {
        template_id: { type: "string", description: "ID du template à charger" },
      },
      required: ["template_id"],
    },
  },
];

// ═══ TOOL EXECUTION (connects to Zustand store) ═══
function executeTools(toolUseBlocks, nodes, store) {
  const results = [];

  for (const tool of toolUseBlocks) {
    try {
      switch (tool.name) {
        case "add_node": {
          const { type, label, data } = tool.input;
          // Find a good position (offset from existing nodes)
          const maxX = nodes.reduce((m, n) => Math.max(m, n.x), 200);
          const maxY = nodes.reduce((m, n) => Math.max(m, n.y), 100);
          const x = maxX + 50;
          const y = 100 + Math.random() * 200;
          store.addNode(type, Math.round(x), Math.round(y));
          // Get the newly added node and update its data
          const newNodes = useCanvasStore.getState().nodes;
          const newNode = newNodes[newNodes.length - 1];
          if (newNode) {
            store.updateNode(newNode.id, { l: label });
            if (data) {
              Object.entries(data).forEach(([k, v]) => {
                store.updateNodeData(newNode.id, k, v);
              });
            }
            results.push({ tool_use_id: tool.id, content: `Noeud "${label}" (${type}) créé avec succès. ID: ${newNode.id}` });
          }
          break;
        }
        case "modify_node": {
          const { node_name, updates, new_label } = tool.input;
          const node = nodes.find(n => n.l.toLowerCase().includes(node_name.toLowerCase()));
          if (node) {
            if (new_label) store.updateNode(node.id, { l: new_label });
            Object.entries(updates).forEach(([k, v]) => {
              store.updateNodeData(node.id, k, v);
            });
            results.push({ tool_use_id: tool.id, content: `Noeud "${node.l}" modifié: ${JSON.stringify(updates)}` });
          } else {
            results.push({ tool_use_id: tool.id, content: `Noeud "${node_name}" non trouvé. Noeuds disponibles: ${nodes.map(n => n.l).join(", ")}`, is_error: true });
          }
          break;
        }
        case "add_edge": {
          const { from_name, to_name, flow_type, montant_fixe } = tool.input;
          const fromNode = nodes.find(n => n.l.toLowerCase().includes(from_name.toLowerCase()));
          const toNode = nodes.find(n => n.l.toLowerCase().includes(to_name.toLowerCase()));
          if (fromNode && toNode) {
            store.addEdge(fromNode.id, toNode.id, flow_type);
            if (montant_fixe != null) {
              const newEdges = useCanvasStore.getState().edges;
              const newEdge = newEdges[newEdges.length - 1];
              if (newEdge) store.updateEdge(newEdge.id, { montantFixe: montant_fixe });
            }
            results.push({ tool_use_id: tool.id, content: `Flux "${flow_type}" créé: ${fromNode.l} → ${toNode.l}${montant_fixe ? ` (${fMoney(montant_fixe)}€/an)` : ""}` });
          } else {
            results.push({ tool_use_id: tool.id, content: `Noeuds non trouvés. Cherché: "${from_name}" et "${to_name}". Disponibles: ${nodes.map(n => n.l).join(", ")}`, is_error: true });
          }
          break;
        }
        case "remove_node": {
          const { node_name } = tool.input;
          const node = nodes.find(n => n.l.toLowerCase().includes(node_name.toLowerCase()));
          if (node) {
            store.removeNode(node.id);
            results.push({ tool_use_id: tool.id, content: `Noeud "${node.l}" supprimé.` });
          } else {
            results.push({ tool_use_id: tool.id, content: `Noeud "${node_name}" non trouvé.`, is_error: true });
          }
          break;
        }
        case "load_template": {
          const { template_id } = tool.input;
          store.loadTemplate(template_id);
          results.push({ tool_use_id: tool.id, content: `Template "${template_id}" chargé.` });
          break;
        }
        default:
          results.push({ tool_use_id: tool.id, content: `Outil inconnu: ${tool.name}`, is_error: true });
      }
    } catch (err) {
      results.push({ tool_use_id: tool.id, content: `Erreur: ${err.message}`, is_error: true });
    }
  }
  return results;
}

// ═══ MAIN COMPONENT ═══
export default function ChatBot({ nodes, edges, profile, activeBricks }) {
  const store = useCanvasStore();
  const BASE_SYSTEM = getAISystemPrompt(activeBricks || ["socle"]);
  const SYSTEM_PROMPT = `${BASE_SYSTEM}

Tu as la capacité de MODIFIER LE CANVAS directement grâce à tes outils. Quand l'utilisateur demande d'ajouter, modifier ou supprimer un élément, utilise les outils appropriés plutôt que de donner des instructions manuelles.

IMPORTANT:
- Utilise add_node pour créer de nouvelles entités (sociétés, holdings, SCI, placements, emprunts, etc.)
- Utilise modify_node pour changer les paramètres d'un noeud existant (CA, forme juridique, taux, etc.)
- Utilise add_edge pour créer des flux entre les noeuds (dividendes, salaire, loyer, IS, etc.)
- Utilise remove_node pour supprimer un noeud
- Quand tu crées un noeud, pense aussi à créer les flux nécessaires (ex: société → holding en dividendes, société → fisc en IS)
- Après avoir modifié le canvas, explique brièvement ce que tu as fait et pourquoi
- Pour les placements: typePlacement peut être "av" (assurance-vie), "per", "pea", "scpi", "cto" (compte-titres/FPCI), etc.
- Pour les sociétés: forme peut être "SASU", "SAS", "EURL", "SARL", "Micro"
- Pour les SCI: forme peut être "SCI-IS" ou "SCI-IR"`;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis votre assistant patrimonial. Je peux analyser votre structure, répondre à vos questions, ET modifier directement le canvas. Essayez: \"Ajoute une assurance-vie de 50 000€\" ou \"Passe la Société A en SARL\"." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  // ═══ VOICE RECOGNITION (push-to-talk: press to start, press again to send) ═══
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Reconnaissance vocale non supportée. Utilisez Chrome, Edge ou Safari."); return; }
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.continuous = true;      // Keep listening until manually stopped
    rec.interimResults = true;  // Show text as user speaks
    rec.onstart = () => setIsListening(true);
    rec.onresult = (ev) => {
      let t = "";
      for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
      transcriptRef.current = t;
      setInput(t);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => {
      // If still supposed to be listening (browser stopped it), restart
      if (recognitionRef.current && transcriptRef.current === "") {
        try { rec.start(); } catch(e) {}
      }
    };
    transcriptRef.current = "";
    recognitionRef.current = rec;
    rec.start();
  };

  const stopAndSend = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    const text = transcriptRef.current.trim();
    if (text) {
      sendMessage(text);
    }
    transcriptRef.current = "";
  };

  const toggleVoice = () => {
    if (isListening) {
      stopAndSend(); // Second press: stop and send
    } else {
      startListening(); // First press: start listening
    }
  };

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  // ═══ BUILD CONTEXT ═══
  const buildContext = () => {
    const kpi = computeKPI(nodes, edges);
    const entites = nodes.map(n => {
      const c = kpi.nc[n.id]; const d = n.data || {};
      let info = `"${n.l}" (type: ${n.type}${d.forme ? ", forme: " + d.forme : ""})`;
      if (d.ca) info += ` | CA: ${d.ca}€`;
      if (d.remuneration) info += ` | Rém: ${d.remuneration}€`;
      if (d.tauxDistrib) info += ` | Distrib: ${d.tauxDistrib}%`;
      if (c?.is) info += ` | IS: ${fMoney(c.is)}€`;
      if (c?.rNet) info += ` | Net: ${fMoney(c.rNet)}€`;
      if (c?.margeM != null && n.type === "foyer") info += ` | Marge: ${fMoney(c.margeM)}€/m`;
      if (d.typePlacement) info += ` | Type: ${d.typePlacement}, Capital: ${d.capital || 0}€, Rdt: ${d.rendement || 3}%`;
      if (d.capitalEmprunte) info += ` | Emprunt: ${d.capitalEmprunte}€ à ${d.tauxInteret}% sur ${d.dureeAns}ans`;
      return info;
    }).join("\n");

    return `CANVAS ACTUEL:\n${entites}\n\nKPI: CA ${fMoney(kpi.caTotal)}€, IS ${fMoney(kpi.isTotal)}€, Tréso holding ${fMoney(kpi.tresoHolding)}€, Marge foyer ${fMoney(kpi.margeMensuelle)}€/m`;
  };

  // ═══ SEND MESSAGE WITH TOOL USE LOOP ═══
  const sendMessage = async (overrideText) => {
    const text = overrideText || input;
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const context = buildContext();
      // Build conversation for API
      let apiMessages = [...messages.filter(m => m.role !== "system" && !m.isAction), { role: "user", content: text }]
        .map(m => ({ role: m.role, content: m.content }));
      
      // Inject context into last user message
      apiMessages[apiMessages.length - 1].content += `\n\n[Canvas: ${context}]`;

      let finalText = "";
      let actionsSummary = [];
      let iterations = 0;
      const maxIterations = 5; // Safety limit

      // Tool use loop: keep calling until we get a text response (not tool_use)
      while (iterations < maxIterations) {
        iterations++;
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            system: SYSTEM_PROMPT,
            messages: apiMessages,
            tools: CANVAS_TOOLS,
          }),
        });

        const data = await response.json();
        if (!data.content) { finalText = "Désolé, je n'ai pas pu répondre."; break; }

        // Extract text blocks
        const textBlocks = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
        const toolBlocks = data.content.filter(b => b.type === "tool_use");

        if (toolBlocks.length === 0) {
          // No tools called, we have our final response
          finalText = textBlocks || "Désolé, je n'ai pas pu répondre.";
          break;
        }

        // Execute tools on the canvas
        const currentNodes = useCanvasStore.getState().nodes;
        const toolResults = executeTools(toolBlocks, currentNodes, store);
        
        // Log actions for display
        toolResults.forEach(r => {
          if (!r.is_error) actionsSummary.push(r.content);
        });

        // Build tool_result messages for the next API call
        apiMessages.push({ role: "assistant", content: data.content });
        apiMessages.push({
          role: "user",
          content: toolResults.map(r => ({
            type: "tool_result",
            tool_use_id: r.tool_use_id,
            content: r.content,
            ...(r.is_error ? { is_error: true } : {}),
          })),
        });

        // If stop_reason is "end_turn", Claude is done
        if (data.stop_reason === "end_turn") {
          finalText = textBlocks || "Modifications effectuées.";
          break;
        }
      }

      // Display actions taken
      if (actionsSummary.length > 0) {
        setMessages(prev => [...prev, {
          role: "assistant", content: actionsSummary.join("\n"),
          isAction: true,
        }]);
      }

      // Display final text response
      if (finalText) {
        setMessages(prev => [...prev, { role: "assistant", content: finalText }]);
      }

    } catch (err) {
      console.error("ChatBot error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de connexion. Vérifiez votre réseau et réessayez." }]);
    }
    setLoading(false);
  };

  // ═══ RENDER ═══
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 50,
          width: 48, height: 48, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--copper), var(--orange-accent))",
          color: "#0e0d0a", border: "none", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(200,150,80,0.3), 0 0 24px rgba(200,150,80,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, transition: "all 0.25s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        title="Assistant IA">💬</button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 50,
      width: 400, height: 560,
      background: "var(--bg-card)", borderRadius: 20,
      boxShadow: "0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px var(--border-hover)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, rgba(200,150,80,0.08) 0%, transparent 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--copper), var(--orange-accent))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: "#0e0d0a", fontWeight: 800,
          }}>IA</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tx-primary)" }}>Assistant patrimonial</div>
            <div style={{ fontSize: 9, color: "var(--tx-tertiary)", fontFamily: "Space Mono" }}>Claude Sonnet · peut modifier le canvas</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)}
          style={{ color: "var(--tx-tertiary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontSize: 11, padding: "3px 8px" }}>✕</button>
      </div>

      {/* Messages */}
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "8px 12px", borderRadius: 12,
              fontSize: 12, lineHeight: 1.5,
              ...(m.role === "user"
                ? { background: "linear-gradient(135deg, var(--copper), var(--copper-dim))", color: "#0e0d0a", borderBottomRightRadius: 4 }
                : m.isAction
                  ? { background: "rgba(64,200,128,0.1)", color: "#40c880", border: "1px solid rgba(64,200,128,0.2)", borderBottomLeftRadius: 4, fontSize: 11, fontFamily: "Space Mono" }
                  : { background: "var(--bg-elevated)", color: "var(--tx-primary)", border: "1px solid var(--border)", borderBottomLeftRadius: 4 }),
            }}>
              {m.isAction && <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>✓ ACTIONS EFFECTUÉES</div>}
              {m.content.split("\n").map((line, j) => (
                <span key={j}>{line}{j < m.content.split("\n").length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              padding: "8px 12px", borderRadius: 12, borderBottomLeftRadius: 4,
              fontSize: 12, color: "var(--tx-tertiary)",
            }}>
              <span style={{ animation: "fadeIn 1s infinite alternate" }}>Réflexion en cours...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={toggleVoice} disabled={loading}
            style={{
              width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0,
              background: isListening ? "linear-gradient(135deg, #f05050, #d03030)" : "var(--bg-elevated)",
              color: isListening ? "#fff" : "var(--tx-tertiary)",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", animation: isListening ? "pulse 1.5s infinite" : "none",
            }}>{isListening ? "⏹" : "🎙"}</button>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder={isListening ? "Parlez maintenant..." : "Ex: Ajoute une assurance-vie de 50k€"}
            className="input-dark" style={{ flex: 1, fontSize: 12 }} />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            style={{
              padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer",
              background: loading || !input.trim() ? "var(--bg-elevated)" : "linear-gradient(135deg, var(--copper), var(--copper-dim))",
              color: loading || !input.trim() ? "var(--tx-tertiary)" : "#0e0d0a",
              fontWeight: 700, fontSize: 14, fontFamily: "Syne", transition: "all 0.2s",
            }}>→</button>
        </div>
        {isListening && (
          <div style={{ fontSize: 9, color: "#f05050", marginTop: 4, textAlign: "center", fontWeight: 600 }}>● Écoute en cours... Appuyez sur ⏹ pour envoyer</div>
        )}
        <div style={{ fontSize: 8, color: "var(--tx-tertiary)", marginTop: isListening ? 2 : 6, textAlign: "center" }}>
          IA peut modifier le canvas. Consultez un professionnel avant toute décision.
        </div>
      </div>
    </div>
  );
}
