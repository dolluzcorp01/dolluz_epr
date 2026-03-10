const Toast = ({ msg }) => (
  <div className="pop" style={{
    position: "fixed", bottom: 24, right: 24, background: "#0D1B2A", color: "#fff",
    padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
    boxShadow: "0 8px 24px rgba(0,0,0,.25)", zIndex: 999, display: "flex", alignItems: "center", gap: 8
  }}>
    <span style={{ color: "#10B981" }}>&#10003;</span> {msg}
  </div>
);

export default Toast;
