import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FontLink from "./components/FontLink";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import LoginScreen from "./LoginScreen";
import Dashboard from "./pages/Dashboard";
import ClientConfig from "./pages/ClientConfig";
import AllocationPage from "./pages/AllocationPage";
import Reviews from "./pages/Reviews";
import Scoring from "./pages/Scoring";
import Scheduler from "./pages/Scheduler";
import { NewCycleModal } from "./pages/Scheduler";
import EmployeeDatabase from "./pages/EmployeeDatabase";
import Settings from "./pages/Settings";
import EmailModule from "./pages/EmailModule";
import {
  CLIENTS_INIT, EMPLOYEES_INIT, CYCLES_INIT, EMP_DB_INIT,
  EMAIL_TEMPLATES_INIT, CC_INIT, INITIAL_EMAIL_STATE, ALL_REVIEWS,
  gapPct, buildNotifications
} from "./constants";
import { apiFetch } from "./utils/api";

// ── Data normalizers ───────────────────────────────────────────────────────────
function normalizeClient(c) {
  return {
    ...c,
    id: c.id,
    code: c.code || c.id,
    name: c.name || "",
    industry: c.industry || "",
    status: c.status || "active",
    color: c.color_hex || c.color || "#64748B",
    color_hex: c.color_hex || c.color || "#64748B",
    primaryStakeholderId: c.primary_stakeholder_id ?? c.primaryStakeholderId ?? null,
    primaryContact: c.primaryContact || {
      name: c.pc_name || "",
      email: c.pc_email || "",
      phone: c.pc_phone || "",
    },
    stakeholders: (c.stakeholders || []).map(s => ({
      ...s,
      deptId: s.dept_id ?? s.deptId ?? null,
      active: Boolean(s.active),
    })),
    departments: c.departments || [],
    domains: c.domains || [],
    domain: c.domain || (c.domains && c.domains[0]) || "",
  };
}

function normalizeCycle(c) {
  return {
    ...c,
    q: c.quarter_label ?? c.q ?? "",
    quarter: c.quarter_num ?? c.quarter ?? 0,
    start: c.start_date ?? c.start ?? "",
    r1: c.r1_date ?? c.r1 ?? "",
    r2: c.r2_date ?? c.r2 ?? "",
    sent: Number(c.sent_count ?? c.sent ?? 0),
    submitted: Number(c.submitted_count ?? c.submitted ?? 0),
    closed: Boolean(c.closed),
    emailHistory: c.emailHistory ?? [],
  };
}

function normalizeReview(r) {
  return {
    ...r,
    employee: r.employee_name || r.employee || "",
    empId: r.employee_code || r.empId || "",
    client: r.client_name || r.client || "",
    quarter: r.cycle_name || r.quarter || "",
    stakeholder: r.stakeholder_name || r.stakeholder || "",
    stakeholderEmail: r.stakeholder_email || r.stakeholderEmail || "",
    submittedAt: r.submitted_at
      ? new Date(r.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : (r.submittedAt || ""),
    hikeGiven: r.approved_hike != null ? String(r.approved_hike) : (r.hikeGiven || ""),
  };
}

function normalizeAllocEmployee(e) {
  return {
    id: e.employee_id,
    code: e.employee_code,
    name: e.employee_name,
    role: e.designation || "",
    ctc: 0,
    allocations: (e.allocations || [])
      .filter(a => a.allocation_id != null)
      .map(a => ({
        clientId: a.client_id,
        clientName: a.client_name,
        deptId: a.dept_id,
        pct: a.pct,
        color: a.color_hex || "#64748B",
        stakeholders: (a.stakeholders || []).map(s => ({
          stakeholderId: s.stakeholder_id,
          pct: s.review_pct,
        })),
      })),
  };
}

const VALID_PAGES = ["dashboard", "clients", "resources", "employees", "reviews", "scoring", "scheduler", "email", "reports", "settings"];

export default function DolluzEPRPortal() {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive current page from URL path (e.g. /dashboard → "dashboard")
  const pageFromUrl = location.pathname.replace(/^\//, "") || "dashboard";
  const [page, setPageState] = useState(VALID_PAGES.includes(pageFromUrl) ? pageFromUrl : "dashboard");

  // Navigate + update state together
  const setPage = useCallback((p) => {
    setPageState(p);
    navigate("/" + p, { replace: false });
  }, [navigate]);

  // Sync state when user navigates with browser back/forward
  useEffect(() => {
    const p = location.pathname.replace(/^\//, "") || "dashboard";
    if (VALID_PAGES.includes(p) && p !== page) setPageState(p);
  }, [location.pathname]); // eslint-disable-line
  const [clients, setClients] = useState(CLIENTS_INIT);
  const [employees, setEmployees] = useState(EMPLOYEES_INIT);
  const [cycles, setCycles] = useState(CYCLES_INIT);
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [empList, setEmpList] = useState(EMP_DB_INIT);
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [signedOut, setSignedOut] = useState(!localStorage.getItem("epr_token"));
  const [emailTemplates, setEmailTemplates] = useState(EMAIL_TEMPLATES_INIT);
  const [ccList, setCcList] = useState(CC_INIT);
  const [cycleEmailState, setCycleEmailState] = useState(INITIAL_EMAIL_STATE);
  const [bulkRequestedCycles, setBulkRequestedCycles] = useState({});
  const [allReviews, setAllReviews] = useState(ALL_REVIEWS.slice());
  const [scoringHikes, setScoringHikes] = useState({});
  const [scoringLocked, setScoringLocked] = useState({});

  const [adminProfile, setAdminProfile] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    company: "",
    timezone: "Asia/Kolkata",
    avatar: "",
  });

  // ── Load all shared data from backend on mount ─────────────────────────────
  useEffect(() => {
    if (signedOut) return;

    // Clients — fetch list then full data per client (to get stakeholders + departments)
    apiFetch("/api/clients")
      .then(r => r.json())
      .then(async d => {
        if (!d.success || !d.data) return;
        const fullClients = await Promise.all(
          d.data.map(c =>
            apiFetch(`/api/clients/${c.id}`)
              .then(r2 => r2.json())
              .then(d2 => d2.success && d2.data ? normalizeClient(d2.data) : normalizeClient(c))
              .catch(() => normalizeClient(c))
          )
        );
        setClients(fullClients);
      })
      .catch(() => { });

    // Allocations — use as source of truth for employees (has full allocation shapes)
    apiFetch("/api/allocations")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) setEmployees(d.data.map(normalizeAllocEmployee));
      })
      .catch(() => { });

    // Employees full list for EmployeeDatabase page
    apiFetch("/api/employees?limit=500")
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setEmpList(d.data); })
      .catch(() => { });

    // Cycles + email dispatch state for active cycle
    apiFetch("/api/cycles")
      .then(r => r.json())
      .then(d => {
        if (!d.success || !d.data) return;
        const normalized = d.data.map(normalizeCycle);
        setCycles(normalized);
        // Load email dispatch state for the active cycle
        const active = normalized.find(c => c.status === "Active");
        if (active) {
          apiFetch(`/api/email-dispatch/${active.id}`)
            .then(r => r.json())
            .then(d2 => {
              if (d2.success && d2.data && Object.keys(d2.data).length > 0)
                setCycleEmailState(d2.data);
            })
            .catch(() => { });
        }
      })
      .catch(() => { });

    // Reviews — normalize API field names to UI-expected names
    apiFetch("/api/reviews")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) setAllReviews(d.data.map(normalizeReview));
      })
      .catch(() => { });

    // Email templates + CC
    apiFetch("/api/email-templates")
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setEmailTemplates(d.data); })
      .catch(() => { });

    apiFetch("/api/email-templates/cc")
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setCcList(d.data); })
      .catch(() => { });

    // Admin profile
    apiFetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        const u = d.user || d.data;
        if (d.success && u) {
          setAdminProfile(p => ({
            ...p,
            name:        u.name        || p.name,
            email:       u.email       || p.email,
            phone:       u.phone       || p.phone,
            designation: u.designation || p.designation,
            timezone:    u.timezone    || p.timezone,
            company:     u.company     || p.company,
            role:        u.role        || p.role,
            avatar:      (u.avatar_initials) || (u.name || p.name || "?")[0].toUpperCase(),
          }));
        }
      })
      .catch(() => { });
  }, [signedOut]); // eslint-disable-line

  const leakageCount = employees.filter(e => gapPct(e) > 0).length;
  const reviewCount = allReviews.filter(r => ["Pending", "Email Sent", "In Progress", "Overdue"].includes(r.status)).length;
  const notifications = buildNotifications(employees, cycles);

  const onNewEmployee = emp => {
    setEmployees(p => [...p, {
      id: emp.id,
      code: emp.code,
      name: emp.name,
      role: emp.designation || "",
      ctc: emp.ctc || 0,
      allocations: [],
    }]);
  };

  const handleAddCycle = nc => {
    setCycles(p => [...p, nc]);
    setShowNewCycle(false);
    setPage("scheduler");
  };

  const topBarProps = {
    onNewCycle: () => setShowNewCycle(true),
    notifications,
    setPage,
  };

  const pages = {
    dashboard: <Dashboard employees={employees} setPage={setPage} topBarProps={topBarProps} allReviews={allReviews} clients={clients} cycles={cycles} />,
    clients: <ClientConfig clients={clients} setClients={setClients} employees={employees} topBarProps={topBarProps} />,
    resources: <AllocationPage clients={clients} employees={employees} setEmployees={setEmployees} topBarProps={topBarProps}
      onAddNewEmployee={() => { setPage("employees"); setShowAddEmp(true); }} />,
    employees: <EmployeeDatabase topBarProps={topBarProps} empList={empList} setEmpList={setEmpList}
      openAddModal={showAddEmp} onAddModalClosed={() => setShowAddEmp(false)} onNewEmployee={onNewEmployee} />,
    reviews: <Reviews employees={employees} clients={clients} cycles={cycles} cycleEmailState={cycleEmailState} setCycleEmailState={setCycleEmailState} allReviews={allReviews} setAllReviews={setAllReviews} emailTemplates={emailTemplates} scoringLocked={scoringLocked} bulkRequestedCycles={bulkRequestedCycles} setBulkRequestedCycles={setBulkRequestedCycles} topBarProps={topBarProps} />,
    scoring: <Scoring topBarProps={topBarProps} cycles={cycles} setCycles={setCycles} clients={clients} employees={employees} cycleEmailState={cycleEmailState} allReviews={allReviews} setAllReviews={setAllReviews} scoringHikes={scoringHikes} setScoringHikes={setScoringHikes} scoringLocked={scoringLocked} setScoringLocked={setScoringLocked} />,
    scheduler: <Scheduler employees={employees} cycles={cycles} setCycles={setCycles} clients={clients} topBarProps={topBarProps} cycleEmailState={cycleEmailState} setCycleEmailState={setCycleEmailState} />,
    email: <EmailModule cycles={cycles} clients={clients} employees={employees} emailTemplates={emailTemplates} setEmailTemplates={setEmailTemplates} ccList={ccList} setCcList={setCcList} cycleEmailState={cycleEmailState} currentRole={adminProfile.role || "Super Admin"} topBarProps={topBarProps} />,
    reports: (
      <div className="fade-in">
        <TopBar title="Reports" subtitle="Exportable EPR reports — cycle summaries, hike analytics and audit trails" {...topBarProps} />
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: 420, gap: 18, background: "#fff", borderRadius: 14, border: "1.5px dashed #CBD5E1"
        }}>
          <div style={{ fontSize: 48 }}>&#128200;</div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#0D1B2A" }}>Reports — Coming Soon</div>
          <div style={{ fontSize: 13, color: "#64748B", maxWidth: 380, textAlign: "center", lineHeight: 1.7 }}>
            Cycle summary reports, hike distribution analytics, stakeholder response rates and full audit trails will be available here.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {["Cycle Summary", "Hike Analytics", "Stakeholder Report", "Audit Trail", "Export PDF", "Export Excel"].map(r => (
              <span key={r} style={{
                fontSize: 12, fontWeight: 600, background: "#F8FAFC", color: "#475569",
                border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "6px 14px"
              }}>{r}</span>
            ))}
          </div>
        </div>
      </div>
    ),
    settings: <Settings topBarProps={topBarProps} profile={adminProfile} setProfile={setAdminProfile} clients={clients} currentRole={adminProfile.role || "Super Admin"} />,
  };

  return (
    <>
      <FontLink />

      {signedOut ? (
        <LoginScreen onLogin={(tok, user) => {
          setSignedOut(false);
          if (user) setAdminProfile(p => ({
            ...p,
            name: user.name || p.name,
            email: user.email || p.email,
            avatar: (user.name || p.name || "?")[0].toUpperCase(),
          }));
          navigate("/dashboard", { replace: true });
        }} />
      ) : (
        <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
          <Sidebar active={page} setActive={setPage} leakageCount={leakageCount} reviewCount={reviewCount}
            onSignOut={() => { localStorage.removeItem("epr_token"); setSignedOut(true); navigate("/", { replace: true }); }}
            profile={adminProfile} setProfile={setAdminProfile} />
          <main style={{ marginLeft: 236, flex: 1, padding: "28px 32px", minHeight: "100vh" }}>
            {pages[page]}
          </main>
        </div>
      )}

      {showNewCycle && (
        <NewCycleModal
          onAdd={handleAddCycle}
          onClose={() => setShowNewCycle(false)}
          existing={cycles}
        />
      )}
    </>
  );
}
