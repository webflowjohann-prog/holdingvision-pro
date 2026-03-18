export default function ResultRow({ label, value, bold, positive, negative }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 11, color: "var(--tx-secondary)" }}>{label}</span>
      <span style={{
        fontSize: 11, fontFamily: "Space Mono",
        fontWeight: bold ? 700 : 500,
        color: positive ? "var(--c-societe)" : negative ? "var(--c-fisc)" : "var(--tx-primary)",
      }}>{value}</span>
    </div>
  );
}
