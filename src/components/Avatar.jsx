const Avatar = ({ name, size = 32 }) => {
  const cols = ["#E8520A", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4"];
  const bg = cols[name.charCodeAt(0) % cols.length];
  const ini = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0
    }}>
      {ini}
    </div>
  );
};

export default Avatar;
