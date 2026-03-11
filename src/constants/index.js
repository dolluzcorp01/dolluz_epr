// ─── Utility functions & UI config only — NO hardcoded business data ──────────

// Client color fallback palette (used only when API color_hex is missing)
export const CLIENT_COLORS = { CL001: "#E8520A", CL002: "#3B82F6", CL003: "#10B981", CL004: "#8B5CF6" };

// ─── Allocation helpers ───────────────────────────────────────────────────────
export const totalPct = (e) => (e.allocations || []).reduce((s, a) => s + Number(a.pct || 0), 0);
export const gapPct   = (e) => 100 - totalPct(e);

// ─── Random short ID generator ────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 8);

// ─── Quarter definitions (used by New Cycle modal to auto-fill dates) ─────────
export const QUARTER_DEF = {
  1: { label: "Q1 (Jan–Mar)", start: "01-01", end: "03-31", months: "Jan–Mar" },
  2: { label: "Q2 (Apr–Jun)", start: "04-01", end: "06-30", months: "Apr–Jun" },
  3: { label: "Q3 (Jul–Sep)", start: "07-01", end: "09-30", months: "Jul–Sep" },
  4: { label: "Q4 (Oct–Dec)", start: "10-01", end: "12-31", months: "Oct–Dec" },
};

// ─── Navigation items (UI config, not business data) ─────────────────────────
export const NAV_ITEMS = [
  { id: "dashboard",  icon: "⌂",  label: "Dashboard" },
  { id: "clients",    icon: "🏛",  label: "Client Configuration" },
  { id: "employees",  icon: "👤",  label: "Employee Database" },
  { id: "resources",  icon: "👥",  label: "Allocation & Leakage" },
  { id: "scheduler",  icon: "📅",  label: "Cycle Scheduler" },
  { id: "reviews",    icon: "📋",  label: "Review Management" },
  { id: "scoring",    icon: "📊",  label: "Scoring & Hikes" },
  { id: "email",      icon: "📧",  label: "Email" },
  { id: "reports",    icon: "📈",  label: "Reports" },
  { id: "settings",   icon: "⚙",  label: "Settings" },
];

// ─── Notification styling config ─────────────────────────────────────────────
export const NOTIF_CFG = {
  overdue:   { bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444", icon: "🔴" },
  leakage:   { bg: "#FFF7ED", border: "#FED7AA", dot: "#F59E0B", icon: "⚠️" },
  deadline:  { bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", icon: "📅" },
  submitted: { bg: "#F0FDF4", border: "#BBF7D0", dot: "#10B981", icon: "✅" },
  pending:   { bg: "#F8FAFC", border: "#E2E8F0", dot: "#94A3B8", icon: "🕐" },
  info:      { bg: "#F5F3FF", border: "#DDD6FE", dot: "#8B5CF6", icon: "ℹ️" },
};

// ─── Build Notifications (uses live data passed in — no hardcoded reviews) ────
export const buildNotifications = (employees, cycles, allReviews = []) => {
  const notifs = [];

  const overdue = allReviews.filter(r => r.status === "Overdue");
  overdue.forEach(r => notifs.push({
    id: "ov_" + r.id, type: "overdue",
    title: "Overdue Review",
    body: `${r.employee || r.employee_name}'s ${(r.client || r.client_name || "").split(" ")[0]} review is overdue.`,
    page: "reviews", time: "Today"
  }));

  const leakers = (employees || []).filter(e => gapPct(e) > 0);
  if (leakers.length > 0) notifs.push({
    id: "lk_all", type: "leakage",
    title: `Billing Leakage — ${leakers.length} Employee${leakers.length > 1 ? "s" : ""}`,
    body: leakers.map(e => `${(e.name || "").split(" ")[0]} (${gapPct(e)}% gap)`).join(", "),
    page: "resources", time: "Today"
  });

  const active = (cycles || []).find(c => c.status === "Active");
  if (active) notifs.push({
    id: "cy_" + active.id, type: "deadline",
    title: `Active Cycle — ${active.q}`,
    body: `Review deadline is ${active.deadline || active.r2 || "TBD"}. ${(active.sent || 0) - (active.submitted || 0)} stakeholder(s) yet to submit.`,
    page: "scheduler", time: "This week"
  });

  const submitted = allReviews.filter(r => r.status === "Submitted");
  if (submitted.length > 0) notifs.push({
    id: "sb_all", type: "submitted",
    title: `${submitted.length} Review${submitted.length > 1 ? "s" : ""} Awaiting Approval`,
    body: submitted.map(r => (r.employee || r.employee_name || "").split(" ")[0]).slice(0, 3).join(", ") + (submitted.length > 3 ? ` +${submitted.length - 3} more` : ""),
    page: "reviews", time: "Recently"
  });

  const pending = allReviews.filter(r => r.status === "Pending" || r.status === "Not Started");
  if (pending.length > 0) notifs.push({
    id: "pd_all", type: "pending",
    title: `${pending.length} Reviews Not Yet Started`,
    body: `Stakeholders for ${pending.map(r => (r.employee || r.employee_name || "").split(" ")[0]).slice(0, 3).join(", ")} haven't responded yet.`,
    page: "reviews", time: "This cycle"
  });

  const draft = (cycles || []).filter(c => c.status === "Draft");
  if (draft.length > 0) notifs.push({
    id: "dr_all", type: "info",
    title: `${draft.length} Cycle${draft.length > 1 ? "s" : ""} in Draft`,
    body: `${draft.map(c => c.q).join(", ")} — activate when ready to begin sending review emails.`,
    page: "scheduler", time: "Pending"
  });

  return notifs;
};
