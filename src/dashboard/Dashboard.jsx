import { useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { computeKPI, projectPatrimoine } from "../engine/projections.js";
import { ETYPES } from "../lib/constants.js";
import { fMoney } from "../lib/format.js";

function KPICard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span style={{ color }} className="text-sm">{icon}</span>}
        <span className="text-[10px] font-medium text-[var(--tx-secondary)] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ color: color || "var(--tx)" }}>{value}</div>
      {sub && <div className="text-[10px] text-[var(--tx-secondary)] mt-0.5">{sub}</div>}
    </div>
  );
}

const COLORS = ["#b8963e", "#0d7c5f", "#6b4fa0", "#2d6ab8", "#2a7d3f", "#b83d2a"];

export default function Dashboard({ nodes, edges, profile }) {
  const kpi = useMemo(() => computeKPI(nodes, edges), [nodes, edges]);
  const proj = useMemo(() => projectPatrimoine(nodes, edges, 15), [nodes, edges]);

  // Profile-specific titles
  const titles = {
    cgp: { h: "Bilan patrimonial", sub: "Vue consolidée de la structure et des flux" },
    avocat: { h: "Analyse juridique & fiscale", sub: "Impacts fiscaux, conditions légales, montants en jeu" },
    immo: { h: "Analyse immobilière", sub: "Rendements, cash-flow, effet de levier, projection patrimoine" },
  };
  const t = titles[profile] || titles.cgp;

  // Immo-specific KPIs
  const sciNodes = nodes.filter(n => n.type === "sci");
  const totalLoyers = sciNodes.reduce((s, n) => s + ((kpi.nc[n.id]?.totalLoyers || 0) + (kpi.nc[n.id]?.inc || 0)), 0);
  const totalBienValeur = sciNodes.reduce((s, n) => s + (n.data?.bienValeur || 0), 0);
  const rendementBrut = totalBienValeur > 0 ? ((totalLoyers / totalBienValeur) * 100).toFixed(1) : "0";
  const totalChargesImmo = sciNodes.reduce((s, n) => s + (n.data?.chargesAnnuelles || 0) + (n.data?.interetsEmprunt || 0), 0);
  const rendementNet = totalBienValeur > 0 ? (((totalLoyers - totalChargesImmo) / totalBienValeur) * 100).toFixed(1) : "0";
  const cashFlowMensuel = Math.round((totalLoyers - totalChargesImmo - sciNodes.reduce((s, n) => s + (kpi.nc[n.id]?.is || 0), 0)) / 12);

  // Avocat-specific: total économie fiscale vs détention directe
  const economieIS = Math.round(kpi.tresoHolding * 0.30 - kpi.isTotal); // approximation: flat tax directe vs montage

  // Répartition IS par entité
  const isRepartition = nodes
    .filter(n => ["societe", "holding", "sci"].includes(n.type) && kpi.nc[n.id]?.is > 0)
    .map(n => ({ name: n.l, value: kpi.nc[n.id].is, color: ETYPES.find(t => t.id === n.type)?.c }));

  // Flux sortants par type pour le foyer
  const fluxFoyer = edges
    .filter(e => nodes.find(n => n.id === e.to)?.type === "foyer" && (kpi.fv[e.id] || 0) > 0)
    .map(e => ({
      name: `${nodes.find(n => n.id === e.from)?.l} (${e.flow})`,
      value: kpi.fv[e.id],
    }));

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-base)]">
      <div className="max-w-[1100px] mx-auto">
        <h2 className="font-heading text-2xl mb-1" style={{ color: "var(--tx-primary)" }}>{t.h}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--tx-tertiary)" }}>{t.sub}</p>

        {/* KPI Cards - common */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KPICard label="CA total" value={`${fMoney(kpi.caTotal)} €`} icon="◆" color="var(--c-societe)" />
          <KPICard label="Trésorerie holding" value={`${fMoney(kpi.tresoHolding)} €`} sub="Après IS et distributions" icon="◈" color="var(--c-holding)" />
          <KPICard label="Revenu net foyer" value={`${fMoney(kpi.revFoyer)} €/an`} sub={`Marge: ${fMoney(kpi.margeMensuelle)} €/mois`} icon="⌂" color="var(--c-foyer)" />
          <KPICard label="IS total payé" value={`${fMoney(kpi.isTotal)} €`} sub={`Taux effectif: ${kpi.tauxEffectif}%`} icon="▣" color="var(--c-fisc)" />
        </div>

        {/* Profile-specific KPIs */}
        {profile === "immo" && sciNodes.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KPICard label="Loyers bruts / an" value={`${fMoney(totalLoyers)} €`} sub={`${sciNodes.length} bien${sciNodes.length > 1 ? "s" : ""}`} icon="⬡" color="var(--c-sci)" />
            <KPICard label="Rendement brut" value={`${rendementBrut} %`} sub={`Sur ${fMoney(totalBienValeur)} € de biens`} icon="⬡" color="var(--c-sci)" />
            <KPICard label="Rendement net" value={`${rendementNet} %`} sub="Après charges et intérêts" icon="⬡" color={parseFloat(rendementNet) > 3 ? "var(--c-placement)" : "var(--c-fisc)"} />
            <KPICard label="Cash-flow mensuel" value={`${fMoney(cashFlowMensuel)} €/m`} sub="Après charges, intérêts et IS" icon="⬡" color={cashFlowMensuel >= 0 ? "var(--c-placement)" : "var(--c-fisc)"} />
          </div>
        )}

        {profile === "avocat" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KPICard label="Charges sociales" value={`${fMoney(kpi.chargesTotal)} €`} sub="Cotisations annuelles" icon="⚖" color="var(--c-fisc)" />
            <KPICard label="Flat tax foyer" value={`${fMoney(kpi.flatTaxFoyer)} €`} sub={`Sur ${fMoney(kpi.divVersesFoyer)} € de dividendes`} icon="⚖" color="var(--c-fisc)" />
            <KPICard label="Économie vs direct" value={`~${fMoney(Math.max(0, economieIS))} €`} sub="Montage vs flat tax directe" icon="⚖" color="var(--c-placement)" />
            <KPICard label="Patrimoine total" value={`${fMoney(kpi.patrimoineTotal)} €`} sub="Holding + placements + immo" icon="⚖" color="var(--c-holding)" />
          </div>
        )}

        {profile === "cgp" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KPICard label="Charges sociales" value={`${fMoney(kpi.chargesTotal)} €`} sub="Cotisations annuelles" />
            <KPICard label="Flat tax dividendes" value={`${fMoney(kpi.flatTaxFoyer)} €`} sub={`Sur ${fMoney(kpi.divVersesFoyer)} € versés`} color="var(--c-fisc)" />
            <KPICard label="Patrimoine placements" value={`${fMoney(kpi.patrimoinePlacements)} €`} sub="Capital final projeté" icon="◎" color="var(--c-placement)" />
            <KPICard label="Patrimoine immobilier" value={`${fMoney(kpi.patrimoineImmo)} €`} sub="Valeur des biens SCI" icon="⬡" color="var(--c-sci)" />
          </div>
        )}

        {/* Projection patrimoniale */}
        <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border)] mb-6">
          <h3 className="font-heading text-lg mb-1">Projection patrimoniale sur 15 ans</h3>
          <p className="text-[11px] text-[var(--tx-secondary)] mb-4">Évolution du patrimoine net (holding + placements + immobilier)</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={proj} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--brd)" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "var(--tx2)" }} label={{ value: "Années", position: "insideBottom", offset: -2, fontSize: 10, fill: "var(--tx2)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--tx2)" }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => [`${fMoney(v)} €`]} labelFormatter={l => `Année ${l}`}
                contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid var(--brd)" }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="tresoHolding" name="Trésorerie holding" stackId="1" fill="#d4b062" fillOpacity={0.3} stroke="#b8963e" strokeWidth={1.5} />
              <Area type="monotone" dataKey="totalPlacements" name="Placements" stackId="1" fill="#2a7d3f" fillOpacity={0.3} stroke="#2a7d3f" strokeWidth={1.5} />
              <Area type="monotone" dataKey="sciValeur" name="Immobilier" stackId="1" fill="#6b4fa0" fillOpacity={0.2} stroke="#6b4fa0" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
          {proj.length > 0 && (
            <div className="mt-3 flex gap-6 text-xs text-[var(--tx-secondary)]">
              <span>An 5: <b className="text-[var(--tx-primary)]">{fMoney(proj[4]?.patrimoineNet || 0)} €</b></span>
              <span>An 10: <b className="text-[var(--tx-primary)]">{fMoney(proj[9]?.patrimoineNet || 0)} €</b></span>
              <span>An 15: <b className="text-[var(--tx-primary)]">{fMoney(proj[14]?.patrimoineNet || 0)} €</b></span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Répartition IS */}
          {isRepartition.length > 0 && (
            <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border)]">
              <h3 className="font-heading text-lg mb-4">Répartition IS par entité</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={isRepartition} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${fMoney(value)}€`}
                    labelLine={{ strokeWidth: 0.5 }} style={{ fontSize: 9 }}>
                    {isRepartition.map((entry, i) => (
                      <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} fillOpacity={0.7} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${fMoney(v)} €`, "IS"]} contentStyle={{ fontSize: 11, borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Revenus du foyer */}
          {fluxFoyer.length > 0 && (
            <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border)]">
              <h3 className="font-heading text-lg mb-4">Sources de revenus du foyer</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={fluxFoyer} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--brd)" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "var(--tx2)" }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "var(--tx2)" }} width={140} />
                  <Tooltip formatter={(v) => [`${fMoney(v)} €`]} contentStyle={{ fontSize: 11, borderRadius: 10 }} />
                  <Bar dataKey="value" fill="#2d6ab8" fillOpacity={0.6} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Détail par entité */}
        <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border)] mb-6">
          <h3 className="font-heading text-lg mb-4">Détail par entité</h3>
          <div className="space-y-3">
            {nodes.filter(n => ["societe", "holding", "sci", "placement"].includes(n.type)).map(n => {
              const comp = kpi.nc[n.id];
              if (!comp) return null;
              const et = ETYPES.find(t => t.id === n.type);
              return (
                <div key={n.id} className="p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: et?.c }}>{et?.icon}</span>
                    <span className="font-semibold text-sm">{n.l}</span>
                    {n.data?.forme && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cream-200 font-mono">{n.data.forme}</span>}
                  </div>
                  <div className="text-[11px] text-[var(--tx-secondary)] mb-1.5">{comp.detail}</div>
                  <div className="flex flex-wrap gap-4 text-[11px]">
                    {comp.ca != null && <span>CA: <b>{fMoney(comp.ca)}€</b></span>}
                    {comp.is != null && comp.is > 0 && <span>IS: <b className="text-[var(--c-fisc)]">{fMoney(comp.is)}€</b></span>}
                    {comp.rNet != null && <span>Net: <b className="text-[var(--c-societe)]">{fMoney(comp.rNet)}€</b></span>}
                    {comp.dist != null && comp.dist > 0 && <span>Distrib: <b>{fMoney(comp.dist)}€</b></span>}
                    {comp.lastP && <span>Capital an {comp.duree}: <b className="text-[var(--c-placement)]">{fMoney(comp.lastP.capital)}€</b></span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projection table */}
        <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border)] mb-6">
          <h3 className="font-heading text-lg mb-4">Tableau de projection annuelle</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 pr-3 text-[var(--tx-secondary)] font-semibold">Année</th>
                  <th className="text-right py-2 px-2 text-[var(--tx-secondary)] font-semibold">Tréso holding</th>
                  <th className="text-right py-2 px-2 text-[var(--tx-secondary)] font-semibold">Placements</th>
                  <th className="text-right py-2 px-2 text-[var(--tx-secondary)] font-semibold">Gains placements</th>
                  <th className="text-right py-2 px-2 text-[var(--tx-secondary)] font-semibold">Patrimoine net</th>
                </tr>
              </thead>
              <tbody>
                {proj.map(p => (
                  <tr key={p.year} className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)]">
                    <td className="py-1.5 pr-3 font-medium">An {p.year}</td>
                    <td className="py-1.5 px-2 text-right text-[var(--c-holding)]">{fMoney(p.tresoHolding)} €</td>
                    <td className="py-1.5 px-2 text-right text-[var(--c-placement)]">{fMoney(p.totalPlacements)} €</td>
                    <td className="py-1.5 px-2 text-right text-[var(--c-societe)]">+{fMoney(p.gainsPlacements)} €</td>
                    <td className="py-1.5 px-2 text-right font-bold">{fMoney(p.patrimoineNet)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
