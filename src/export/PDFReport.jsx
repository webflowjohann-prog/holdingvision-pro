import { useMemo } from "react";
import { computeKPI, projectPatrimoine } from "../engine/projections.js";
import { ETYPES } from "../lib/constants.js";
import { fMoney } from "../lib/format.js";

/**
 * Composant d'export PDF. Ouvre une nouvelle fenêtre avec le dossier client
 * formaté pour l'impression. Le CGP fait Ctrl+P → PDF.
 */
export function generatePDFReport(nodes, edges, clientName = "Client", cabinetName = "") {
  const kpi = computeKPI(nodes, edges);
  const proj = projectPatrimoine(nodes, edges, 15);

  // Organigramme textuel
  const holdings = nodes.filter(n => n.type === "holding");
  const societes = nodes.filter(n => n.type === "societe");
  const scis = nodes.filter(n => n.type === "sci");
  const placements = nodes.filter(n => n.type === "placement");
  const foyers = nodes.filter(n => n.type === "foyer");

  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Dossier patrimonial - ${clientName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Syne:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Syne", sans-serif; color: #2a2925; background: #fff; padding: 40px; font-size: 11px; line-height: 1.5; }
  h1 { font-family: "Instrument Serif", serif; font-size: 28px; color: #1a1a1a; margin-bottom: 4px; }
  h2 { font-family: "Instrument Serif", serif; font-size: 18px; color: #1a1a1a; margin: 28px 0 12px; border-bottom: 2px solid #b8963e; padding-bottom: 4px; }
  h3 { font-size: 13px; font-weight: 700; margin: 16px 0 8px; color: #2a2925; }
  .subtitle { color: #8a8880; font-size: 12px; margin-bottom: 24px; }
  .gold { color: #b8963e; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .kpi { background: #FAF8F4; border: 1px solid #e8e4dd; border-radius: 8px; padding: 12px; }
  .kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8880; font-weight: 600; }
  .kpi-value { font-size: 18px; font-weight: 700; margin-top: 2px; }
  .kpi-sub { font-size: 9px; color: #8a8880; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #8a8880; font-weight: 600; padding: 6px 8px; border-bottom: 2px solid #e8e4dd; }
  td { padding: 5px 8px; border-bottom: 1px solid #e8e4dd; font-size: 10.5px; }
  .text-right { text-align: right; }
  .bold { font-weight: 700; }
  .green { color: #0d7c5f; }
  .red { color: #b83d2a; }
  .gold-text { color: #b8963e; }
  .entity-card { background: #FAF8F4; border: 1px solid #e8e4dd; border-radius: 8px; padding: 12px; margin: 8px 0; }
  .entity-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .entity-icon { font-size: 12px; }
  .entity-name { font-weight: 700; font-size: 12px; }
  .entity-forme { font-family: "Space Mono", monospace; font-size: 9px; background: #e8e4dd; padding: 2px 6px; border-radius: 4px; }
  .entity-detail { color: #8a8880; font-size: 10px; }
  .entity-metrics { display: flex; gap: 16px; margin-top: 6px; font-size: 10px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e8e4dd; color: #8a8880; font-size: 9px; display: flex; justify-content: space-between; }
  .page-break { page-break-before: always; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

<div class="no-print" style="background:#b8963e;color:white;padding:12px 20px;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
  <span style="font-weight:600">Dossier prêt. Cliquez sur Imprimer pour générer le PDF.</span>
  <button onclick="window.print()" style="background:white;color:#b8963e;border:none;padding:8px 20px;border-radius:6px;font-weight:700;cursor:pointer;font-family:Syne">Imprimer / PDF</button>
</div>

<h1>Dossier patrimonial <span class="gold">${clientName}</span></h1>
<p class="subtitle">${cabinetName ? `Préparé par ${cabinetName} · ` : ""}Simulation générée le ${date} par HoldingVision Pro</p>

<h2>Synthèse</h2>
<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-label">CA total</div>
    <div class="kpi-value green">${fMoney(kpi.caTotal)} €</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Trésorerie holding</div>
    <div class="kpi-value gold-text">${fMoney(kpi.tresoHolding)} €</div>
    <div class="kpi-sub">Après IS et distributions</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Revenu net foyer</div>
    <div class="kpi-value">${fMoney(kpi.revFoyer)} €/an</div>
    <div class="kpi-sub">Marge: ${fMoney(kpi.margeMensuelle)} €/mois</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">IS total</div>
    <div class="kpi-value red">${fMoney(kpi.isTotal)} €</div>
    <div class="kpi-sub">Taux effectif: ${kpi.tauxEffectif}%</div>
  </div>
</div>
<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-label">Charges sociales</div>
    <div class="kpi-value">${fMoney(kpi.chargesTotal)} €</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Flat tax dividendes</div>
    <div class="kpi-value red">${fMoney(kpi.flatTaxFoyer)} €</div>
    <div class="kpi-sub">Sur ${fMoney(kpi.divVersesFoyer)} € versés</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Patrimoine placements</div>
    <div class="kpi-value green">${fMoney(kpi.patrimoinePlacements)} €</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Patrimoine immobilier</div>
    <div class="kpi-value">${fMoney(kpi.patrimoineImmo)} €</div>
  </div>
</div>
${kpi.ifi?.isAssujetti ? `
<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-label">IFI estimé</div>
    <div class="kpi-value red">${fMoney(kpi.ifi.ifi)} €/an</div>
    <div class="kpi-sub">Patrimoine net: ${fMoney(kpi.ifi.patrimoineNet)} €</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Patrimoine total</div>
    <div class="kpi-value gold-text">${fMoney(kpi.patrimoineTotal)} €</div>
    <div class="kpi-sub">Tréso + placements + immo + AV</div>
  </div>
  ${kpi.triImmo.length > 0 ? kpi.triImmo.map(t => `
  <div class="kpi">
    <div class="kpi-label">TRI ${t.label}</div>
    <div class="kpi-value green">${t.tri}%</div>
    <div class="kpi-sub">Sur 15 ans</div>
  </div>`).join("") : ""}
</div>` : `
<div class="kpi-grid">
  <div class="kpi">
    <div class="kpi-label">Patrimoine total</div>
    <div class="kpi-value gold-text">${fMoney(kpi.patrimoineTotal)} €</div>
    <div class="kpi-sub">Tréso + placements + immo + AV</div>
  </div>
  ${kpi.triImmo.length > 0 ? kpi.triImmo.map(t => `
  <div class="kpi">
    <div class="kpi-label">TRI ${t.label}</div>
    <div class="kpi-value green">${t.tri}%</div>
    <div class="kpi-sub">Sur 15 ans</div>
  </div>`).join("") : ""}
</div>`}

<h2>Structure du groupe</h2>
${holdings.map(h => {
  const c = kpi.nc[h.id];
  const assoc = h.data?.associes?.map(a => `${a.n} (${a.p}%)`).join(", ") || "";
  return `<div class="entity-card">
    <div class="entity-header">
      <span class="entity-icon" style="color:#a08430">◈</span>
      <span class="entity-name">${h.l}</span>
      <span class="entity-forme">${h.data?.forme || "SAS"}</span>
    </div>
    <div class="entity-detail">Associés: ${assoc}</div>
    <div class="entity-detail">${c?.detail || ""}</div>
    <div class="entity-metrics">
      <span>Dividendes reçus: <b>${fMoney(c?.inc || 0)}€</b></span>
      <span>Exonérés (95%): <b class="green">${fMoney(c?.exo || 0)}€</b></span>
      <span>IS: <b class="red">${fMoney(c?.is || 0)}€</b></span>
      <span>Trésorerie: <b class="gold-text">${fMoney(c?.rNet || 0)}€</b></span>
    </div>
  </div>`;
}).join("")}

${societes.map(s => {
  const c = kpi.nc[s.id];
  const assoc = s.data?.associes?.map(a => `${a.n} (${a.p}%)`).join(", ") || "";
  return `<div class="entity-card">
    <div class="entity-header">
      <span class="entity-icon" style="color:#0d7c5f">◆</span>
      <span class="entity-name">${s.l}</span>
      <span class="entity-forme">${s.data?.forme || "SASU"}</span>
    </div>
    <div class="entity-detail">Associés: ${assoc}</div>
    <div class="entity-detail">${c?.detail || ""}</div>
    <div class="entity-metrics">
      <span>CA: <b>${fMoney(c?.ca || 0)}€</b></span>
      <span>IS: <b class="red">${fMoney(c?.is || 0)}€</b></span>
      <span>Net: <b class="green">${fMoney(c?.rNet || 0)}€</b></span>
      <span>Dividendes: <b>${fMoney(c?.dist || 0)}€</b></span>
    </div>
  </div>`;
}).join("")}

${scis.map(s => {
  const c = kpi.nc[s.id];
  return `<div class="entity-card">
    <div class="entity-header">
      <span class="entity-icon" style="color:#6b4fa0">⬡</span>
      <span class="entity-name">${s.l}</span>
      <span class="entity-forme">${s.data?.forme || "SCI-IS"}</span>
    </div>
    <div class="entity-detail">${c?.detail || ""}</div>
    <div class="entity-metrics">
      <span>Loyers: <b>${fMoney((c?.totalLoyers || 0) + (c?.inc || 0))}€/an</b></span>
      <span>IS: <b class="red">${fMoney(c?.is || 0)}€</b></span>
      <span>Net: <b class="green">${fMoney(c?.rNet || 0)}€</b></span>
    </div>
  </div>`;
}).join("")}

<h2 class="page-break">Projection patrimoniale sur 15 ans</h2>
<table>
  <thead>
    <tr>
      <th>Année</th>
      <th class="text-right">Tréso holding</th>
      <th class="text-right">Placements</th>
      <th class="text-right">Gains placements</th>
      <th class="text-right">Immobilier</th>
      <th class="text-right">Patrimoine net</th>
    </tr>
  </thead>
  <tbody>
    ${proj.map(p => `<tr>
      <td class="bold">An ${p.year}</td>
      <td class="text-right gold-text">${fMoney(p.tresoHolding)} €</td>
      <td class="text-right green">${fMoney(p.totalPlacements)} €</td>
      <td class="text-right green">+${fMoney(p.gainsPlacements)} €</td>
      <td class="text-right">${fMoney(p.sciValeur)} €</td>
      <td class="text-right bold">${fMoney(p.patrimoineNet)} €</td>
    </tr>`).join("")}
  </tbody>
</table>

${placements.length > 0 ? `
<h2>Détail des placements</h2>
${placements.map(p => {
  const c = kpi.nc[p.id];
  if (!c?.lastP) return "";
  return `<div class="entity-card">
    <div class="entity-header">
      <span class="entity-icon" style="color:#2a7d3f">◎</span>
      <span class="entity-name">${p.l}</span>
    </div>
    <div class="entity-detail">${c.detail}</div>
    <div class="entity-metrics">
      <span>Capital final: <b class="green">${fMoney(c.lastP.capital)}€</b></span>
      <span>Total versé: <b>${fMoney(c.lastP.totalVerse)}€</b></span>
      <span>Gains nets: <b class="green">+${fMoney(c.lastP.gainNet)}€</b></span>
      <span>Fiscalité: <b class="red">${c.lastP.fiscLabel}</b></span>
    </div>
  </div>`;
}).join("")}` : ""}

${foyers.length > 0 ? `
<h2>Bilan foyer fiscal</h2>
${foyers.map(f => {
  const c = kpi.nc[f.id];
  return `<div class="entity-card">
    <div class="entity-header">
      <span class="entity-icon" style="color:#2d6ab8">⌂</span>
      <span class="entity-name">${f.l}</span>
    </div>
    <div class="entity-metrics">
      <span>Revenus annuels: <b>${fMoney(c?.inc || 0)}€</b></span>
      <span>Charges mensuelles: <b class="red">${fMoney(c?.chM || 0)}€/m</b></span>
      <span>Marge mensuelle: <b class="${(c?.margeM || 0) >= 0 ? 'green' : 'red'}">${fMoney(c?.margeM || 0)}€/m</b></span>
    </div>
  </div>`;
}).join("")}` : ""}

<div class="page-break"></div>
<h2>Recommandations & Alertes</h2>
<div id="alerts-section"></div>

<div class="footer">
  <span>Document généré par HoldingVision Pro — Simulation, non contractuel</span>
  <span>${date}</span>
</div>

<script>
// Generate alerts client-side
const alertsHtml = ${JSON.stringify(generateAlertsHTML(nodes, edges, kpi))};
document.getElementById("alerts-section").innerHTML = alertsHtml;
</script>

</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

// Generate alerts HTML for PDF
function generateAlertsHTML(nodes, edges, kpi) {
  // Inline simplified alert logic for PDF (no import needed)
  const alerts = [];
  const societes = nodes.filter(n => n.type === "societe");
  const holdings = nodes.filter(n => n.type === "holding");
  const placements = nodes.filter(n => n.type === "placement");
  const contratsAV = nodes.filter(n => n.type === "contrat_av");
  const personnes = nodes.filter(n => n.type === "personne");

  if (societes.length >= 2 && holdings.length === 0) {
    alerts.push({ sev: "opportunity", title: "Holding recommandée", detail: `${societes.length} sociétés sans holding. Le régime mère-fille (art. 145/216 CGI) permettrait d'exonérer 95% des dividendes remontés.` });
  }
  if (kpi.margeMensuelle < 0) {
    alerts.push({ sev: "critical", title: "Marge mensuelle négative", detail: `Le foyer dépense plus qu'il ne gagne: ${fMoney(kpi.margeMensuelle)}€/mois.` });
  }
  if (kpi.margeMensuelle >= 0 && kpi.margeMensuelle < 500) {
    alerts.push({ sev: "warning", title: "Marge mensuelle faible", detail: `Seulement ${fMoney(kpi.margeMensuelle)}€/mois de marge.` });
  }
  if (placements.length === 0 && contratsAV.length === 0) {
    alerts.push({ sev: "warning", title: "Aucun placement configuré", detail: "Recommandation: constituer une épargne de précaution et investir le surplus." });
  }
  personnes.forEach(p => {
    const c = kpi.nc[p.id];
    if (c && c.tmi >= 30 && !placements.some(pl => pl.data?.typePlacement === "per")) {
      alerts.push({ sev: "opportunity", title: `${p.data?.prenom || p.l}: PER recommandé (TMI ${c.tmi}%)`, detail: "Un PER permettrait de déduire jusqu'à 10% des revenus du revenu imposable." });
    }
  });

  const sevColors = { critical: "#b83d2a", warning: "#c08020", opportunity: "#0d7c5f", info: "#4080c0" };
  const sevLabels = { critical: "CRITIQUE", warning: "ATTENTION", opportunity: "OPPORTUNITÉ", info: "INFO" };

  if (alerts.length === 0) return '<p style="color:#0d7c5f;font-weight:600">☀️ Aucune alerte. La structure est optimisée.</p>';

  return alerts.map(a => `
    <div style="margin:8px 0;padding:10px;border-left:3px solid ${sevColors[a.sev]};background:#FAF8F4;border-radius:4px">
      <div style="font-size:8px;font-weight:700;color:${sevColors[a.sev]};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px">${sevLabels[a.sev]}</div>
      <div style="font-size:11px;font-weight:700;margin-bottom:2px">${a.title}</div>
      <div style="font-size:10px;color:#8a8880">${a.detail}</div>
    </div>
  `).join("");
}
