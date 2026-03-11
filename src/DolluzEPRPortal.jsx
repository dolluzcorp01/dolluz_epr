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
import Reports from "./pages/Reports";
import { gapPct, buildNotifications } from "./constants";
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
    domains: (c.domains || []).map(d => typeof d === "string" ? { id: d, domain: d } : d),
    domain: c.primary_domain || c.domain || "",
  };
}

function normalizeCycle(c) {
  const closed = Boolean(c.closed);
  return {
    ...c,
    q: c.quarter_label ?? c.q ?? "",
    quarter: c.quarter_num ?? c.quarter ?? 0,
    start: c.start_date ?? c.start ?? "",
    r1: c.r1_date ?? c.r1 ?? "",
    r2: c.r2_date ?? c.r2 ?? "",
    sent: Number(c.sent_count ?? c.sent ?? 0),
    submitted: Number(c.submitted_count ?? c.submitted ?? 0),
    closed,
    // Derive status so downstream consumers can use c.status === "Active"
    status: c.status ?? (closed ? "Closed" : "Active"),
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

// ── Employee list normalizer (list endpoint returns snake_case) ────────────────
function normalizeEmpListItem(e) {
  return {
    ...e,
    designation: e.designation || e.role || "",
    officialEmail: e.official_email || e.officialEmail || "",
    personalEmail: e.personal_email || e.personalEmail || "",
    primaryPhone: e.primary_phone || e.primaryPhone || "",
    secondaryPhone: e.secondary_phone || e.secondaryPhone || "",
    bloodGroup: e.blood_group || e.bloodGroup || "",
    joinDate: e.joining_date
      ? String(e.joining_date).split("T")[0]
      : (e.joinDate || ""),
    reportingManager: e.reporting_manager || e.reportingManager || "",
    status: e.active != null
      ? (Number(e.active) ? "Active" : "Inactive")
      : (e.status || "Active"),
    currentAddr: e.currentAddr || { line1: "", line2: "", city: "", state: "", pin: "" },
    permanentAddr: e.permanentAddr || { line1: "", line2: "", city: "", state: "", pin: "" },
    education: Array.isArray(e.education) ? e.education : [],
    workHistory: Array.isArray(e.workHistory) ? e.workHistory : [],
    skills: Array.isArray(e.skills)
      ? e.skills.map(s => typeof s === "string" ? s : (s.skill_name || ""))
      : [],
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

  const [signedOut, setSignedOut] = useState(!localStorage.getItem("epr_token"));

  // Sync state when user navigates with browser back/forward
  // Also handle /login URL: redirect to /dashboard if signed in, else show LoginScreen
  useEffect(() => {
    const p = location.pathname.replace(/^\//, "") || "dashboard";
    if (p === "login") {
      if (!signedOut) navigate("/dashboard", { replace: true });
      return;
    }
    if (VALID_PAGES.includes(p) && p !== page) setPageState(p);
  }, [location.pathname, signedOut]); // eslint-disable-line react-hooks/exhaustive-deps
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [empList, setEmpList] = useState([]);
  const [showAddEmp, setShowAddEmp] = useState(false);
  // Show loading spinner on hard-reload when already authenticated; for post-login flow
  // maybeReady() inside the data-load effect will clear this.
  const [appLoading, setAppLoading] = useState(!!localStorage.getItem("epr_token"));
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [ccList, setCcList] = useState([]);
  const [cycleEmailState, setCycleEmailState] = useState({});
  const [bulkRequestedCycles, setBulkRequestedCycles] = useState({});
  const [allReviews, setAllReviews] = useState([]);
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

    let clientsDone = false;
    let allocsDone = false;
    const maybeReady = () => { if (clientsDone && allocsDone) setAppLoading(false); };

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
      .catch(() => { })
      .finally(() => { clientsDone = true; maybeReady(); });

    // Allocations — use as source of truth for employees (has full allocation shapes)
    apiFetch("/api/allocations")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) setEmployees(d.data.map(normalizeAllocEmployee));
      })
      .catch(() => { })
      .finally(() => { allocsDone = true; maybeReady(); });

    // Employees full list for EmployeeDatabase page
    apiFetch("/api/employees?limit=500")
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setEmpList(d.data.map(normalizeEmpListItem)); })
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
            name: u.name || p.name,
            email: u.email || p.email,
            phone: u.phone || p.phone,
            designation: u.designation || p.designation,
            timezone: u.timezone || p.timezone,
            company: u.company || p.company,
            role: u.role || p.role,
            avatar: (u.avatar_initials) || (u.name || p.name || "?")[0].toUpperCase(),
          }));
        }
      })
      .catch(() => { });
  }, [signedOut]); // eslint-disable-line

  const leakageCount = employees.filter(e => gapPct(e) > 0).length;
  const reviewCount = allReviews.filter(r => ["Pending", "Email Sent", "In Progress", "Overdue"].includes(r.status)).length;
  const notifications = buildNotifications(employees, cycles, allReviews);

  const onNewEmployee = emp => {
    // Update allocation employees list (used by Resources / Reviews / Scoring)
    setEmployees(p => [...p, {
      id: emp.id,
      code: emp.code,
      name: emp.name,
      role: emp.designation || "",
      ctc: emp.ctc || 0,
      allocations: [],
    }]);
    // Also update the full employee list so EmployeeDatabase reflects the new row immediately
    setEmpList(p => [...p, normalizeEmpListItem(emp)]);
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
    clients: <ClientConfig clients={clients} setClients={setClients} employees={employees} allReviews={allReviews} topBarProps={topBarProps} />,
    resources: <AllocationPage clients={clients} employees={employees} setEmployees={setEmployees} topBarProps={topBarProps}
      onAddNewEmployee={() => { setPage("employees"); setShowAddEmp(true); }} />,
    employees: <EmployeeDatabase topBarProps={topBarProps} empList={empList} setEmpList={setEmpList}
      openAddModal={showAddEmp} onAddModalClosed={() => setShowAddEmp(false)} onNewEmployee={onNewEmployee} />,
    reviews: <Reviews employees={employees} clients={clients} cycles={cycles} cycleEmailState={cycleEmailState} setCycleEmailState={setCycleEmailState} allReviews={allReviews} setAllReviews={setAllReviews} emailTemplates={emailTemplates} scoringLocked={scoringLocked} bulkRequestedCycles={bulkRequestedCycles} setBulkRequestedCycles={setBulkRequestedCycles} topBarProps={topBarProps} />,
    scoring: <Scoring topBarProps={topBarProps} cycles={cycles} setCycles={setCycles} clients={clients} employees={employees} cycleEmailState={cycleEmailState} allReviews={allReviews} setAllReviews={setAllReviews} scoringHikes={scoringHikes} setScoringHikes={setScoringHikes} scoringLocked={scoringLocked} setScoringLocked={setScoringLocked} />,
    scheduler: <Scheduler employees={employees} cycles={cycles} setCycles={setCycles} clients={clients} topBarProps={topBarProps} cycleEmailState={cycleEmailState} setCycleEmailState={setCycleEmailState} />,
    email: <EmailModule cycles={cycles} clients={clients} employees={employees} emailTemplates={emailTemplates} setEmailTemplates={setEmailTemplates} ccList={ccList} setCcList={setCcList} cycleEmailState={cycleEmailState} currentRole={adminProfile.role || "Super Admin"} topBarProps={topBarProps} />,
    reports: <Reports topBarProps={topBarProps} employees={employees} allReviews={allReviews} clients={clients} cycles={cycles} />,
    settings: <Settings topBarProps={topBarProps} profile={adminProfile} setProfile={setAdminProfile} clients={clients} currentRole={adminProfile.role || "Super Admin"} />,
  };

  return (
    <>
      <FontLink />

      {signedOut ? (
        <LoginScreen onLogin={(tok, user) => {
          // Do NOT set appLoading false here — the data-load useEffect
          // (triggered by setSignedOut(false)) will call setAppLoading(false)
          // via maybeReady() once clients + allocs are fetched.
          setAppLoading(true);
          setSignedOut(false);
          if (user) setAdminProfile(p => ({
            ...p,
            name: user.name || p.name,
            email: user.email || p.email,
            avatar: (user.name || p.name || "?")[0].toUpperCase(),
          }));
          navigate("/dashboard", { replace: true });
        }} />
      ) : appLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F0F4F8", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "4px solid #E8520A", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>Loading portal…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: "flex", minHeight: "100vh", background: "#F0F4F8" }}>
          <Sidebar active={page} setActive={setPage} leakageCount={leakageCount} reviewCount={reviewCount}
            onSignOut={() => { localStorage.removeItem("epr_token"); setSignedOut(true); setAppLoading(false); navigate("/", { replace: true }); }}
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