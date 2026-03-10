export const STATUS_CFG = {
  Approved: { bg: "#D1FAE5", tc: "#065F46", dot: "#10B981" },
  Submitted: { bg: "#DBEAFE", tc: "#1E40AF", dot: "#3B82F6" },
  "In Progress": { bg: "#FEF3C7", tc: "#92400E", dot: "#F59E0B" },
  "Email Sent": { bg: "#E0E7FF", tc: "#3730A3", dot: "#6366F1" },
  Pending: { bg: "#F1F5F9", tc: "#475569", dot: "#94A3B8" },
  Overdue: { bg: "#FEE2E2", tc: "#991B1B", dot: "#EF4444" },
  active: { bg: "#D1FAE5", tc: "#065F46", dot: "#10B981" },
  Active: { bg: "#D1FAE5", tc: "#065F46", dot: "#10B981" },
  onboarding: { bg: "#FEF3C7", tc: "#92400E", dot: "#F59E0B" },
  Scheduled: { bg: "#F1F5F9", tc: "#475569", dot: "#94A3B8" },
  inactive: { bg: "#F1F5F9", tc: "#475569", dot: "#94A3B8" },
  Closed: { bg: "#F1F5F9", tc: "#475569", dot: "#94A3B8" },
  Draft: { bg: "#F1F5F9", tc: "#64748B", dot: "#CBD5E1" },
  Locked: { bg: "#EDE9FE", tc: "#5B21B6", dot: "#8B5CF6" },
};

const Badge = ({ status }) => {
  const c = STATUS_CFG[status] || STATUS_CFG.inactive;
  return (
    <span className="badge" style={{ background: c.bg, color: c.tc }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {status}
    </span>
  );
};

export default Badge;
