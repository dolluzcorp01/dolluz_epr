const FieldRow = ({ label, children }) => (
  <div>
    <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</label>
    {children}
  </div>
);

export default FieldRow;
