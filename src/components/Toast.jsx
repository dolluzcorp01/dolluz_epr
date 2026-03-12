const Toast = ({ msg, type }) => {
  // Auto-detect error if no type given — check for common error prefixes
  const isError = type === "error" || (!type && /^(error|network error|failed|cannot|invalid)/i.test(msg));
  return (
    <div className="pop" style={{
      position: "fixed", bottom: 24, right: 24,
      background: isError ? "#FEF2F2" : "#0D1B2A",
      color: isError ? "#991B1B" : "#fff",
      border: isError ? "1.5px solid #FECACA" : "none",
      padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,.25)", zIndex: 999,
      display: "flex", alignItems: "center", gap: 8
    }}>
      <span style={{ color: isError ? "#EF4444" : "#10B981", fontSize: 15 }}>
        {isError ? "✕" : "✓"}
      </span>
      {msg}
    </div>
  );
};

export default Toast;
