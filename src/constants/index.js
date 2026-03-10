// ─── Shared Data Constants ────────────────────────────────────────────────────

export const CLIENT_COLORS = { CL001: "#E8520A", CL002: "#3B82F6", CL003: "#10B981", CL004: "#8B5CF6" };

export const CLIENTS_INIT = [
  {
    id: "CL001", code: "CL001", name: "HCL Healthcare", industry: "Healthcare", domain: "hcl.com",
    domains: ["hcl.com", "hcl.in"], status: "active", primaryStakeholderId: "S1",
    primaryContact: { name: "Dr. Arjun Nair", email: "arjun.nair@hcl.com", phone: "+91 98400 12345" },
    departments: [{ id: "D1", name: "Medical Coding" }, { id: "D2", name: "Medical Billing" }],
    stakeholders: [
      { id: "S1", name: "Dr. Arjun Nair", email: "arjun.nair@hcl.com", designation: "Senior Director", level: "client", deptId: null, active: true },
      { id: "S2", name: "Dr. Priya Sharma", email: "priya.sharma@hcl.com", designation: "VP Operations", level: "client", deptId: null, active: true },
      { id: "S3", name: "Meena Iyer", email: "meena.iyer@hcl.com", designation: "Dept Manager", level: "dept", deptId: "D1", active: true },
      { id: "S4", name: "Sundar Raj", email: "sundar.raj@hcl.com", designation: "Team Lead", level: "dept", deptId: "D2", active: false },
    ]
  },
  {
    id: "CL002", code: "CL002", name: "Verizon Consumer Group", industry: "Telecom", domain: "verizon.com",
    domains: ["verizon.com"], status: "active", primaryStakeholderId: "S5",
    primaryContact: { name: "Mark Stevens", email: "mark.stevens@verizon.com", phone: "+1 212 555 0191" },
    departments: [{ id: "D3", name: "Network Ops" }, { id: "D4", name: "Software Dev" }],
    stakeholders: [
      { id: "S5", name: "Mark Stevens", email: "mark.stevens@verizon.com", designation: "Director Engineering", level: "client", deptId: null, active: true },
      { id: "S6", name: "Lisa Romano", email: "lisa.romano@verizon.com", designation: "Sr. Manager", level: "dept", deptId: "D4", active: true },
    ]
  },
  {
    id: "CL003", code: "CL003", name: "City Union Bank", industry: "Banking", domain: "cityunionbank.com",
    domains: ["cityunionbank.com", "cub.co.in"], status: "active", primaryStakeholderId: "S7",
    primaryContact: { name: "Kavya Krishnan", email: "kavya.k@cityunionbank.com", phone: "+91 98765 43210" },
    departments: [{ id: "D5", name: "IT & Systems" }, { id: "D6", name: "Digital Banking" }],
    stakeholders: [
      { id: "S7", name: "Kavya Krishnan", email: "kavya.k@cityunionbank.com", designation: "Senior Manager IT", level: "client", deptId: null, active: true },
    ]
  },
  {
    id: "CL004", code: "CL004", name: "Tata Motors", industry: "Automobile", domain: "tatamotors.com",
    domains: ["tatamotors.com"], status: "onboarding", primaryStakeholderId: null,
    primaryContact: { name: "Rohit Sharma", email: "rohit.sharma@tatamotors.com", phone: "+91 99001 88234" },
    departments: [{ id: "D7", name: "Supply Chain Tech" }],
    stakeholders: []
  },
];

export const EMPLOYEES_INIT = [
  { id: "E1", code: "DZIND106", name: "Prasanth M", role: "Medical Coder", ctc: 1977, allocations: [{ clientId: "CL001", deptId: "D1", clientName: "HCL Healthcare", pct: 100, color: "#E8520A", stakeholders: [] }] },
  { id: "E2", code: "DZIND132", name: "Janani R", role: "Medical Biller", ctc: 880, allocations: [{ clientId: "CL001", deptId: "D2", clientName: "HCL Healthcare", pct: 100, color: "#E8520A", stakeholders: [] }] },
  { id: "E3", code: "DZIND116", name: "Prashant G", role: "Full Stack Dev", ctc: 1812, allocations: [{ clientId: "CL002", deptId: "D4", clientName: "Verizon Consumer Group", pct: 100, color: "#3B82F6", stakeholders: [] }] },
  { id: "E4", code: "DZIND119", name: "Ratna G", role: "QA Engineer", ctc: 1820, allocations: [{ clientId: "CL002", deptId: "D3", clientName: "Verizon Consumer Group", pct: 100, color: "#3B82F6", stakeholders: [] }] },
  { id: "E5", code: "DZIND136", name: "Rajasekar S", role: "Backend Dev", ctc: 1172, allocations: [{ clientId: "CL003", deptId: "D5", clientName: "City Union Bank", pct: 100, color: "#10B981", stakeholders: [] }] },
  { id: "E6", code: "DZIND137", name: "Aniket T", role: "Frontend Dev", ctc: 1172, allocations: [{ clientId: "CL003", deptId: "D6", clientName: "City Union Bank", pct: 75, color: "#10B981", stakeholders: [] }, { clientId: "CL001", deptId: "D1", clientName: "HCL Healthcare", pct: 25, color: "#E8520A", stakeholders: [] }] },
  { id: "E7", code: "DZIND138", name: "Sameer K", role: "Data Analyst", ctc: 1172, allocations: [{ clientId: "CL001", deptId: "D1", clientName: "HCL Healthcare", pct: 50, color: "#E8520A", stakeholders: [{ stakeholderId: "S1", pct: 30 }, { stakeholderId: "S2", pct: 20 }] }, { clientId: "CL002", deptId: "D4", clientName: "Verizon Consumer Group", pct: 25, color: "#3B82F6", stakeholders: [{ stakeholderId: "S5", pct: 25 }] }, { clientId: "CL003", deptId: "D5", clientName: "City Union Bank", pct: 25, color: "#10B981", stakeholders: [] }] },
  { id: "E8", code: "DZIND109", name: "Rajesh T", role: "Reimbursement Coord.", ctc: 1200, allocations: [{ clientId: "CL001", deptId: "D2", clientName: "HCL Healthcare", pct: 100, color: "#E8520A", stakeholders: [] }] },
  { id: "E9", code: "DZIND141", name: "Divya N", role: "Medical Coder", ctc: 950, allocations: [{ clientId: "CL001", deptId: "D1", clientName: "HCL Healthcare", pct: 60, color: "#E8520A", stakeholders: [] }] },
  { id: "E10", code: "DZIND142", name: "Karan M", role: "Backend Dev", ctc: 1100, allocations: [] },
  { id: "E11", code: "DZIND143", name: "Sneha P", role: "QA Engineer", ctc: 1050, allocations: [{ clientId: "CL002", deptId: "D3", clientName: "Verizon Consumer Group", pct: 40, color: "#3B82F6", stakeholders: [] }] },
];

export const ALL_REVIEWS = [
  // ── Q1 2025 — Closed / All Approved ──────────────────────────────────────
  { id: "R1_01", employee: "Prasanth M", empId: "DZIND106", client: "HCL Healthcare", quarter: "Q1 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Feb 14, 2025", hikeGiven: "14.40" },
  { id: "R1_02", employee: "Janani R", empId: "DZIND132", client: "HCL Healthcare", quarter: "Q1 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Feb 10, 2025", hikeGiven: "16.56" },
  { id: "R1_03", employee: "Prashant G", empId: "DZIND116", client: "Verizon Consumer Group", quarter: "Q1 2025", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "Feb 18, 2025", hikeGiven: "18.84" },
  { id: "R1_04", employee: "Ratna G", empId: "DZIND119", client: "Verizon Consumer Group", quarter: "Q1 2025", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "Feb 16, 2025", hikeGiven: "17.28" },
  { id: "R1_05", employee: "Rajasekar S", empId: "DZIND136", client: "City Union Bank", quarter: "Q1 2025", status: "Approved", stakeholder: "Kavya Krishnan", stakeholderEmail: "kavya.k@cityunionbank.com", submittedAt: "Feb 20, 2025", hikeGiven: "16.20" },
  { id: "R1_06", employee: "Aniket T", empId: "DZIND137", client: "City Union Bank", quarter: "Q1 2025", status: "Approved", stakeholder: "Kavya Krishnan", stakeholderEmail: "kavya.k@cityunionbank.com", submittedAt: "Feb 17, 2025", hikeGiven: "16.80" },
  { id: "R1_07", employee: "Sameer K", empId: "DZIND138", client: "HCL Healthcare", quarter: "Q1 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Feb 12, 2025", hikeGiven: "20.16" },
  { id: "R1_08", employee: "Rajesh T", empId: "DZIND109", client: "HCL Healthcare", quarter: "Q1 2025", status: "Approved", stakeholder: "Dr. Priya Sharma", stakeholderEmail: "priya.sharma@hcl.com", submittedAt: "Feb 22, 2025", hikeGiven: "15.72" },
  // ── Q2 2025 — Closed / All Approved ──────────────────────────────────────
  { id: "R2_01", employee: "Prasanth M", empId: "DZIND106", client: "HCL Healthcare", quarter: "Q2 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "May 12, 2025", hikeGiven: "14.94" },
  { id: "R2_02", employee: "Janani R", empId: "DZIND132", client: "HCL Healthcare", quarter: "Q2 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "May 08, 2025", hikeGiven: "17.16" },
  { id: "R2_03", employee: "Prashant G", empId: "DZIND116", client: "Verizon Consumer Group", quarter: "Q2 2025", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "May 15, 2025", hikeGiven: "19.44" },
  { id: "R2_04", employee: "Ratna G", empId: "DZIND119", client: "Verizon Consumer Group", quarter: "Q2 2025", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "May 14, 2025", hikeGiven: "18.00" },
  { id: "R2_05", employee: "Rajasekar S", empId: "DZIND136", client: "City Union Bank", quarter: "Q2 2025", status: "Approved", stakeholder: "Kavya Krishnan", stakeholderEmail: "kavya.k@cityunionbank.com", submittedAt: "May 18, 2025", hikeGiven: "16.80" },
  { id: "R2_06", employee: "Aniket T", empId: "DZIND137", client: "City Union Bank", quarter: "Q2 2025", status: "Approved", stakeholder: "Kavya Krishnan", stakeholderEmail: "kavya.k@cityunionbank.com", submittedAt: "May 16, 2025", hikeGiven: "17.40" },
  { id: "R2_07", employee: "Sameer K", empId: "DZIND138", client: "HCL Healthcare", quarter: "Q2 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "May 10, 2025", hikeGiven: "20.70" },
  { id: "R2_08", employee: "Rajesh T", empId: "DZIND109", client: "HCL Healthcare", quarter: "Q2 2025", status: "Approved", stakeholder: "Dr. Priya Sharma", stakeholderEmail: "priya.sharma@hcl.com", submittedAt: "May 20, 2025", hikeGiven: "16.32" },
  // ── Q3 2025 — Closed / All Approved  (Aniket T now split across 2 clients) ─
  { id: "R3_01", employee: "Prasanth M", empId: "DZIND106", client: "HCL Healthcare", quarter: "Q3 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Aug 14, 2025", hikeGiven: "15.60" },
  { id: "R3_02", employee: "Janani R", empId: "DZIND132", client: "HCL Healthcare", quarter: "Q3 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Aug 10, 2025", hikeGiven: "17.88" },
  { id: "R3_03", employee: "Prashant G", empId: "DZIND116", client: "Verizon Consumer Group", quarter: "Q3 2025", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "Aug 18, 2025", hikeGiven: "20.10" },
  { id: "R3_04", employee: "Ratna G", empId: "DZIND119", client: "Verizon Consumer Group", quarter: "Q3 2025", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "Aug 16, 2025", hikeGiven: "18.53" },
  { id: "R3_05", employee: "Rajasekar S", empId: "DZIND136", client: "City Union Bank", quarter: "Q3 2025", status: "Approved", stakeholder: "Kavya Krishnan", stakeholderEmail: "kavya.k@cityunionbank.com", submittedAt: "Aug 20, 2025", hikeGiven: "17.55" },
  { id: "R3_06", employee: "Aniket T", empId: "DZIND137", client: "City Union Bank", quarter: "Q3 2025", status: "Approved", stakeholder: "Kavya Krishnan", stakeholderEmail: "kavya.k@cityunionbank.com", submittedAt: "Aug 17, 2025", hikeGiven: "18.15" },
  { id: "R3_07", employee: "Aniket T", empId: "DZIND137", client: "HCL Healthcare", quarter: "Q3 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Aug 15, 2025", hikeGiven: "18.15" },
  { id: "R3_08", employee: "Sameer K", empId: "DZIND138", client: "HCL Healthcare", quarter: "Q3 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Aug 12, 2025", hikeGiven: "21.30" },
  { id: "R3_09", employee: "Sameer K", empId: "DZIND138", client: "Verizon Consumer Group", quarter: "Q3 2025", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "Aug 13, 2025", hikeGiven: "21.30" },
  { id: "R3_10", employee: "Rajesh T", empId: "DZIND109", client: "HCL Healthcare", quarter: "Q3 2025", status: "Approved", stakeholder: "Dr. Priya Sharma", stakeholderEmail: "priya.sharma@hcl.com", submittedAt: "Aug 22, 2025", hikeGiven: "16.80" },
  // ── Q4 2025 — Closed / All Approved ──────────────────────────────────────
  { id: "R4_01", employee: "Prasanth M", empId: "DZIND106", client: "HCL Healthcare", quarter: "Q4 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Nov 14, 2025", hikeGiven: "16.44" },
  { id: "R4_02", employee: "Janani R", empId: "DZIND132", client: "HCL Healthcare", quarter: "Q4 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Nov 11, 2025", hikeGiven: "18.54" },
  { id: "R4_03", employee: "Prashant G", empId: "DZIND116", client: "Verizon Consumer Group", quarter: "Q4 2025", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "Nov 19, 2025", hikeGiven: "20.40" },
  { id: "R4_04", employee: "Ratna G", empId: "DZIND119", client: "Verizon Consumer Group", quarter: "Q4 2025", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "Nov 17, 2025", hikeGiven: "19.05" },
  { id: "R4_05", employee: "Rajasekar S", empId: "DZIND136", client: "City Union Bank", quarter: "Q4 2025", status: "Approved", stakeholder: "Kavya Krishnan", stakeholderEmail: "kavya.k@cityunionbank.com", submittedAt: "Nov 21, 2025", hikeGiven: "18.45" },
  { id: "R4_06", employee: "Aniket T", empId: "DZIND137", client: "City Union Bank", quarter: "Q4 2025", status: "Approved", stakeholder: "Kavya Krishnan", stakeholderEmail: "kavya.k@cityunionbank.com", submittedAt: "Nov 18, 2025", hikeGiven: "18.75" },
  { id: "R4_07", employee: "Aniket T", empId: "DZIND137", client: "HCL Healthcare", quarter: "Q4 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Nov 15, 2025", hikeGiven: "18.75" },
  { id: "R4_08", employee: "Sameer K", empId: "DZIND138", client: "HCL Healthcare", quarter: "Q4 2025", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Nov 13, 2025", hikeGiven: "21.60" },
  { id: "R4_09", employee: "Sameer K", empId: "DZIND138", client: "Verizon Consumer Group", quarter: "Q4 2025", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "Nov 16, 2025", hikeGiven: "21.60" },
  { id: "R4_10", employee: "Rajesh T", empId: "DZIND109", client: "HCL Healthcare", quarter: "Q4 2025", status: "Approved", stakeholder: "Dr. Priya Sharma", stakeholderEmail: "priya.sharma@hcl.com", submittedAt: "Nov 20, 2025", hikeGiven: "17.40" },
  // ── Q1 2026 — Active / Mixed statuses ─────────────────────────────────────
  { id: "RV001", employee: "Prasanth M", empId: "DZIND106", client: "HCL Healthcare", quarter: "Q1 2026", status: "Submitted", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Feb 28, 2026", hikeGiven: null },
  { id: "RV002", employee: "Janani R", empId: "DZIND132", client: "HCL Healthcare", quarter: "Q1 2026", status: "Approved", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: "Feb 25, 2026", hikeGiven: "19.31" },
  { id: "RV003", employee: "Prashant G", empId: "DZIND116", client: "Verizon Consumer Group", quarter: "Q1 2026", status: "Approved", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: "Mar 01, 2026", hikeGiven: "21.30" },
  { id: "RV004", employee: "Ratna G", empId: "DZIND119", client: "Verizon Consumer Group", quarter: "Q1 2026", status: "In Progress", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: null, hikeGiven: null },
  { id: "RV005", employee: "Rajasekar S", empId: "DZIND136", client: "City Union Bank", quarter: "Q1 2026", status: "Pending", stakeholder: "Kavya Krishnan", stakeholderEmail: "kavya.k@cityunionbank.com", submittedAt: null, hikeGiven: null },
  { id: "RV006", employee: "Aniket T", empId: "DZIND137", client: "City Union Bank", quarter: "Q1 2026", status: "Pending", stakeholder: "Kavya Krishnan", stakeholderEmail: "kavya.k@cityunionbank.com", submittedAt: null, hikeGiven: null },
  { id: "RV007", employee: "Aniket T", empId: "DZIND137", client: "HCL Healthcare", quarter: "Q1 2026", status: "Email Sent", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: null, hikeGiven: null },
  { id: "RV008", employee: "Sameer K", empId: "DZIND138", client: "HCL Healthcare", quarter: "Q1 2026", status: "Overdue", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: null, hikeGiven: null },
  { id: "RV009", employee: "Sameer K", empId: "DZIND138", client: "Verizon Consumer Group", quarter: "Q1 2026", status: "Email Sent", stakeholder: "Mark Stevens", stakeholderEmail: "mark.stevens@verizon.com", submittedAt: null, hikeGiven: null },
  { id: "RV010", employee: "Rajesh T", empId: "DZIND109", client: "HCL Healthcare", quarter: "Q1 2026", status: "In Progress", stakeholder: "Dr. Arjun Nair", stakeholderEmail: "arjun.nair@hcl.com", submittedAt: null, hikeGiven: null },
];

// Derived: current active quarter only — used by notifications, dashboard, badge counts
export const REVIEWS_DATA = ALL_REVIEWS.filter(r => r.quarter === "Q1 2026");

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const totalPct = (e) => (e.allocations || []).reduce((s, a) => s + Number(a.pct || 0), 0);
export const gapPct = (e) => 100 - totalPct(e);
export const uid = () => Math.random().toString(36).slice(2, 8);

// ─── Dashboard Data ───────────────────────────────────────────────────────────

export const TREND_DATA = [
  { quarter: "Q1 '25", submitted: 6, total: 8 },
  { quarter: "Q2 '25", submitted: 7, total: 9 },
  { quarter: "Q3 '25", submitted: 8, total: 10 },
  { quarter: "Q4 '25", submitted: 9, total: 10 },
  { quarter: "Q1 '26", submitted: 3, total: 10 },
];

export const SCORE_DIST = [
  { name: "Excellent (>85)", value: 2, color: "#10B981" },
  { name: "Good (70–84)", value: 5, color: "#3B82F6" },
  { name: "Average (55–69)", value: 2, color: "#F59E0B" },
  { name: "Below Avg (<55)", value: 1, color: "#EF4444" },
];

// ─── Scoring Data ─────────────────────────────────────────────────────────────

export const QUARTER_SCORES = {
  "Q1 2026": [
    { code: "DZIND106", name: "Prasanth M", ctc: 1977, score: 70.00, approvedHike: null },
    { code: "DZIND132", name: "Janani R", ctc: 880, score: 80.47, approvedHike: "19.31" },
    { code: "DZIND116", name: "Prashant G", ctc: 1812, score: 88.75, approvedHike: "21.30" },
    { code: "DZIND119", name: "Ratna G", ctc: 1820, score: 82.19, approvedHike: null },
    { code: "DZIND136", name: "Rajasekar S", ctc: 1172, score: 80.63, approvedHike: null },
    { code: "DZIND137", name: "Aniket T", ctc: 1172, score: 80.31, approvedHike: null },
    { code: "DZIND138", name: "Sameer K", ctc: 1172, score: 92.50, approvedHike: null },
    { code: "DZIND109", name: "Rajesh T", ctc: 1200, score: null, approvedHike: null },
    { code: "DZIND141", name: "Divya N", ctc: 950, score: null, approvedHike: null },
    { code: "DZIND142", name: "Karan M", ctc: 1100, score: null, approvedHike: null },
    { code: "DZIND143", name: "Sneha P", ctc: 1050, score: null, approvedHike: null },
  ],
  "Q4 2025": [
    { code: "DZIND106", name: "Prasanth M", ctc: 1877, score: 68.50, approvedHike: "16.44" },
    { code: "DZIND132", name: "Janani R", ctc: 820, score: 77.25, approvedHike: "18.54" },
    { code: "DZIND116", name: "Prashant G", ctc: 1712, score: 85.00, approvedHike: "20.40" },
    { code: "DZIND119", name: "Ratna G", ctc: 1720, score: 79.38, approvedHike: "19.05" },
    { code: "DZIND136", name: "Rajasekar S", ctc: 1112, score: 76.88, approvedHike: "18.45" },
    { code: "DZIND137", name: "Aniket T", ctc: 1112, score: 78.13, approvedHike: "18.75" },
    { code: "DZIND138", name: "Sameer K", ctc: 1112, score: 90.00, approvedHike: "21.60" },
    { code: "DZIND109", name: "Rajesh T", ctc: 1140, score: 72.50, approvedHike: "17.40" },
  ],
  "Q3 2025": [
    { code: "DZIND106", name: "Prasanth M", ctc: 1810, score: 65.00, approvedHike: "15.60" },
    { code: "DZIND132", name: "Janani R", ctc: 790, score: 74.50, approvedHike: "17.88" },
    { code: "DZIND116", name: "Prashant G", ctc: 1650, score: 83.75, approvedHike: "20.10" },
    { code: "DZIND119", name: "Ratna G", ctc: 1660, score: 77.19, approvedHike: "18.53" },
    { code: "DZIND136", name: "Rajasekar S", ctc: 1072, score: 73.13, approvedHike: "17.55" },
    { code: "DZIND137", name: "Aniket T", ctc: 1072, score: 75.63, approvedHike: "18.15" },
    { code: "DZIND138", name: "Sameer K", ctc: 1072, score: 88.75, approvedHike: "21.30" },
    { code: "DZIND109", name: "Rajesh T", ctc: 1100, score: 70.00, approvedHike: "16.80" },
  ],
  "Q2 2025": [
    { code: "DZIND106", name: "Prasanth M", ctc: 1760, score: 62.25, approvedHike: "14.94" },
    { code: "DZIND132", name: "Janani R", ctc: 755, score: 71.50, approvedHike: "17.16" },
    { code: "DZIND116", name: "Prashant G", ctc: 1595, score: 81.00, approvedHike: "19.44" },
    { code: "DZIND119", name: "Ratna G", ctc: 1605, score: 75.00, approvedHike: "18.00" },
    { code: "DZIND136", name: "Rajasekar S", ctc: 1038, score: 70.00, approvedHike: "16.80" },
    { code: "DZIND137", name: "Aniket T", ctc: 1038, score: 72.50, approvedHike: "17.40" },
    { code: "DZIND138", name: "Sameer K", ctc: 1038, score: 86.25, approvedHike: "20.70" },
    { code: "DZIND109", name: "Rajesh T", ctc: 1065, score: 68.00, approvedHike: "16.32" },
  ],
  "Q1 2025": [
    { code: "DZIND106", name: "Prasanth M", ctc: 1700, score: 60.00, approvedHike: "14.40" },
    { code: "DZIND132", name: "Janani R", ctc: 720, score: 69.00, approvedHike: "16.56" },
    { code: "DZIND116", name: "Prashant G", ctc: 1540, score: 78.50, approvedHike: "18.84" },
    { code: "DZIND119", name: "Ratna G", ctc: 1550, score: 72.00, approvedHike: "17.28" },
    { code: "DZIND136", name: "Rajasekar S", ctc: 1005, score: 67.50, approvedHike: "16.20" },
    { code: "DZIND137", name: "Aniket T", ctc: 1005, score: 70.00, approvedHike: "16.80" },
    { code: "DZIND138", name: "Sameer K", ctc: 1005, score: 84.00, approvedHike: "20.16" },
    { code: "DZIND109", name: "Rajesh T", ctc: 1030, score: 65.50, approvedHike: "15.72" },
  ],
};

// Which quarters are fully closed (historical, read-only)
export const CLOSED_QUARTERS = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"];
export const ACTIVE_QUARTER = "Q1 2026";

export const COMP_INIT = [
  { name: "Communication", weight: 25 },
  { name: "Productivity", weight: 30 },
  { name: "Creativity", weight: 15 },
  { name: "Integrity", weight: 15 },
  { name: "Punctuality", weight: 5 },
  { name: "Attendance", weight: 10 },
];

// ─── Scheduler Data ───────────────────────────────────────────────────────────

export const CYCLES_INIT = [
  // ── 2025 History — Closed ─────────────────────────────────────────────────
  {
    id: "CY2501", q: "Q1 2025", year: 2025, quarter: 1, start: "2025-01-10", deadline: "2025-03-31", r1: "2025-03-10", r2: "2025-03-22", status: "Closed", sent: 8, submitted: 8, closed: true,
    emailHistory: [
      { at: "Jan 10, 2025 09:00", type: "Review Request", recipients: 8, notes: "Initial Q1 2025 trigger — 8 stakeholders" },
      { at: "Mar 10, 2025 09:00", type: "Reminder 1", recipients: 3, notes: "3 stakeholders yet to open form" },
      { at: "Mar 22, 2025 09:00", type: "Reminder 2", recipients: 1, notes: "Final nudge — 1 outstanding" },
      { at: "Mar 28, 2025 16:00", type: "Cycle Closed", recipients: 8, notes: "Q1 2025 closed — all 8 submitted & approved" },
    ]
  },
  {
    id: "CY2502", q: "Q2 2025", year: 2025, quarter: 2, start: "2025-04-01", deadline: "2025-06-30", r1: "2025-06-10", r2: "2025-06-22", status: "Closed", sent: 8, submitted: 8, closed: true,
    emailHistory: [
      { at: "Apr 01, 2025 09:00", type: "Review Request", recipients: 8, notes: "Q2 2025 cycle initiated" },
      { at: "Jun 10, 2025 09:00", type: "Reminder 1", recipients: 2, notes: "2 stakeholders pending" },
      { at: "Jun 25, 2025 11:30", type: "Cycle Closed", recipients: 8, notes: "Q2 2025 closed — all 8 approved" },
    ]
  },
  {
    id: "CY2503", q: "Q3 2025", year: 2025, quarter: 3, start: "2025-07-01", deadline: "2025-09-30", r1: "2025-09-10", r2: "2025-09-22", status: "Closed", sent: 10, submitted: 10, closed: true,
    emailHistory: [
      { at: "Jul 01, 2025 09:00", type: "Review Request", recipients: 10, notes: "Q3 2025 — Aniket T now scoped across 2 clients" },
      { at: "Sep 10, 2025 09:00", type: "Reminder 1", recipients: 4, notes: "4 stakeholders yet to submit" },
      { at: "Sep 22, 2025 09:00", type: "Reminder 2", recipients: 1, notes: "1 stakeholder outstanding — Mark Stevens" },
      { at: "Sep 29, 2025 14:00", type: "Cycle Closed", recipients: 10, notes: "Q3 2025 closed — all 10 approved" },
    ]
  },
  {
    id: "CY2504", q: "Q4 2025", year: 2025, quarter: 4, start: "2025-10-01", deadline: "2025-12-31", r1: "2025-12-10", r2: "2025-12-22", status: "Closed", sent: 10, submitted: 10, closed: true,
    emailHistory: [
      { at: "Oct 01, 2025 09:00", type: "Review Request", recipients: 10, notes: "Q4 2025 cycle triggered" },
      { at: "Dec 10, 2025 09:00", type: "Reminder 1", recipients: 3, notes: "3 stakeholders pending at R1" },
      { at: "Dec 22, 2025 09:00", type: "Reminder 2", recipients: 1, notes: "Kavya Krishnan — final reminder" },
      { at: "Dec 30, 2025 17:00", type: "Cycle Closed", recipients: 10, notes: "Q4 2025 closed — all 10 submitted & approved" },
    ]
  },
  // ── 2026 Current / Upcoming ───────────────────────────────────────────────
  {
    id: "CY001", q: "Q1 2026", year: 2026, quarter: 1, start: "2026-01-15", deadline: "2026-03-31", r1: "2026-03-15", r2: "2026-03-25", status: "Active", sent: 10, submitted: 3, closed: false,
    emailHistory: [
      { at: "Jan 15, 2026 09:00", type: "Review Request", recipients: 10, notes: "Initial Q1 2026 trigger" },
      { at: "Mar 15, 2026 09:00", type: "Reminder 1", recipients: 7, notes: "Sent to 7 pending stakeholders" },
      { at: "Mar 06, 2026 14:22", type: "Submission Confirm", recipients: 1, notes: "Prashant G review confirmed" },
    ]
  },
  { id: "CY002", q: "Q2 2026", year: 2026, quarter: 2, start: "2026-04-01", deadline: "2026-06-30", r1: "2026-06-15", r2: "2026-06-25", status: "Scheduled", sent: 0, submitted: 0, closed: false, emailHistory: [] },
  { id: "CY003", q: "Q3 2026", year: 2026, quarter: 3, start: "2026-07-01", deadline: "2026-09-30", r1: "2026-09-15", r2: "2026-09-25", status: "Scheduled", sent: 0, submitted: 0, closed: false, emailHistory: [] },
  { id: "CY004", q: "Q4 2026", year: 2026, quarter: 4, start: "2026-10-01", deadline: "2026-12-31", r1: "2026-12-15", r2: "2026-12-25", status: "Scheduled", sent: 0, submitted: 0, closed: false, emailHistory: [] },
];

// ─── Email Templates ─────────────────────────────────────────────────────────

export const EMAIL_TEMPLATES_INIT = [
  {
    id: "TPL001", type: "request_review", name: "Request Review",
    subject: "Performance Review Request — {{quarter}}",
    body: "Dear {{stakeholder_name}},\n\nWe hope this message finds you well.\n\nThis is to formally notify you that the {{quarter}} employee performance review cycle has been initiated at Dolluz. As a designated stakeholder, we kindly request you to evaluate the performance of the following employee(s) assigned to you:\n\n{{employee_list}}\n\nPlease access the review portal using the link below and complete your evaluations by {{deadline}}.\n\n{{portal_link}}\n\nShould you have any queries, please do not hesitate to reach out.\n\nWarm regards,\n{{admin_name}}\nDolluz HR Team",
    editable: true, system: true
  },
  {
    id: "TPL002", type: "reminder_1", name: "Reminder 1",
    subject: "[Reminder] Performance Review Pending — {{quarter}}",
    body: "Dear {{stakeholder_name}},\n\nThis is a gentle reminder that the {{quarter}} performance review for the following employee(s) is still pending:\n\n{{employee_list}}\n\nThe deadline to submit your review is {{deadline}}. We kindly request you to complete the evaluation at your earliest convenience.\n\n{{portal_link}}\n\nIf you have already submitted, please disregard this message.\n\nThank you,\n{{admin_name}}\nDolluz HR Team",
    editable: true, system: true
  },
  {
    id: "TPL003", type: "reminder_2", name: "Reminder 2",
    subject: "[Second Reminder] Action Required — {{quarter}} Performance Review",
    body: "Dear {{stakeholder_name}},\n\nWe noticed the {{quarter}} performance review is still outstanding for:\n\n{{employee_list}}\n\nThe deadline is {{deadline}}. As this is our second reminder, we kindly urge you to complete the review at the earliest.\n\nAccess the review portal: {{portal_link}}\n\nIf you are experiencing any access issues, please contact us immediately.\n\nBest regards,\n{{admin_name}}\nDolluz HR Team",
    editable: true, system: true
  },
  {
    id: "TPL004", type: "reminder_3", name: "Reminder 3",
    subject: "[Final Reminder] Urgent: {{quarter}} Review Deadline is {{deadline}}",
    body: "Dear {{stakeholder_name}},\n\nThis is a final reminder regarding the {{quarter}} performance review for:\n\n{{employee_list}}\n\nThe submission deadline is {{deadline}}. This is the last opportunity to provide your review. Please complete immediately:\n\n{{portal_link}}\n\nFor urgent assistance, please contact us directly.\n\nRegards,\n{{admin_name}}\nDolluz HR Team",
    editable: true, system: true
  },
  {
    id: "TPL005", type: "thank_you", name: "Thank You",
    subject: "Thank You — {{quarter}} Performance Review Submitted",
    body: "Dear {{stakeholder_name}},\n\nThank you for successfully completing the {{quarter}} performance review for:\n\n{{employee_list}}\n\nYour feedback has been recorded and will be reviewed by the HR team. We greatly appreciate your time and thoughtful evaluation.\n\nWith appreciation,\n{{admin_name}}\nDolluz HR Team",
    editable: true, system: true
  },
  {
    id: "TPL006", type: "thank_you_pdf", name: "Thank You (with PDF Copy)",
    subject: "Thank You — {{quarter}} Review Submitted · PDF Copy Enclosed",
    body: "Dear {{stakeholder_name}},\n\nThank you for completing the {{quarter}} performance review for:\n\n{{employee_list}}\n\nAs requested, please find attached a PDF copy of the submitted performance review for your records.\n\nWe value your contribution to our performance management process.\n\nWith gratitude,\n{{admin_name}}\nDolluz HR Team\n\n[Attachment: {{quarter}}_Performance_Review_{{stakeholder_name}}.pdf]",
    editable: true, system: true
  },
  {
    id: "TPL007", type: "admin_submission_alert", name: "Admin Submission Alert",
    subject: "[Review Submitted] {{employee_name}} — {{quarter}}",
    body: "Dear {{admin_name}},\n\nThis is to notify you that a performance review has been submitted for the following employee:\n\nEmployee  : {{employee_name}} ({{employee_id}})\nReviewed by : {{stakeholder_name}}\nQuarter   : {{quarter}}\nSubmitted on : {{submitted_at}}\n\nPlease log in to the Dolluz EPR Portal to review the submission, verify the scores, and proceed with the hike approval in the Scoring & Hikes section.\n\n[Attachment: {{quarter}}_Performance_Review_{{employee_name}}.pdf]\n\nThis is an automated notification from the Dolluz EPR system.\n\nDolluz HR System",
    editable: true, system: true
  },
];

// ─── Global CC List ───────────────────────────────────────────────────────────

export const CC_INIT = [
  { id: "CC001", name: "Super Admin", email: "admin@dolluz.com", addedAt: "System Default", locked: true },
];

// ─── Pre-populated email state for CY001 Q1 2026 (already active) ─────────────

export const INITIAL_EMAIL_STATE = {
  "CY001_CL001_S1": {
    requestAt: "Jan 15, 2026 09:00", reminder1At: "Mar 15, 2026 09:00", reminder2At: null, reminder3At: null,
    logs: [
      { empId: "DZIND106", empName: "Prasanth M", type: "Review Request", at: "Jan 15, 2026 09:00" },
      { empId: "DZIND109", empName: "Rajesh T", type: "Review Request", at: "Jan 15, 2026 09:00" },
      { empId: "DZIND138", empName: "Sameer K", type: "Review Request", at: "Jan 15, 2026 09:00" },
      { empId: "DZIND106", empName: "Prasanth M", type: "Reminder 1", at: "Mar 15, 2026 09:00" },
      { empId: "DZIND109", empName: "Rajesh T", type: "Reminder 1", at: "Mar 15, 2026 09:00" },
      { empId: "DZIND138", empName: "Sameer K", type: "Reminder 1", at: "Mar 15, 2026 09:00" },
    ]
  },
  "CY001_CL001_S3": {
    requestAt: "Jan 15, 2026 09:00", reminder1At: "Mar 15, 2026 09:00", reminder2At: null, reminder3At: null,
    logs: [
      { empId: "DZIND106", empName: "Prasanth M", type: "Review Request", at: "Jan 15, 2026 09:00" },
      { empId: "DZIND141", empName: "Divya N", type: "Review Request", at: "Jan 15, 2026 09:00" },
      { empId: "DZIND137", empName: "Aniket T", type: "Review Request", at: "Jan 15, 2026 09:00" },
      { empId: "DZIND106", empName: "Prasanth M", type: "Reminder 1", at: "Mar 15, 2026 09:00" },
      { empId: "DZIND141", empName: "Divya N", type: "Reminder 1", at: "Mar 15, 2026 09:00" },
      { empId: "DZIND137", empName: "Aniket T", type: "Reminder 1", at: "Mar 15, 2026 09:00" },
    ]
  },
  "CY001_CL002_S5": {
    requestAt: "Jan 15, 2026 09:00", reminder1At: "Mar 15, 2026 09:00", reminder2At: null, reminder3At: null,
    logs: [
      { empId: "DZIND119", empName: "Ratna G", type: "Review Request", at: "Jan 15, 2026 09:00" },
      { empId: "DZIND116", empName: "Prashant G", type: "Review Request", at: "Jan 15, 2026 09:00" },
      { empId: "DZIND119", empName: "Ratna G", type: "Reminder 1", at: "Mar 15, 2026 09:00" },
      { empId: "DZIND116", empName: "Prashant G", type: "Reminder 1", at: "Mar 15, 2026 09:00" },
    ]
  },
  "CY001_CL003_S7": {
    requestAt: "Jan 15, 2026 09:00", reminder1At: null, reminder2At: null, reminder3At: null,
    logs: [
      { empId: "DZIND136", empName: "Rajasekar S", type: "Review Request", at: "Jan 15, 2026 09:00" },
      { empId: "DZIND137", empName: "Aniket T", type: "Review Request", at: "Jan 15, 2026 09:00" },
    ]
  },
};

// ── Quarter master definition — single source of truth ────────────────────────
export const QUARTER_DEF = {
  1: { label: "Q1 (Jan–Mar)", start: "01-01", end: "03-31", months: "Jan–Mar" },
  2: { label: "Q2 (Apr–Jun)", start: "04-01", end: "06-30", months: "Apr–Jun" },
  3: { label: "Q3 (Jul–Sep)", start: "07-01", end: "09-30", months: "Jul–Sep" },
  4: { label: "Q4 (Oct–Dec)", start: "10-01", end: "12-31", months: "Oct–Dec" },
};

// ─── Navigation Items ─────────────────────────────────────────────────────────

export const NAV_ITEMS = [
  { id: "dashboard", icon: "\u2302", label: "Dashboard" },
  { id: "clients", icon: "\uD83C\uDFDA", label: "Client Configuration" },
  { id: "employees", icon: "\uD83D\uDC64", label: "Employee Database" },
  { id: "resources", icon: "\uD83D\uDC65", label: "Allocation & Leakage" },
  { id: "scheduler", icon: "\uD83D\uDCC5", label: "Cycle Scheduler" },
  { id: "reviews", icon: "\uD83D\uDCCB", label: "Review Management" },
  { id: "scoring", icon: "\uD83D\uDCCA", label: "Scoring & Hikes" },
  { id: "email", icon: "\uD83D\uDCE7", label: "Email" },
  { id: "reports", icon: "\uD83D\uDCC8", label: "Reports" },
  { id: "settings", icon: "\u2699", label: "Settings" },
];

// ─── Notification Config ──────────────────────────────────────────────────────

export const NOTIF_CFG = {
  overdue: { bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444", icon: "🔴" },
  leakage: { bg: "#FFF7ED", border: "#FED7AA", dot: "#F59E0B", icon: "⚠️" },
  deadline: { bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6", icon: "📅" },
  submitted: { bg: "#F0FDF4", border: "#BBF7D0", dot: "#10B981", icon: "✅" },
  pending: { bg: "#F8FAFC", border: "#E2E8F0", dot: "#94A3B8", icon: "🕐" },
  info: { bg: "#F5F3FF", border: "#DDD6FE", dot: "#8B5CF6", icon: "ℹ️" },
};

// ─── Build Notifications ──────────────────────────────────────────────────────

export const buildNotifications = (employees, cycles) => {
  const notifs = [];
  const overdue = REVIEWS_DATA.filter(r => r.status === "Overdue");
  overdue.forEach(r => notifs.push({
    id: "ov_" + r.id, type: "overdue",
    title: "Overdue Review",
    body: `${r.employee}'s ${r.client.split(" ")[0]} review is overdue — stakeholder has not responded.`,
    page: "reviews", time: "Today"
  }));

  const leakers = employees.filter(e => gapPct(e) > 0);
  if (leakers.length > 0) notifs.push({
    id: "lk_all", type: "leakage",
    title: `Billing Leakage — ${leakers.length} Employee${leakers.length > 1 ? "s" : ""}`,
    body: leakers.map(e => `${e.name.split(" ")[0]} (${gapPct(e)}% gap)`).join(", "),
    page: "resources", time: "Today"
  });

  const active = cycles.find(c => c.status === "Active");
  if (active) notifs.push({
    id: "cy_" + active.id, type: "deadline",
    title: `Active Cycle — ${active.q}`,
    body: `Review deadline is ${active.deadline}. ${active.sent - active.submitted} stakeholder${(active.sent - active.submitted) !== 1 ? "s" : ""} yet to submit.`,
    page: "scheduler", time: "This week"
  });

  const submitted = REVIEWS_DATA.filter(r => r.status === "Submitted");
  if (submitted.length > 0) notifs.push({
    id: "sb_all", type: "submitted",
    title: `${submitted.length} Review${submitted.length > 1 ? "s" : ""} Awaiting Approval`,
    body: submitted.map(r => r.employee.split(" ")[0]).slice(0, 3).join(", ") + (submitted.length > 3 ? ` +${submitted.length - 3} more` : ""),
    page: "reviews", time: "Recently"
  });

  const pending = REVIEWS_DATA.filter(r => r.status === "Pending");
  if (pending.length > 0) notifs.push({
    id: "pd_all", type: "pending",
    title: `${pending.length} Reviews Not Yet Started`,
    body: `Stakeholders for ${pending.map(r => r.employee.split(" ")[0]).slice(0, 3).join(", ")} haven't opened their forms yet.`,
    page: "reviews", time: "This cycle"
  });

  const draft = cycles.filter(c => c.status === "Draft");
  if (draft.length > 0) notifs.push({
    id: "dr_all", type: "info",
    title: `${draft.length} Cycle${draft.length > 1 ? "s" : ""} in Draft`,
    body: `${draft.map(c => c.q).join(", ")} — activate when ready to begin sending review emails.`,
    page: "scheduler", time: "Pending"
  });

  return notifs;
};

// ─── Employee Database Init ───────────────────────────────────────────────────

export const EMP_DB_INIT = [
  {
    id: "E1", code: "DZIND106", name: "Prasanth M", dob: "1990-04-12", gender: "Male", bloodGroup: "B+", nationality: "Indian",
    aadhaar: "2345 6789 0123", pan: "ABCPM1234D", passport: { no: "P1234567", expiry: "2030-04-11", country: "India" },
    primaryPhone: "9876543210", secondaryPhone: "", officialEmail: "prasanth.m@dolluz.com", personalEmail: "prasanth90@gmail.com",
    currentAddr: { line1: "14, Anna Nagar West", line2: "", city: "Chennai", state: "Tamil Nadu", pin: "600040" },
    permanentAddr: { line1: "14, Anna Nagar West", line2: "", city: "Chennai", state: "Tamil Nadu", pin: "600040" },
    emergency: { name: "Meena M", relation: "Spouse", phone: "9876500001", email: "meena.m@gmail.com" },
    designation: "Medical Coder", department: "Healthcare", joinDate: "2021-06-01", status: "Active", reportingManager: "Arjun K",
    education: [{ degree: "B.Sc Biochemistry", institution: "Madras University", year: "2011", grade: "72%", specialization: "Biochemistry" }],
    workHistory: [{ company: "Apollo Hospitals", role: "Coder Trainee", from: "2011-07", to: "2021-05", reason: "Better opportunity", ctc: "480" }],
    skills: ["ICD-10", "CPT", "Medical Billing", "MS Excel"], resumeFile: "Prasanth_CV.pdf", notes: "Top performer Q3/Q4 2025", ctc: 1977
  },
  {
    id: "E2", code: "DZIND132", name: "Janani R", dob: "1994-08-22", gender: "Female", bloodGroup: "O+", nationality: "Indian",
    aadhaar: "3456 7890 1234", pan: "BCPJR5678E", passport: { no: "", expiry: "", country: "" },
    primaryPhone: "9865432109", secondaryPhone: "044-24512345", officialEmail: "janani.r@dolluz.com", personalEmail: "janani94@yahoo.com",
    currentAddr: { line1: "22, T. Nagar", line2: "Pondy Bazaar", city: "Chennai", state: "Tamil Nadu", pin: "600017" },
    permanentAddr: { line1: "5, Main Street", line2: "", city: "Trichy", state: "Tamil Nadu", pin: "620001" },
    emergency: { name: "Rajan R", relation: "Father", phone: "9845001122", email: "" },
    designation: "Medical Biller", department: "Healthcare", joinDate: "2022-03-15", status: "Active", reportingManager: "Arjun K",
    education: [{ degree: "B.Com", institution: "Stella Maris College", year: "2015", grade: "78%", specialization: "Commerce" }],
    workHistory: [{ company: "Fortis Billing Hub", role: "Billing Executive", from: "2015-06", to: "2022-02", reason: "Growth", ctc: "320" }],
    skills: ["Medical Billing", "AR Management", "Insurance Claims", "Tally"], resumeFile: "Janani_CV.pdf", notes: "", ctc: 880
  },
  {
    id: "E3", code: "DZIND116", name: "Prashant G", dob: "1992-11-05", gender: "Male", bloodGroup: "A+", nationality: "Indian",
    aadhaar: "4567 8901 2345", pan: "CDGPG2345F", passport: { no: "P7654321", expiry: "2028-11-04", country: "India" },
    primaryPhone: "9754321098", secondaryPhone: "", officialEmail: "prashant.g@dolluz.com", personalEmail: "prashant.g92@gmail.com",
    currentAddr: { line1: "Block B-4, Hiranandani", line2: "Powai", city: "Mumbai", state: "Maharashtra", pin: "400076" },
    permanentAddr: { line1: "Plot 7, Sector 12", line2: "", city: "Navi Mumbai", state: "Maharashtra", pin: "400614" },
    emergency: { name: "Geeta G", relation: "Mother", phone: "9876500022", email: "" },
    designation: "Full Stack Developer", department: "Engineering", joinDate: "2020-09-01", status: "Active", reportingManager: "Vijay S",
    education: [
      { degree: "B.E Computer Science", institution: "VJTI Mumbai", year: "2014", grade: "8.2 CGPA", specialization: "CS" },
      { degree: "M.Tech Software Engineering", institution: "IIT Bombay", year: "2016", grade: "8.7 CGPA", specialization: "Software Engg" }
    ],
    workHistory: [
      { company: "Infosys Ltd", role: "Systems Engineer", from: "2016-08", to: "2019-10", reason: "Startup opportunity", ctc: "850" },
      { company: "FinTech Startup", role: "Senior Dev", from: "2019-11", to: "2020-08", reason: "Client project move", ctc: "1400" }
    ],
    skills: ["React", "Node.js", "PostgreSQL", "AWS", "Docker"], resumeFile: "Prashant_CV.pdf", notes: "Verizon lead dev", ctc: 1812
  },
  {
    id: "E4", code: "DZIND119", name: "Ratna G", dob: "1993-03-17", gender: "Female", bloodGroup: "B-", nationality: "Indian",
    aadhaar: "5678 9012 3456", pan: "EFGRG3456G", passport: { no: "", expiry: "", country: "" },
    primaryPhone: "9643210987", secondaryPhone: "", officialEmail: "ratna.g@dolluz.com", personalEmail: "ratna.g93@gmail.com",
    currentAddr: { line1: "Apt 301, Prestige Ferns", line2: "", city: "Bengaluru", state: "Karnataka", pin: "560068" },
    permanentAddr: { line1: "12, MG Road", line2: "", city: "Mysuru", state: "Karnataka", pin: "570001" },
    emergency: { name: "Gopal R", relation: "Husband", phone: "9743200001", email: "gopal.r@gmail.com" },
    designation: "QA Engineer", department: "Engineering", joinDate: "2021-01-10", status: "Active", reportingManager: "Vijay S",
    education: [{ degree: "B.E Electronics", institution: "BMS College Bengaluru", year: "2015", grade: "71%", specialization: "ECE" }],
    workHistory: [{ company: "Wipro Technologies", role: "QA Analyst", from: "2015-07", to: "2020-12", reason: "Better role", ctc: "750" }],
    skills: ["Selenium", "JIRA", "Postman", "Manual Testing", "SQL"], resumeFile: "Ratna_CV.pdf", notes: "", ctc: 1820
  },
  {
    id: "E5", code: "DZIND136", name: "Rajasekar S", dob: "1996-07-08", gender: "Male", bloodGroup: "O-", nationality: "Indian",
    aadhaar: "6789 0123 4567", pan: "FGHRS4567H", passport: { no: "", expiry: "", country: "" },
    primaryPhone: "9532109876", secondaryPhone: "", officialEmail: "rajasekar.s@dolluz.com", personalEmail: "raja.s96@gmail.com",
    currentAddr: { line1: "18, Velachery Main Road", line2: "", city: "Chennai", state: "Tamil Nadu", pin: "600042" },
    permanentAddr: { line1: "18, Velachery Main Road", line2: "", city: "Chennai", state: "Tamil Nadu", pin: "600042" },
    emergency: { name: "Saroja S", relation: "Mother", phone: "9865400001", email: "" },
    designation: "Backend Developer", department: "Engineering", joinDate: "2022-07-04", status: "Active", reportingManager: "Vijay S",
    education: [{ degree: "B.Tech IT", institution: "SRM University", year: "2018", grade: "8.0 CGPA", specialization: "IT" }],
    workHistory: [{ company: "TCS", role: "Associate", from: "2018-08", to: "2022-06", reason: "Growth & salary", ctc: "450" }],
    skills: ["Java", "Spring Boot", "MySQL", "REST APIs", "Git"], resumeFile: "Rajasekar_CV.pdf", notes: "", ctc: 1172
  },
  {
    id: "E6", code: "DZIND137", name: "Aniket T", dob: "1995-12-01", gender: "Male", bloodGroup: "AB+", nationality: "Indian",
    aadhaar: "7890 1234 5678", pan: "GHIAT5678I", passport: { no: "P2345678", expiry: "2029-12-01", country: "India" },
    primaryPhone: "9421098765", secondaryPhone: "", officialEmail: "aniket.t@dolluz.com", personalEmail: "aniket.t95@gmail.com",
    currentAddr: { line1: "Flat 12B, Raheja Towers", line2: "Bandra West", city: "Mumbai", state: "Maharashtra", pin: "400050" },
    permanentAddr: { line1: "4, Shivaji Nagar", line2: "", city: "Pune", state: "Maharashtra", pin: "411005" },
    emergency: { name: "Tara T", relation: "Sister", phone: "9823400001", email: "tara.t@gmail.com" },
    designation: "Frontend Developer", department: "Engineering", joinDate: "2023-02-20", status: "Active", reportingManager: "Vijay S",
    education: [{ degree: "B.E Computer Science", institution: "Pune University", year: "2017", grade: "7.8 CGPA", specialization: "CS" }],
    workHistory: [{ company: "Accenture", role: "Associate Frontend Dev", from: "2017-10", to: "2023-01", reason: "Better project", ctc: "750" }],
    skills: ["React", "TypeScript", "CSS3", "Figma", "Vue.js"], resumeFile: "Aniket_CV.pdf", notes: "Multi-client allocation", ctc: 1172
  },
  {
    id: "E7", code: "DZIND138", name: "Sameer K", dob: "1991-05-28", gender: "Male", bloodGroup: "A-", nationality: "Indian",
    aadhaar: "8901 2345 6789", pan: "HIJSK6789J", passport: { no: "P3456789", expiry: "2031-05-27", country: "India" },
    primaryPhone: "9310987654", secondaryPhone: "9310987655", officialEmail: "sameer.k@dolluz.com", personalEmail: "sameer.k91@gmail.com",
    currentAddr: { line1: "C-203, DLF Phase 4", line2: "", city: "Gurugram", state: "Haryana", pin: "122009" },
    permanentAddr: { line1: "15, Rajouri Garden", line2: "", city: "New Delhi", state: "Delhi", pin: "110027" },
    emergency: { name: "Kamala K", relation: "Spouse", phone: "9310000011", email: "kamala.k@gmail.com" },
    designation: "Data Analyst", department: "Analytics", joinDate: "2020-11-01", status: "Active", reportingManager: "Vijay S",
    education: [
      { degree: "B.Sc Statistics", institution: "Delhi University", year: "2013", grade: "74%", specialization: "Statistics" },
      { degree: "MBA Analytics", institution: "IIMB", year: "2015", grade: "3.8/4", specialization: "Business Analytics" }
    ],
    workHistory: [{ company: "Cognizant", role: "Business Analyst", from: "2015-07", to: "2020-10", reason: "Domain switch", ctc: "900" }],
    skills: ["Python", "Tableau", "Power BI", "SQL", "R", "Excel"], resumeFile: "Sameer_CV.pdf", notes: "Highest hike recipient", ctc: 1172
  },
  {
    id: "E8", code: "DZIND109", name: "Rajesh T", dob: "1989-09-15", gender: "Male", bloodGroup: "B+", nationality: "Indian",
    aadhaar: "9012 3456 7890", pan: "IJKRT7890K", passport: { no: "", expiry: "", country: "" },
    primaryPhone: "9209876543", secondaryPhone: "044-28001234", officialEmail: "rajesh.t@dolluz.com", personalEmail: "rajesh.t89@gmail.com",
    currentAddr: { line1: "Plot 22, Adyar", line2: "", city: "Chennai", state: "Tamil Nadu", pin: "600020" },
    permanentAddr: { line1: "Plot 22, Adyar", line2: "", city: "Chennai", state: "Tamil Nadu", pin: "600020" },
    emergency: { name: "Tulsi T", relation: "Spouse", phone: "9200000022", email: "" },
    designation: "Reimbursement Coordinator", department: "Healthcare", joinDate: "2019-04-01", status: "Active", reportingManager: "Arjun K",
    education: [{ degree: "B.Pharm", institution: "JSS College of Pharmacy", year: "2011", grade: "68%", specialization: "Pharmacy" }],
    workHistory: [{ company: "Max Healthcare", role: "Claims Officer", from: "2011-08", to: "2019-03", reason: "Salary growth", ctc: "680" }],
    skills: ["Claims Processing", "ICD Coding", "EOB Analysis", "MS Word"], resumeFile: "Rajesh_CV.pdf", notes: "Senior member", ctc: 1200
  },
  {
    id: "E9", code: "DZIND141", name: "Divya N", dob: "1997-02-14", gender: "Female", bloodGroup: "O+", nationality: "Indian",
    aadhaar: "0123 4567 8901", pan: "JKLND8901L", passport: { no: "", expiry: "", country: "" },
    primaryPhone: "9198765432", secondaryPhone: "", officialEmail: "divya.n@dolluz.com", personalEmail: "divya.n97@gmail.com",
    currentAddr: { line1: "77, Kodambakkam High Rd", line2: "", city: "Chennai", state: "Tamil Nadu", pin: "600024" },
    permanentAddr: { line1: "77, Kodambakkam High Rd", line2: "", city: "Chennai", state: "Tamil Nadu", pin: "600024" },
    emergency: { name: "Nair R", relation: "Father", phone: "9190000033", email: "" },
    designation: "Medical Coder", department: "Healthcare", joinDate: "2023-06-01", status: "Active", reportingManager: "Arjun K",
    education: [{ degree: "B.Sc Nursing", institution: "Madras Medical College", year: "2019", grade: "80%", specialization: "Nursing" }],
    workHistory: [],
    skills: ["ICD-10", "Medical Terminology", "EHR Systems"], resumeFile: "Divya_CV.pdf", notes: "Recent addition — 60% allocation", ctc: 950
  },
  {
    id: "E10", code: "DZIND142", name: "Karan M", dob: "1998-06-30", gender: "Male", bloodGroup: "A+", nationality: "Indian",
    aadhaar: "1234 5678 9012", pan: "KLMKM9012M", passport: { no: "", expiry: "", country: "" },
    primaryPhone: "9087654321", secondaryPhone: "", officialEmail: "karan.m@dolluz.com", personalEmail: "karan.m98@gmail.com",
    currentAddr: { line1: "Hostel Block C, Powai", line2: "IIT Campus", city: "Mumbai", state: "Maharashtra", pin: "400076" },
    permanentAddr: { line1: "8, Civil Lines", line2: "", city: "Jaipur", state: "Rajasthan", pin: "302006" },
    emergency: { name: "Meera M", relation: "Mother", phone: "9080000044", email: "meera.m@gmail.com" },
    designation: "Backend Developer", department: "Engineering", joinDate: "2024-01-15", status: "Active", reportingManager: "Vijay S",
    education: [{ degree: "B.Tech CSE", institution: "IIT Bombay", year: "2020", grade: "8.9 CGPA", specialization: "CS" }],
    workHistory: [{ company: "Zepto", role: "Backend Intern", from: "2020-06", to: "2023-12", reason: "Full-time role", ctc: "650" }],
    skills: ["Go", "Kubernetes", "Redis", "PostgreSQL", "gRPC"], resumeFile: "Karan_CV.pdf", notes: "Unallocated — needs client assignment", ctc: 1100
  },
  {
    id: "E11", code: "DZIND143", name: "Sneha P", dob: "1996-10-25", gender: "Female", bloodGroup: "AB-", nationality: "Indian",
    aadhaar: "2345 6789 0124", pan: "LMNSP0123N", passport: { no: "P4567890", expiry: "2032-10-24", country: "India" },
    primaryPhone: "8976543210", secondaryPhone: "", officialEmail: "sneha.p@dolluz.com", personalEmail: "sneha.p96@gmail.com",
    currentAddr: { line1: "22A, Indiranagar 100ft Road", line2: "", city: "Bengaluru", state: "Karnataka", pin: "560038" },
    permanentAddr: { line1: "3, Gandhi Nagar", line2: "", city: "Hubli", state: "Karnataka", pin: "580020" },
    emergency: { name: "Pradeep P", relation: "Brother", phone: "8970000055", email: "pradeep.p@gmail.com" },
    designation: "QA Engineer", department: "Engineering", joinDate: "2023-09-01", status: "Active", reportingManager: "Vijay S",
    education: [{ degree: "B.E ISE", institution: "PESIT Bengaluru", year: "2018", grade: "7.5 CGPA", specialization: "ISE" }],
    workHistory: [{ company: "Mindtree", role: "QA Engineer", from: "2018-09", to: "2023-08", reason: "Better opportunity", ctc: "650" }],
    skills: ["Selenium", "Appium", "Cypress", "API Testing", "Jenkins"], resumeFile: "Sneha_CV.pdf", notes: "40% allocation — scope to expand", ctc: 1050
  },
];
