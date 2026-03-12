import { useState } from "react";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Toast from "../components/Toast";
import { CLIENT_COLORS, gapPct, totalPct } from "../constants";
import { apiFetch } from "../utils/api";

const Reviews = ({ employees, clients, cycles, cycleEmailState, setCycleEmailState, allReviews, emailTemplates, scoringLocked, bulkRequestedCycles, setBulkRequestedCycles, topBarProps }) => {

  // ── Cycle selector — Closed + Active only ───────────────────────────────────
  const dropdownCycles = (cycles || [])
    .filter(c => c.status === "Closed" || c.status === "Active")
    .slice()
    .sort((a, b) => {
      const ord = { "Q1": 1, "Q2": 2, "Q3": 3, "Q4": 4 };
      if (a.year !== b.year) return b.year - a.year;
      return (ord[(b.q || "").split(" ")[0]] || 0) - (ord[(a.q || "").split(" ")[0]] || 0);
    });

  const activeCycle = (cycles || []).find(c => c.status === "Active");
  const [selCycId, setSelCycId] = useState(
    activeCycle ? activeCycle.id : (dropdownCycles.length > 0 ? dropdownCycles[0].id : null)
  );
  const selCycle = (cycles || []).find(c => c.id === selCycId) || null;
  const isClosed = !!(selCycle && selCycle.closed);
  const isActive = !!(selCycle && selCycle.status === "Active");

  // ── Local state ─────────────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState({});
  const [logModal, setLogModal] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [toast, setToast] = useState("")

  // ── Bulk Request Review ──────────────────────────────────────────────────────
  const isBulkDone = !!(bulkRequestedCycles && selCycId && bulkRequestedCycles[selCycId]);
  const bulkDoneAt = isBulkDone ? bulkRequestedCycles[selCycId] : null;
  const bulkEnabled = isActive && !isBulkDone;

  const sendBulkRequestReview = async () => {
    if (!bulkEnabled || !selCycle) return;
    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    let firedCount = 0;
    (employees || []).forEach(emp => {
      (emp.allocations || []).forEach(alloc => {
        const cl = (clients || []).find(c => c.id === alloc.clientId);
        if (!cl) return;
        const shs = getEmpStakeholders(emp, cl);
        shs.forEach(sh => {
          const key = selCycId + "_" + cl.id + "_" + sh.id;
          const es = (cycleEmailState[key] || {});
          // Skip if already requested
          if (es.requestAt) return;
          setCycleEmailState(p => {
            const prev = p[key] || { requestAt: null, reminder1At: null, reminder2At: null, reminder3At: null, logs: [] };
            const newLog = { empId: emp.code, empName: emp.name, type: "Review Request", at: now };
            return { ...p, [key]: { ...prev, requestAt: now, logs: [...(prev.logs || []), newLog] } };
          });
          firedCount++;
        });
      });
    });
    setBulkRequestedCycles(p => ({ ...p, [selCycId]: now }));
    try {
      const res = await apiFetch("/api/reviews/bulk-request", { method: "POST", body: JSON.stringify({ cycle_id: selCycId }) });
      const d = await res.json();
      if (!d.success) { showToast("API error: " + (d.message || "Bulk request issue"), "error"); return; }
    } catch (e) {}
    showToast(firedCount > 0 ? ("Bulk request sent to " + firedCount + " stakeholder(s)") : "All stakeholders already requested — nothing to send");
  };;
  const [search, setSearch] = useState("");

  const [toastType, setToastType] = useState("");
  const showToast = (msg, type = "") => { setToast(msg); setToastType(type); setTimeout(() => { setToast(""); setToastType(""); }, 2800); };

  // ── Email functions — shared state with Scheduler ───────────────────────────
  const sendStakeholderEmail = async (cycId, clId, shId, shName, shEmail, empList, quarter, type) => {
    const key = cycId + "_" + clId + "_" + shId;
    const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const prevEmailState = { ...cycleEmailState };
    setCycleEmailState(p => {
      const prev = p[key] || { requestAt: null, reminder1At: null, reminder2At: null, reminder3At: null, logs: [] };
      const newLogs = [...(prev.logs || []), ...empList.map(emp => ({ empId: emp.code, empName: emp.name, type, at: now }))];
      const patch = { ...prev, logs: newLogs };
      if (type === "Review Request") patch.requestAt = now;
      if (type === "Reminder 1") patch.reminder1At = now;
      if (type === "Reminder 2") patch.reminder2At = now;
      if (type === "Reminder 3") patch.reminder3At = now;
      return { ...p, [key]: patch };
    });
    setPreviewModal(null);
    try {
      const res = await apiFetch(`/api/reviews/${cycId}_${clId}_${shId}/send-email`, { method: "POST", body: JSON.stringify({ type, employee_ids: empList.map(e => e.id) }) });
      const d = await res.json();
      if (!d.success) { setCycleEmailState(prevEmailState); showToast("Error: " + (d.message || "Email send failed"), "error"); return; }
      showToast(type + " sent to " + shName);
    } catch (e) { setCycleEmailState(prevEmailState); showToast("Network error — email not sent", "error"); }
  };

  const openPreview = (cycId, clId, shId, shName, shEmail, empList, type, quarter, deadline) => {
    setPreviewModal({ cycId, clId, shId, shName, shEmail, empList, type, quarter, deadline });
  };

  // ── Review status derivation ─────────────────────────────────────────────────
  const getReviewStatus = (emp, cl, sh) => {
    if (!selCycle) return "Not Started";
    // If this employee's row is locked in Scoring, all their stakeholder rows = Closed
    if (scoringLocked && scoringLocked[selCycle.q] && scoringLocked[selCycle.q][emp.code]) return "Closed";
    const rev = (allReviews || []).find(r =>
      r.empId === emp.code && r.client === cl.name && r.stakeholder === sh.name && r.quarter === selCycle.q
    );
    if (rev) {
      if (rev.status === "Approved") return "Closed";
      if (rev.status === "Submitted") return "Submitted";
      if (rev.status === "In Progress") return "In Progress";
    }
    if (isClosed) return "Closed";
    const key = selCycId + "_" + cl.id + "_" + sh.id;
    const es = cycleEmailState[key] || {};
    if (es.requestAt) return "Initiated";
    return "Not Started";
  };

  // ── Stakeholder resolution for emp×cl ───────────────────────────────────────
  // Rules (in priority order):
  //   1. Explicit alloc.stakeholders assignments → show only those (precise mode)
  //   2. No explicit assignments → structural match with activation gate:
  //      a. Client-level PRIMARY stakeholder → always show (admin can always dispatch)
  //      b. Dept-level stakeholders → only show if activated for THIS specific employee
  //         (has a review record OR per-employee dispatch log entry)
  //         This prevents ghost rows e.g. Lisa Romano (Verizon D4) appearing for
  //         employees she was never assigned to review.
  const getEmpStakeholders = (emp, cl) => {
    const alloc = (emp.allocations || []).find(a => a.clientId === cl.id);
    if (!alloc) return [];
    const active = cl.stakeholders.filter(s => s.active);

    // Explicit per-employee stakeholder assignments — highest priority
    if (alloc.stakeholders && alloc.stakeholders.length > 0) {
      return active.filter(sh => alloc.stakeholders.some(s => s.stakeholderId === sh.id));
    }

    // Structural match with activation gate
    const pid = cl.primaryStakeholderId
      ? cl.primaryStakeholderId
      : ((cl.stakeholders.filter(s => s.active && s.level === "client")[0]) || {}).id;

    const reviews = allReviews || [];

    return active.filter(sh => {
      // Client-level primary — always show; admin needs to be able to dispatch
      if (sh.level === "client") return pid && pid === sh.id;

      // Dept-level — must match dept AND be activated for this specific employee
      if (sh.level === "dept" && sh.deptId === alloc.deptId) {
        if (!selCycle) return true; // closed cycle — show all (historical completeness)
        const hasReview = reviews.some(r =>
          r.empId === emp.code &&
          r.client === cl.name &&
          r.stakeholder === sh.name &&
          r.quarter === selCycle.q
        );
        if (hasReview) return true;
        const key = selCycId + "_" + cl.id + "_" + sh.id;
        const es = cycleEmailState[key] || {};
        return (es.logs || []).some(l => l.empId === emp.code);
      }
      return false;
    });
  };

  // ── Status badge ─────────────────────────────────────────────────────────────
  const STATUS_CLR = {
    "Not Started": { bg: "#F8FAFC", tc: "#94A3B8", bdr: "#E2E8F0" },
    "Initiated": { bg: "#EEF2FF", tc: "#4338CA", bdr: "#C7D2FE" },
    "In Progress": { bg: "#FEF3C7", tc: "#92400E", bdr: "#FDE68A" },
    "Submitted": { bg: "#DBEAFE", tc: "#1E40AF", bdr: "#BFDBFE" },
    "Closed": { bg: "#D1FAE5", tc: "#065F46", bdr: "#A7F3D0" },
  };
  const RevStatusBadge = ({ status }) => {
    const c = STATUS_CLR[status] || STATUS_CLR["Not Started"];
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, background: c.bg, color: c.tc,
        border: "1px solid " + c.bdr, borderRadius: 100, padding: "3px 10px",
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap"
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.tc, display: "inline-block", opacity: .7 }} />
        {status}
      </span>
    );
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const buildCombos = () => {
    const combos = [];
    (employees || []).forEach(emp => {
      (emp.allocations || []).filter(a => a.pct > 0).forEach(alloc => {
        const cl = (clients || []).find(c => c.id === alloc.clientId);
        if (!cl) return;
        getEmpStakeholders(emp, cl).forEach(sh => combos.push({ emp, cl, sh }));
      });
    });
    return combos;
  };
  const combos = buildCombos();
  const totalCombos = combos.length;
  const countNS = combos.filter(x => getReviewStatus(x.emp, x.cl, x.sh) === "Not Started").length;
  const countInit = combos.filter(x => getReviewStatus(x.emp, x.cl, x.sh) === "Initiated").length;
  const countIP = combos.filter(x => getReviewStatus(x.emp, x.cl, x.sh) === "In Progress").length;
  const countSub = combos.filter(x => getReviewStatus(x.emp, x.cl, x.sh) === "Submitted").length;
  const countClosed = combos.filter(x => getReviewStatus(x.emp, x.cl, x.sh) === "Closed").length;
  const completion = totalCombos > 0 ? Math.round(((countSub + countClosed) / totalCombos) * 100) : 0;

  // ── Employee list ─────────────────────────────────────────────────────────────
  const allEmps = employees || [];
  const filteredEmps = allEmps.filter(e =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.code.toLowerCase().includes(search.toLowerCase()) ||
    (e.role || "").toLowerCase().includes(search.toLowerCase())
  );

  const allExpanded = filteredEmps.length > 0 && filteredEmps.every(e => !!expanded[e.id]);
  const toggleAll = () => {
    if (allExpanded) { setExpanded({}); }
    else { const n = {}; filteredEmps.forEach(e => { n[e.id] = true; }); setExpanded(n); }
  };

  const closedRecords = selCycle ? (allReviews || []).filter(r => r.quarter === selCycle.q) : [];

  // ── Template-driven preview — pulls from emailTemplates (same source as Email Module) ──
  const TYPE_TO_TEMPLATE = {
    "Review Request": "request_review",
    "Reminder 1": "reminder_1",
    "Reminder 2": "reminder_2",
    "Reminder 3": "reminder_3",
  };

  const renderPreviewBody = () => {
    if (!previewModal) return "";
    const { shName, empList, type, quarter, deadline } = previewModal;
    const tplType = TYPE_TO_TEMPLATE[type] || "request_review";
    const tplList = emailTemplates || [];
    const tpl = tplList.find(t => t.type === tplType) || tplList[0];
    if (!tpl) return "";
    // Build numbered employee list
    const empListStr = empList.map((e, i) => (i + 1) + ". " + e.name + " (" + e.code + ")").join("\n");
    // Substitute all merge fields
    return tpl.body
      .replace(/\{\{stakeholder_name\}\}/g, shName)
      .replace(/\{\{quarter\}\}/g, quarter)
      .replace(/\{\{employee_list\}\}/g, empListStr)
      .replace(/\{\{deadline\}\}/g, deadline)
      .replace(/\{\{portal_link\}\}/g, "https://portal.dolluz.com/review")
      .replace(/\{\{admin_name\}\}/g, "Dolluz Admin");
  };

  const renderPreviewSubject = () => {
    if (!previewModal) return "";
    const { type, quarter, deadline } = previewModal;
    const tplType = TYPE_TO_TEMPLATE[type] || "request_review";
    const tplList = emailTemplates || [];
    const tpl = tplList.find(t => t.type === tplType) || tplList[0];
    if (!tpl) return "";
    return tpl.subject
      .replace(/\{\{quarter\}\}/g, quarter)
      .replace(/\{\{deadline\}\}/g, deadline);
  };

  return (
    <div className="fade-in">
      <TopBar title="Review Management" subtitle="Employee-first orchestration — track, trigger and manage reviews per stakeholder" {...topBarProps} />

      {/* ── Cycle Selector ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Cycle:</span>
        <select value={selCycId || ""} onChange={e => setSelCycId(e.target.value)}
          style={{
            padding: "8px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 13,
            fontWeight: 600, color: "#0D1B2A", background: "#fff", cursor: "pointer", minWidth: 170
          }}>
          {dropdownCycles.map(c => (
            <option key={c.id} value={c.id}>
              {c.q}{c.status === "Active" ? " — Active" : " — Closed"}
            </option>
          ))}
        </select>
        {selCycle && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, background: isActive ? "#D1FAE5" : "#F1F5F9",
              color: isActive ? "#065F46" : "#64748B",
              border: "1px solid " + (isActive ? "#A7F3D0" : "#E2E8F0"),
              borderRadius: 100, padding: "3px 10px", fontWeight: 700
            }}>
              {isActive ? "LIVE" : "CLOSED"}
            </span>
            <span style={{ fontSize: 11, color: "#64748B", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 100, padding: "3px 10px" }}>
              Deadline: {selCycle.deadline}
            </span>
            {selCycle.r1 && <span style={{ fontSize: 11, color: "#64748B", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 100, padding: "3px 10px" }}>R1: {selCycle.r1}</span>}
            {selCycle.r2 && <span style={{ fontSize: 11, color: "#64748B", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 100, padding: "3px 10px" }}>R2: {selCycle.r2}</span>}
          </div>
        )}
      </div>

      {/* ── Bulk Request Review ── */}
      {selCycle && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <button
            onClick={sendBulkRequestReview}
            disabled={!bulkEnabled}
            title={!isActive ? "Only available for an active cycle" : isBulkDone ? "Bulk request already sent for this cycle" : "Send review request to all stakeholders who have not yet been requested"}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
              border: "1.5px solid " + (bulkEnabled ? "#0D1B2A" : "#E2E8F0"),
              background: bulkEnabled ? "#0D1B2A" : "#F8FAFC",
              color: bulkEnabled ? "#fff" : "#94A3B8",
              fontSize: 12, fontWeight: 700, cursor: bulkEnabled ? "pointer" : "not-allowed",
              opacity: bulkEnabled ? 1 : 0.7, transition: "all .15s"
            }}>
            {"\uD83D\uDCE8"} {isBulkDone ? ("Bulk Requested \u2713 \u00B7 " + bulkDoneAt) : "Bulk Request Review"}
          </button>
          {isBulkDone && (
            <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>
              All pending stakeholders have been notified for this cycle
            </span>
          )}
        </div>
      )}

      {/* ── Stats Bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Total Reviews", value: totalCombos, color: "#0D1B2A", bg: "#F8FAFC" },
          { label: "Not Started", value: countNS, color: "#94A3B8", bg: "#F8FAFC" },
          { label: "Initiated", value: countInit, color: "#4338CA", bg: "#EEF2FF" },
          { label: "In Progress", value: countIP, color: "#92400E", bg: "#FEF3C7" },
          { label: "Submitted", value: countSub, color: "#1E40AF", bg: "#DBEAFE" },
          { label: "Closed", value: countClosed, color: "#065F46", bg: "#D1FAE5" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "12px 14px", border: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search employee, code, role..." style={{ maxWidth: 280, flex: 1 }} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={toggleAll}>
            {allExpanded ? "Collapse All" : "Expand All"}
          </button>
          {!isClosed && (
            <span style={{ fontSize: 12, color: "#E8520A", background: "#FFF5F0", border: "1px solid #FDBA74", borderRadius: 8, padding: "6px 12px", fontWeight: 700 }}>
              {completion}% Complete
            </span>
          )}
        </div>
      </div>

      {/* ════ CLOSED — Read-only table ════ */}
      {isClosed ? (
        <div className="card">
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2A" }}>
              {selCycle ? selCycle.q : ""} — Historical Records ({closedRecords.length} reviews)
            </span>
            <span style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "3px 10px", borderRadius: 100 }}>
              Read-only
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 740 }}>
              <thead><tr><th>Employee</th><th>Client</th><th>Stakeholder</th><th>Status</th><th>Submitted</th><th>Hike Given</th></tr></thead>
              <tbody>
                {closedRecords.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={r.employee} size={28} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.employee}</div>
                          <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'JetBrains Mono',monospace" }}>{r.empId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "#475569" }}>{r.client}</td>
                    <td style={{ fontSize: 12, color: "#475569" }}>{r.stakeholder}</td>
                    <td><Badge status={r.status} /></td>
                    <td style={{ fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{r.submittedAt || "—"}</td>
                    <td>
                      {r.hikeGiven
                        ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#10B981", fontSize: 13 }}>{r.hikeGiven}%</span>
                        : <span style={{ color: "#94A3B8" }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* ════ ACTIVE — Employee accordion ════ */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredEmps.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#94A3B8", fontSize: 13, background: "#fff", borderRadius: 12 }}>
              No employees found.
            </div>
          )}
          {filteredEmps.map(emp => {
            const isExp = !!expanded[emp.id];
            const gap = gapPct(emp);
            const totalAlloc = totalPct(emp);
            const allocatedCl = (emp.allocations || []).filter(a => a.pct > 0);

            // ── Per-client status badges (Problem 2 fix) ────────────────────────
            // Priority order for collapsing multiple stakeholder statuses into one client badge:
            // Overdue > In Progress > Initiated > Submitted > Closed > Not Started
            // (most attention-needed wins)
            const STATUS_PRIORITY = ["Not Started", "Closed", "Submitted", "Initiated", "In Progress", "Overdue"];
            const clientBadges = allocatedCl.map(alloc => {
              const cl = (clients || []).find(c => c.id === alloc.clientId);
              if (!cl) return null;
              const shs = getEmpStakeholders(emp, cl);
              if (shs.length === 0) return null;
              const statuses = shs.map(sh => getReviewStatus(emp, cl, sh));
              // Pick highest-priority (most attention-needed) status across stakeholders
              let badge = "Not Started";
              statuses.forEach(s => {
                if (STATUS_PRIORITY.indexOf(s) > STATUS_PRIORITY.indexOf(badge)) badge = s;
              });
              return { cl, badge, pct: alloc.pct };
            }).filter(Boolean);

            return (
              <div key={emp.id} style={{
                background: "#fff", borderRadius: 12, border: "1.5px solid #E2E8F0",
                boxShadow: "0 1px 4px rgba(0,0,0,.04)", overflow: "hidden"
              }}>

                {/* Employee header */}
                <div style={{
                  padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                  background: isExp ? "#F8FAFF" : "#fff"
                }}
                  onClick={() => setExpanded(p => { const n = { ...p }; n[emp.id] = !n[emp.id]; return n; })}>
                  <Avatar name={emp.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A" }}>{emp.name}</span>
                      <span style={{
                        fontSize: 10, color: "#94A3B8", fontFamily: "'JetBrains Mono',monospace",
                        background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 6, padding: "1px 6px"
                      }}>{emp.code}</span>
                      {/* Per-client status badges */}
                      {clientBadges.length === 0 && <RevStatusBadge status="Not Started" />}
                      {clientBadges.map(cb => {
                        const clColor = cb.cl.color || cb.cl.color_hex || CLIENT_COLORS[cb.cl.id] || "#64748B";
                        const sc = STATUS_CLR[cb.badge] || STATUS_CLR["Not Started"];
                        return (
                          <span key={cb.cl.id} style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 11, fontWeight: 700, borderRadius: 100, padding: "3px 9px 3px 7px",
                            background: sc.bg, color: sc.tc, border: "1px solid " + sc.bdr,
                            whiteSpace: "nowrap"
                          }}>
                            <span style={{
                              width: 7, height: 7, borderRadius: "50%", background: clColor,
                              display: "inline-block", flexShrink: 0
                            }} />
                            {cb.cl.name.split(" ")[0]}
                            <span style={{ opacity: .6, fontWeight: 500, marginLeft: 1 }}>·</span>
                            {cb.badge}
                          </span>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
                      {emp.role}
                      {allocatedCl.length > 0
                        ? " · " + allocatedCl.length + " client" + (allocatedCl.length !== 1 ? "s" : "") + " · " + totalAlloc + "% allocated"
                        : <span style={{ color: "#EF4444", fontWeight: 600 }}> · 0% allocated — not in scope</span>}
                      {gap > 0 && allocatedCl.length > 0 && <span style={{ color: "#F59E0B", fontWeight: 700 }}> · ⚠ {gap}% unallocated</span>}
                    </div>
                  </div>
                  {gap > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, background: "#FEF3C7", color: "#92400E",
                      border: "1px solid #FDE68A", borderRadius: 100, padding: "3px 9px", whiteSpace: "nowrap"
                    }}>
                      {gap}% pending
                    </span>
                  )}
                  <span style={{ fontSize: 16, color: "#94A3B8", userSelect: "none" }}>{isExp ? "▲" : "▼"}</span>
                </div>

                {/* Expanded body */}
                {isExp && (
                  <div style={{ borderTop: "1px solid #F1F5F9", background: "#FAFBFF" }}>

                    {allocatedCl.length === 0 && (
                      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 10, background: "#FEF2F2" }}>
                        <span style={{ fontSize: 18 }}>&#9888;</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>No Allocation — Review Not Captured</div>
                          <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 2 }}>
                            Assign {emp.name} to a client in the Allocation page to include them in this cycle.
                          </div>
                        </div>
                      </div>
                    )}

                    {gap > 0 && allocatedCl.length > 0 && (
                      <div style={{ padding: "9px 20px", display: "flex", alignItems: "center", gap: 8, background: "#FFFBEB", borderBottom: "1px solid #FDE68A" }}>
                        <span>&#9888;</span>
                        <span style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>
                          {gap}% allocation pending — review not captured for remaining {gap}% of {emp.name}'s billable scope
                        </span>
                      </div>
                    )}

                    {allocatedCl.map((alloc, aIdx) => {
                      const cl = (clients || []).find(c => c.id === alloc.clientId);
                      if (!cl) return null;
                      const clColor = cl.color || cl.color_hex || CLIENT_COLORS[cl.id] || "#64748B";
                      const shs = getEmpStakeholders(emp, cl);

                      return (
                        <div key={alloc.clientId} style={{ borderBottom: aIdx < allocatedCl.length - 1 ? "1.5px solid #E2E8F0" : "none" }}>

                          {/* Client bar */}
                          <div style={{
                            padding: "11px 20px", display: "flex", alignItems: "center", gap: 10,
                            background: "#fff", borderTop: "1px solid #F1F5F9"
                          }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: clColor, flexShrink: 0 }} />
                            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: "#0D1B2A", flex: 1 }}>
                              {cl.name}
                            </span>
                            <span style={{
                              fontSize: 11, fontWeight: 700, background: clColor + "22",
                              color: clColor, border: "1px solid " + clColor + "66", borderRadius: 100, padding: "2px 9px"
                            }}>
                              {alloc.pct}%
                            </span>
                            {shs.length === 0 && (
                              <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>No active stakeholders configured</span>
                            )}
                          </div>

                          {/* Stakeholder rows */}
                          {shs.map((sh, shIdx) => {
                            const shKey = selCycId + "_" + cl.id + "_" + sh.id;
                            const shState = cycleEmailState[shKey] || { requestAt: null, reminder1At: null, reminder2At: null, reminder3At: null, logs: [] };
                            const reqSent = !!shState.requestAt;
                            const r1Sent = !!shState.reminder1At;
                            const r2Sent = !!shState.reminder2At;
                            const r3Sent = !!shState.reminder3At;
                            const hasR1 = !!(selCycle && selCycle.r1);
                            const hasR2 = !!(selCycle && selCycle.r2);
                            const hasR3 = !!(selCycle && selCycle.r3);
                            const revSt = getReviewStatus(emp, cl, sh);
                            // Disable all actions once Submitted or Closed — no reminders needed
                            const actionDisabled = revSt === "Submitted" || revSt === "Closed";
                            const empLogs = (shState.logs || []).filter(l => l.empId === emp.code);

                            return (
                              <div key={sh.id} style={{
                                padding: "12px 20px 14px 36px",
                                background: shIdx % 2 === 0 ? "#FAFBFF" : "#F8FAFC",
                                borderTop: "1px dashed #E2E8F0"
                              }}>

                                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                                  <Avatar name={sh.name} size={28} />
                                  <div style={{ flex: 1, minWidth: 150 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{sh.name}</div>
                                    <div style={{ fontSize: 11, color: "#64748B" }}>{sh.designation} · {sh.email}</div>
                                  </div>

                                  <RevStatusBadge status={revSt} />

                                  {/* Email state machine */}
                                  {isActive && !actionDisabled && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>

                                      {/* Request Review */}
                                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {!reqSent && (
                                          <button title="Preview email"
                                            onClick={() => openPreview(selCycId, cl.id, sh.id, sh.name, sh.email, [emp], "Review Request", selCycle.q, selCycle.deadline)}
                                            style={{ background: "none", border: "1.5px solid #CBD5E1", borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontSize: 13, color: "#64748B" }}>
                                            &#128065;
                                          </button>
                                        )}
                                        {reqSent ? (
                                          <span style={{
                                            fontSize: 11, color: "#10B981", fontWeight: 700, background: "#F0FDF4",
                                            border: "1px solid #BBF7D0", borderRadius: 100, padding: "3px 9px", whiteSpace: "nowrap"
                                          }}>
                                            &#10003; Requested · {shState.requestAt}
                                          </span>
                                        ) : (
                                          <button className="btn-primary" style={{ fontSize: 11, padding: "5px 12px", whiteSpace: "nowrap" }}
                                            onClick={() => sendStakeholderEmail(selCycId, cl.id, sh.id, sh.name, sh.email, [emp], selCycle.q, "Review Request")}>
                                            Request Review
                                          </button>
                                        )}
                                      </div>

                                      {/* R1 */}
                                      {hasR1 && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          {reqSent && !r1Sent && (
                                            <button title="Preview R1"
                                              onClick={() => openPreview(selCycId, cl.id, sh.id, sh.name, sh.email, [emp], "Reminder 1", selCycle.q, selCycle.deadline)}
                                              style={{ background: "none", border: "1.5px solid #CBD5E1", borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontSize: 13, color: "#64748B" }}>
                                              &#128065;
                                            </button>
                                          )}
                                          {r1Sent ? (
                                            <span style={{
                                              fontSize: 11, color: "#F59E0B", fontWeight: 700, background: "#FFFBEB",
                                              border: "1px solid #FDE68A", borderRadius: 100, padding: "3px 9px", whiteSpace: "nowrap"
                                            }}>
                                              &#10003; R1 · {shState.reminder1At}
                                            </span>
                                          ) : (
                                            <button className="btn-secondary" style={{
                                              fontSize: 11, padding: "5px 12px", whiteSpace: "nowrap",
                                              ...(reqSent ? {} : { opacity: 0.4, cursor: "not-allowed" })
                                            }}
                                              disabled={!reqSent}
                                              onClick={() => sendStakeholderEmail(selCycId, cl.id, sh.id, sh.name, sh.email, [emp], selCycle.q, "Reminder 1")}>
                                              Send R1
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      {/* R2 */}
                                      {hasR2 && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          {reqSent && r1Sent && !r2Sent && (
                                            <button title="Preview R2"
                                              onClick={() => openPreview(selCycId, cl.id, sh.id, sh.name, sh.email, [emp], "Reminder 2", selCycle.q, selCycle.deadline)}
                                              style={{ background: "none", border: "1.5px solid #CBD5E1", borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontSize: 13, color: "#64748B" }}>
                                              &#128065;
                                            </button>
                                          )}
                                          {r2Sent ? (
                                            <span style={{
                                              fontSize: 11, color: "#8B5CF6", fontWeight: 700, background: "#F5F3FF",
                                              border: "1px solid #DDD6FE", borderRadius: 100, padding: "3px 9px", whiteSpace: "nowrap"
                                            }}>
                                              &#10003; R2 · {shState.reminder2At}
                                            </span>
                                          ) : (
                                            <button className="btn-secondary" style={{
                                              fontSize: 11, padding: "5px 12px", whiteSpace: "nowrap",
                                              ...((reqSent && r1Sent) ? {} : { opacity: 0.4, cursor: "not-allowed" })
                                            }}
                                              disabled={!(reqSent && r1Sent)}
                                              onClick={() => sendStakeholderEmail(selCycId, cl.id, sh.id, sh.name, sh.email, [emp], selCycle.q, "Reminder 2")}>
                                              Send R2
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      {/* R3 */}
                                      {hasR3 && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                          {reqSent && r1Sent && r2Sent && !r3Sent && (
                                            <button title="Preview R3"
                                              onClick={() => openPreview(selCycId, cl.id, sh.id, sh.name, sh.email, [emp], "Reminder 3", selCycle.q, selCycle.deadline)}
                                              style={{ background: "none", border: "1.5px solid #CBD5E1", borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontSize: 13, color: "#64748B" }}>
                                              &#128065;
                                            </button>
                                          )}
                                          {r3Sent ? (
                                            <span style={{
                                              fontSize: 11, color: "#EF4444", fontWeight: 700, background: "#FEF2F2",
                                              border: "1px solid #FECACA", borderRadius: 100, padding: "3px 9px", whiteSpace: "nowrap"
                                            }}>
                                              &#10003; R3 · {shState.reminder3At}
                                            </span>
                                          ) : (
                                            <button className="btn-secondary" style={{
                                              fontSize: 11, padding: "5px 12px", whiteSpace: "nowrap",
                                              ...((reqSent && r1Sent && r2Sent) ? {} : { opacity: 0.4, cursor: "not-allowed" })
                                            }}
                                              disabled={!(reqSent && r1Sent && r2Sent)}
                                              onClick={() => sendStakeholderEmail(selCycId, cl.id, sh.id, sh.name, sh.email, [emp], selCycle.q, "Reminder 3")}>
                                              Send R3
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      {/* Log */}
                                      <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }}
                                        onClick={() => setLogModal({ emp, cl, sh, key: shKey, state: shState })}>
                                        &#128203; Log ({empLogs.length})
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ════ Log Modal ════ */}
      {logModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setLogModal(null); }}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "linear-gradient(135deg,#0D1B2A,#1E3A5F)", borderRadius: "14px 14px 0 0"
            }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff" }}>
                  Email Log — {logModal.emp.name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 2 }}>
                  {logModal.cl.name} · {logModal.sh.name}
                </div>
              </div>
              <button onClick={() => setLogModal(null)} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "5px 11px", fontSize: 18, cursor: "pointer" }}>&#215;</button>
            </div>
            <div style={{ padding: "20px 24px", maxHeight: 420, overflowY: "auto" }}>
              {(() => {
                const es = cycleEmailState[logModal.key] || {};
                const timeline = [];
                if (es.requestAt) timeline.push({ type: "Review Request", at: es.requestAt, color: "#10B981", bg: "#F0FDF4", bdr: "#BBF7D0" });
                if (es.reminder1At) timeline.push({ type: "Reminder 1", at: es.reminder1At, color: "#F59E0B", bg: "#FFFBEB", bdr: "#FDE68A" });
                if (es.reminder2At) timeline.push({ type: "Reminder 2", at: es.reminder2At, color: "#8B5CF6", bg: "#F5F3FF", bdr: "#DDD6FE" });
                if (es.reminder3At) timeline.push({ type: "Reminder 3", at: es.reminder3At, color: "#EF4444", bg: "#FEF2F2", bdr: "#FECACA" });
                const pending = [];
                if (!es.requestAt) pending.push("Review Request");
                if (selCycle && selCycle.r1 && !es.reminder1At) pending.push("Reminder 1");
                if (selCycle && selCycle.r2 && !es.reminder2At) pending.push("Reminder 2");
                if (selCycle && selCycle.r3 && !es.reminder3At) pending.push("Reminder 3");

                if (timeline.length === 0) return (
                  <div>
                    <div style={{ textAlign: "center", padding: "24px 0", color: "#94A3B8", fontSize: 13 }}>No emails sent yet.</div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Pending</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {pending.map(p => (
                          <span key={p} style={{ fontSize: 11, background: "#F1F5F9", color: "#64748B", border: "1px dashed #CBD5E1", borderRadius: 100, padding: "3px 9px" }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );

                return (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>Sent</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {timeline.map((t, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          background: t.bg, border: "1px solid " + t.bdr, borderRadius: 9, padding: "10px 14px"
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.type}</div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>To: {logModal.sh.name}</div>
                          </div>
                          <div style={{ fontSize: 11, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{t.at}</div>
                        </div>
                      ))}
                    </div>
                    {pending.length > 0 ? (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Pending</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {pending.map(p => (
                            <span key={p} style={{ fontSize: 11, background: "#F1F5F9", color: "#64748B", border: "1px dashed #CBD5E1", borderRadius: 100, padding: "3px 9px" }}>{p}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        fontSize: 12, color: "#10B981", fontWeight: 700, marginTop: 12, padding: "8px 12px",
                        background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8
                      }}>
                        &#10003; All configured emails sent
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div style={{ padding: "0 24px 20px" }}>
              <button className="btn-secondary" style={{ width: "100%", justifyContent: "center", fontSize: 13 }} onClick={() => setLogModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ Preview Modal ════ */}
      {previewModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPreviewModal(null); }}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "linear-gradient(135deg,#0D1B2A,#1E3A5F)", borderRadius: "14px 14px 0 0"
            }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff" }}>Email Preview</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 2 }}>{previewModal.type} · {previewModal.quarter}</div>
              </div>
              <button onClick={() => setPreviewModal(null)} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "5px 11px", fontSize: 18, cursor: "pointer" }}>&#215;</button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px", marginBottom: 14, fontSize: 12 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#94A3B8", fontWeight: 600, minWidth: 40 }}>To:</span>
                  <span>{previewModal.shName} &lt;{previewModal.shEmail}&gt;</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#94A3B8", fontWeight: 600, minWidth: 40 }}>CC:</span>
                  <span>admin@dolluz.com</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ color: "#94A3B8", fontWeight: 600, minWidth: 40 }}>Sub:</span>
                  <span style={{ fontWeight: 600 }}>{renderPreviewSubject()}</span>
                </div>
              </div>
              <pre style={{
                fontSize: 12, color: "#1E293B", lineHeight: 1.7, whiteSpace: "pre-wrap",
                background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px",
                maxHeight: 240, overflowY: "auto", fontFamily: "'DM Sans',sans-serif", margin: 0
              }}>
                {renderPreviewBody()}
              </pre>
            </div>
            <div style={{ padding: "0 24px 20px", display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12 }} onClick={() => setPreviewModal(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}
                onClick={() => sendStakeholderEmail(previewModal.cycId, previewModal.clId, previewModal.shId,
                  previewModal.shName, previewModal.shEmail, previewModal.empList, previewModal.quarter, previewModal.type)}>
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} type={toastType} />
      )}
    </div>
  );
};

export default Reviews;
