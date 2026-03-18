import { useState } from "react";
import useCanvasStore from "../store/canvasStore.js";
import { uid } from "../lib/format.js";

const STEPS = [
  { id: "situation", title: "Situation personnelle", icon: "☻" },
  { id: "revenus", title: "Revenus", icon: "◆" },
  { id: "charges", title: "Charges du foyer", icon: "⌂" },
  { id: "patrimoine", title: "Patrimoine existant", icon: "◎" },
  { id: "resume", title: "Résumé & Génération", icon: "✓" },
];

export default function ClientWizard({ onClose, onGenerate }) {
  const store = useCanvasStore();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    // Step 1: Situation
    couple: false,
    prenom1: "",
    prenom2: "",
    nbEnfants: 0,
    // Step 2: Revenus
    type1: "salarie", // salarie | independant
    employeur1: "",
    salaire1: 0,
    statut1: "cadre",
    societe1: "",
    forme1: "SASU",
    ca1: 0,
    type2: "salarie",
    employeur2: "",
    salaire2: 0,
    statut2: "cadre",
    societe2: "",
    forme2: "SASU",
    ca2: 0,
    // Step 3: Charges
    loyer: 0,
    credit: 0,
    voiture: 0,
    energie: 0,
    mutuelle: 0,
    divers: 0,
    // Step 4: Patrimoine
    hasAV: false, avMontant: 0,
    hasPER: false, perMontant: 0,
    hasPEA: false, peaMontant: 0,
    hasImmo: false, immoValeur: 0, immoLoyer: 0,
    hasEmprunt: false, empruntCapital: 0, empruntTaux: 3.5, empruntDuree: 20,
  });

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));
  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  // ═══ GENERATE CANVAS ═══
  const generateCanvas = () => {
    const nodes = [];
    const edges = [];
    let y = 80;

    const addNode = (type, label, x, yPos, nodeData) => {
      const id = uid();
      nodes.push({ id, type, l: label, x, y: yPos, w: 200, h: 64, data: nodeData });
      return id;
    };
    const addEdge = (from, to, flow, fixe) => {
      const id = uid();
      edges.push({ id, from, to, flow, ...(fixe != null ? { montantFixe: fixe } : {}) });
    };

    // Foyer fiscal
    const parts = 1 + (data.couple ? 1 : 0) + Math.min(data.nbEnfants, 2) * 0.5 + Math.max(0, data.nbEnfants - 2) * 1;
    const foyerId = addNode("foyer", "Foyer fiscal", 400, 300, {
      loyer: data.loyer, voiture: data.voiture, energie: data.energie,
      mutuelle: data.mutuelle, credit: data.credit, divers: data.divers,
    });

    // Fisc
    const fiscId = addNode("fisc", "État / Fisc", 700, 100, {});

    // Personne 1
    if (data.type1 === "salarie" && data.salaire1 > 0) {
      const empId = addNode("employeur", data.employeur1 || "Employeur", 50, 80, {
        salaireBrut: data.salaire1, statut: data.statut1,
      });
      const persId = addNode("personne", data.prenom1 || "Personne 1", 50, 220, {
        prenom: data.prenom1, statut: data.statut1, partsFiscales: parts,
      });
      addEdge(empId, persId, "salaire");
      addEdge(persId, foyerId, "salaire");
      addEdge(persId, fiscId, "is");
    } else if (data.type1 === "independant" && data.ca1 > 0) {
      const socId = addNode("societe", data.societe1 || "Société", 50, 80, {
        forme: data.forme1, ca: data.ca1, tauxCharges: 10, tauxDistrib: 100, remuneration: 0,
      });
      addEdge(socId, foyerId, "dividendes");
      addEdge(socId, fiscId, "is");
    }

    // Personne 2 (si couple)
    if (data.couple) {
      if (data.type2 === "salarie" && data.salaire2 > 0) {
        const empId2 = addNode("employeur", data.employeur2 || "Employeur 2", 250, 80, {
          salaireBrut: data.salaire2, statut: data.statut2,
        });
        const persId2 = addNode("personne", data.prenom2 || "Personne 2", 250, 220, {
          prenom: data.prenom2, statut: data.statut2, partsFiscales: parts,
        });
        addEdge(empId2, persId2, "salaire");
        addEdge(persId2, foyerId, "salaire");
      } else if (data.type2 === "independant" && data.ca2 > 0) {
        const socId2 = addNode("societe", data.societe2 || "Société 2", 250, 80, {
          forme: data.forme2, ca: data.ca2, tauxCharges: 10, tauxDistrib: 100, remuneration: 0,
        });
        addEdge(socId2, foyerId, "dividendes");
        addEdge(socId2, fiscId, "is");
      }
    }

    // Patrimoine
    let patriY = 420;
    if (data.hasAV && data.avMontant > 0) {
      const avId = addNode("contrat_av", "Assurance-vie", 50, patriY, { capitalInitial: data.avMontant, rendementFE: 2.5, rendementUC: 6, partUC: 50 });
      patriY += 100;
    }
    if (data.hasPER && data.perMontant > 0) {
      const perId = addNode("placement", "PER", 250, patriY, { typePlacement: "per", capital: data.perMontant, rendement: 4, duree: 20 });
      patriY += 100;
    }
    if (data.hasPEA && data.peaMontant > 0) {
      const peaId = addNode("placement", "PEA", 450, patriY, { typePlacement: "pea", capital: data.peaMontant, rendement: 7, duree: 10 });
    }
    if (data.hasImmo && data.immoValeur > 0) {
      const sciId = addNode("sci", "SCI Immobilière", 650, 420, {
        forme: "SCI-IS", bienValeur: data.immoValeur, loyersMensuels: data.immoLoyer,
      });
      addEdge(sciId, foyerId, "loyer");
      addEdge(sciId, fiscId, "is");

      if (data.hasEmprunt && data.empruntCapital > 0) {
        const empId = addNode("emprunt", "Emprunt immobilier", 650, 560, {
          capitalEmprunte: data.empruntCapital, tauxInteret: data.empruntTaux, dureeAns: data.empruntDuree,
        });
      }
    }

    // Apply to store
    store.setNodes(nodes);
    store.setEdges(edges);
    onClose();
  };

  // ═══ STYLES ═══
  const inputStyle = "input-dark";
  const labelStyle = { fontSize: 11, fontWeight: 600, color: "var(--tx-secondary)", marginBottom: 4, marginTop: 12, display: "block" };
  const toggleStyle = (active) => ({
    padding: "8px 16px", borderRadius: 10, border: "1px solid " + (active ? "var(--copper)" : "var(--border)"),
    background: active ? "rgba(200,150,80,0.15)" : "var(--bg-elevated)",
    color: active ? "var(--copper)" : "var(--tx-secondary)",
    cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    }}>
      <div style={{
        width: 520, maxHeight: "85vh", background: "var(--bg-card)", borderRadius: 24,
        border: "1px solid var(--border-hover)", boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 24px", borderBottom: "1px solid var(--border)",
          background: "linear-gradient(180deg, rgba(200,150,80,0.08), transparent)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--tx-primary)", fontFamily: "Syne" }}>Nouveau client</div>
              <div style={{ fontSize: 10, color: "var(--tx-tertiary)", fontFamily: "Space Mono", marginTop: 2 }}>
                Étape {step + 1}/{STEPS.length} · {STEPS[step].title}
              </div>
            </div>
            <button onClick={onClose} style={{ color: "var(--tx-tertiary)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "4px 10px", fontSize: 12 }}>✕</button>
          </div>
          {/* Progress bar */}
          <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2, transition: "all 0.3s",
                background: i <= step ? "var(--copper)" : "var(--border)",
              }} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* STEP 1: Situation */}
          {step === 0 && <>
            <label style={labelStyle}>En couple ?</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={toggleStyle(!data.couple)} onClick={() => set("couple", false)}>Célibataire</button>
              <button style={toggleStyle(data.couple)} onClick={() => set("couple", true)}>En couple</button>
            </div>

            <label style={labelStyle}>Prénom</label>
            <input className={inputStyle} style={{ width: "100%" }} value={data.prenom1} onChange={e => set("prenom1", e.target.value)} placeholder="Ex: Marie" />

            {data.couple && <>
              <label style={labelStyle}>Prénom du conjoint</label>
              <input className={inputStyle} style={{ width: "100%" }} value={data.prenom2} onChange={e => set("prenom2", e.target.value)} placeholder="Ex: Pierre" />
            </>}

            <label style={labelStyle}>Nombre d'enfants</label>
            <input type="number" min={0} max={20} value={data.nbEnfants}
              onChange={e => set("nbEnfants", Math.max(0, parseInt(e.target.value) || 0))}
              style={{
                width: 80, padding: "8px 12px", borderRadius: 8, textAlign: "center",
                border: "1px solid var(--border)", background: "var(--bg-elevated)",
                color: "var(--tx-primary)", fontSize: 16, fontWeight: 700, fontFamily: "Syne",
                outline: "none",
              }} />
          </>}

          {/* STEP 2: Revenus */}
          {step === 1 && <>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 8 }}>{data.prenom1 || "Personne 1"}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button style={toggleStyle(data.type1 === "salarie")} onClick={() => set("type1", "salarie")}>Salarié(e)</button>
              <button style={toggleStyle(data.type1 === "independant")} onClick={() => set("type1", "independant")}>Indépendant(e)</button>
            </div>

            {data.type1 === "salarie" ? <>
              <label style={labelStyle}>Nom de l'entreprise</label>
              <input className={inputStyle} style={{ width: "100%" }} value={data.employeur1} onChange={e => set("employeur1", e.target.value)} placeholder="Ex: Airbus" />
              <label style={labelStyle}>Salaire brut annuel</label>
              <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.salaire1 || ""} onChange={e => set("salaire1", +e.target.value)} placeholder="50000" />
              <label style={labelStyle}>Statut</label>
              <select className={inputStyle} style={{ width: "100%" }} value={data.statut1} onChange={e => set("statut1", e.target.value)}>
                <option value="cadre">Cadre</option>
                <option value="non_cadre">Non-cadre</option>
                <option value="fonctionnaire">Fonctionnaire</option>
              </select>
            </> : <>
              <label style={labelStyle}>Nom de la société</label>
              <input className={inputStyle} style={{ width: "100%" }} value={data.societe1} onChange={e => set("societe1", e.target.value)} placeholder="Ex: Ma SASU" />
              <label style={labelStyle}>Forme juridique</label>
              <select className={inputStyle} style={{ width: "100%" }} value={data.forme1} onChange={e => set("forme1", e.target.value)}>
                <option value="SASU">SASU</option>
                <option value="SAS">SAS</option>
                <option value="EURL">EURL</option>
                <option value="SARL">SARL</option>
                <option value="Micro">Micro-entreprise</option>
              </select>
              <label style={labelStyle}>Chiffre d'affaires annuel</label>
              <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.ca1 || ""} onChange={e => set("ca1", +e.target.value)} placeholder="80000" />
            </>}

            {data.couple && <>
              <div style={{ width: "100%", height: 1, background: "var(--border)", margin: "20px 0" }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 8 }}>{data.prenom2 || "Personne 2"}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button style={toggleStyle(data.type2 === "salarie")} onClick={() => set("type2", "salarie")}>Salarié(e)</button>
                <button style={toggleStyle(data.type2 === "independant")} onClick={() => set("type2", "independant")}>Indépendant(e)</button>
              </div>

              {data.type2 === "salarie" ? <>
                <label style={labelStyle}>Nom de l'entreprise</label>
                <input className={inputStyle} style={{ width: "100%" }} value={data.employeur2} onChange={e => set("employeur2", e.target.value)} placeholder="Ex: Mairie" />
                <label style={labelStyle}>Salaire brut annuel</label>
                <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.salaire2 || ""} onChange={e => set("salaire2", +e.target.value)} placeholder="35000" />
                <label style={labelStyle}>Statut</label>
                <select className={inputStyle} style={{ width: "100%" }} value={data.statut2} onChange={e => set("statut2", e.target.value)}>
                  <option value="cadre">Cadre</option>
                  <option value="non_cadre">Non-cadre</option>
                  <option value="fonctionnaire">Fonctionnaire</option>
                </select>
              </> : <>
                <label style={labelStyle}>Nom de la société</label>
                <input className={inputStyle} style={{ width: "100%" }} value={data.societe2} onChange={e => set("societe2", e.target.value)} />
                <label style={labelStyle}>Forme juridique</label>
                <select className={inputStyle} style={{ width: "100%" }} value={data.forme2} onChange={e => set("forme2", e.target.value)}>
                  <option value="SASU">SASU</option><option value="SAS">SAS</option><option value="EURL">EURL</option><option value="SARL">SARL</option><option value="Micro">Micro</option>
                </select>
                <label style={labelStyle}>Chiffre d'affaires annuel</label>
                <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.ca2 || ""} onChange={e => set("ca2", +e.target.value)} />
              </>}
            </>}
          </>}

          {/* STEP 3: Charges */}
          {step === 2 && <>
            <label style={labelStyle}>Loyer / Crédit immobilier (mensuel)</label>
            <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.loyer || ""} onChange={e => set("loyer", +e.target.value)} placeholder="800" />
            <label style={labelStyle}>Voiture (mensuel)</label>
            <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.voiture || ""} onChange={e => set("voiture", +e.target.value)} placeholder="300" />
            <label style={labelStyle}>Énergie (mensuel)</label>
            <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.energie || ""} onChange={e => set("energie", +e.target.value)} placeholder="150" />
            <label style={labelStyle}>Mutuelle (mensuel)</label>
            <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.mutuelle || ""} onChange={e => set("mutuelle", +e.target.value)} placeholder="80" />
            <label style={labelStyle}>Divers (mensuel)</label>
            <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.divers || ""} onChange={e => set("divers", +e.target.value)} placeholder="500" />
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--tx-tertiary)", fontStyle: "italic" }}>
              Optionnel. Vous pouvez passer cette étape et remplir plus tard.
            </div>
          </>}

          {/* STEP 4: Patrimoine */}
          {step === 3 && <>
            {[
              { key: "hasAV", label: "Assurance-vie", amtKey: "avMontant", placeholder: "50000" },
              { key: "hasPER", label: "PER (Plan Épargne Retraite)", amtKey: "perMontant", placeholder: "20000" },
              { key: "hasPEA", label: "PEA", amtKey: "peaMontant", placeholder: "30000" },
            ].map(({ key, label, amtKey, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <button style={toggleStyle(data[key])} onClick={() => set(key, !data[key])}>{data[key] ? "✓" : "+"}</button>
                  <span style={{ fontSize: 12, color: "var(--tx-primary)", fontWeight: 600 }}>{label}</span>
                </div>
                {data[key] && (
                  <input className={inputStyle} type="number" style={{ width: "100%", marginTop: 4 }} value={data[amtKey] || ""} onChange={e => set(amtKey, +e.target.value)} placeholder={placeholder + " €"} />
                )}
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <button style={toggleStyle(data.hasImmo)} onClick={() => set("hasImmo", !data.hasImmo)}>{data.hasImmo ? "✓" : "+"}</button>
                <span style={{ fontSize: 12, color: "var(--tx-primary)", fontWeight: 600 }}>Bien immobilier locatif</span>
              </div>
              {data.hasImmo && <>
                <label style={labelStyle}>Valeur du bien</label>
                <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.immoValeur || ""} onChange={e => set("immoValeur", +e.target.value)} placeholder="200000" />
                <label style={labelStyle}>Loyer mensuel perçu</label>
                <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.immoLoyer || ""} onChange={e => set("immoLoyer", +e.target.value)} placeholder="800" />

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                  <button style={toggleStyle(data.hasEmprunt)} onClick={() => set("hasEmprunt", !data.hasEmprunt)}>{data.hasEmprunt ? "✓" : "+"}</button>
                  <span style={{ fontSize: 11, color: "var(--tx-secondary)" }}>Emprunt en cours</span>
                </div>
                {data.hasEmprunt && <>
                  <label style={labelStyle}>Capital emprunté</label>
                  <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.empruntCapital || ""} onChange={e => set("empruntCapital", +e.target.value)} />
                  <label style={labelStyle}>Taux (%)</label>
                  <input className={inputStyle} type="number" step="0.1" style={{ width: "100%" }} value={data.empruntTaux} onChange={e => set("empruntTaux", +e.target.value)} />
                  <label style={labelStyle}>Durée (années)</label>
                  <input className={inputStyle} type="number" style={{ width: "100%" }} value={data.empruntDuree} onChange={e => set("empruntDuree", +e.target.value)} />
                </>}
              </>}
            </div>
          </>}

          {/* STEP 5: Résumé */}
          {step === 4 && <>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx-primary)", marginBottom: 16 }}>Résumé du dossier client</div>
            <div style={{ background: "var(--bg-elevated)", borderRadius: 12, padding: 16, border: "1px solid var(--border)", fontSize: 12, lineHeight: 1.8, color: "var(--tx-secondary)" }}>
              <div><strong style={{ color: "var(--tx-primary)" }}>{data.prenom1 || "Client"}</strong> {data.couple ? `et ${data.prenom2 || "conjoint(e)"}` : "(célibataire)"} {data.nbEnfants > 0 ? `, ${data.nbEnfants} enfant${data.nbEnfants > 1 ? "s" : ""}` : ""}</div>

              <div style={{ marginTop: 8 }}>
                {data.type1 === "salarie" && data.salaire1 > 0 && <div>{data.prenom1} : salarié(e) {data.statut1} chez {data.employeur1 || "?"}, {data.salaire1.toLocaleString()}€ brut/an</div>}
                {data.type1 === "independant" && data.ca1 > 0 && <div>{data.prenom1} : {data.forme1}, CA {data.ca1.toLocaleString()}€/an</div>}
                {data.couple && data.type2 === "salarie" && data.salaire2 > 0 && <div>{data.prenom2} : salarié(e) {data.statut2} chez {data.employeur2 || "?"}, {data.salaire2.toLocaleString()}€ brut/an</div>}
                {data.couple && data.type2 === "independant" && data.ca2 > 0 && <div>{data.prenom2} : {data.forme2}, CA {data.ca2.toLocaleString()}€/an</div>}
              </div>

              {(data.loyer > 0 || data.voiture > 0) && <div style={{ marginTop: 8 }}>Charges mensuelles : {(data.loyer + data.voiture + data.energie + data.mutuelle + data.divers).toLocaleString()}€/mois</div>}

              {(data.hasAV || data.hasPER || data.hasPEA || data.hasImmo) && <>
                <div style={{ marginTop: 8, fontWeight: 600, color: "var(--tx-primary)" }}>Patrimoine :</div>
                {data.hasAV && <div>Assurance-vie : {data.avMontant.toLocaleString()}€</div>}
                {data.hasPER && <div>PER : {data.perMontant.toLocaleString()}€</div>}
                {data.hasPEA && <div>PEA : {data.peaMontant.toLocaleString()}€</div>}
                {data.hasImmo && <div>Immobilier : {data.immoValeur.toLocaleString()}€ (loyer {data.immoLoyer}€/m){data.hasEmprunt ? ` + emprunt ${data.empruntCapital.toLocaleString()}€` : ""}</div>}
              </>}
            </div>
          </>}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {step > 0 ? (
            <button onClick={prev} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--tx-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>← Retour</button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button onClick={next} style={{
              padding: "10px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, var(--copper), var(--copper-dim))",
              color: "#0e0d0a", fontWeight: 700, fontSize: 13, fontFamily: "Syne",
            }}>Suivant →</button>
          ) : (
            <button onClick={generateCanvas} style={{
              padding: "10px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #40c878, #30a060)",
              color: "#0a1a10", fontWeight: 700, fontSize: 13, fontFamily: "Syne",
            }}>Générer le canvas ✓</button>
          )}
        </div>
      </div>
    </div>
  );
}
