const KpiCard = ({ label, value, sub, icon, color, delay = 0, onClick }) => (
  <div className="kpi-card" onClick={onClick} style={{ animationDelay: `${delay}ms`, flex: 1, cursor: onClick ? "pointer" : "default", transition: "transform .15s, box-shadow .15s" }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.10)"; } }}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = ""; } }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{label}</div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 800, color: "#0D1B2A", lineHeight: 1, letterSpacing: -1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>{sub}</div>
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
    </div>
    {onClick && <div style={{ marginTop: 12, fontSize: 11, color: color, fontWeight: 700, letterSpacing: 0.5 }}>View details →</div>}
  </div>
);

export default KpiCard;
