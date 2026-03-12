import { useState } from "react";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Toast from "../components/Toast";
import { QUARTER_DEF, CLIENT_COLORS, uid } from "../constants";
import FieldRow from "../components/FieldRow";
import { apiFetch } from "../utils/api";

const NewCycleModal = ({ onAdd, onClose, existing }) => {
  const [f, setF] = useState({ year: new Date().getFullYear() + 1, quarter: "", start: "", deadline: "", reminders: ["", ""] });
  const [touched, setTouched] = useState(false);
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));

  const yr = parseInt(f.year);
  const usedQ = existing.filter(c => c.year === yr).map(c => c.quarter);

  // When year changes — reset everything
  const handleYearChange = (v) => setF({ year: v, quarter: "", start: "", deadline: "", reminders: ["", ""] });

  // When quarter is selected — AUTO-POPULATE start and deadline
  const handleQuarterChange = (v) => {
    if (!v) { upd("quarter", ""); return; }
    const q = parseInt(v);
    const def = QUARTER_DEF[q];
    setF(p => ({ ...p, quarter: v, start: `${yr}-${def.start}`, deadline: `${yr}-${def.end}`, reminders: ["", ""] }));
  };

  // ── Dynamic reminder handlers ────────────────────────────────────────────
  const addReminder = () => setF(p => ({ ...p, reminders: [...p.reminders, ""] }));
  const removeReminder = (i) => setF(p => ({ ...p, reminders: p.reminders.filter((_, j) => j !== i) }));
  const updReminder = (i, v) => setF(p => ({ ...p, reminders: p.reminders.map((r, j) => j === i ? v : r) }));

  // ── Validation ───────────────────────────────────────────────────────────
  const getErrors = () => {
    const errs = [];
    if (!f.quarter) { errs.push("Please select a quarter."); return errs; }
    if (!f.start) { errs.push("Start Date is required."); return errs; }
    if (!f.deadline) { errs.push("Deadline is required."); return errs; }

    const startD = new Date(f.start);
    const deadlineD = new Date(f.deadline);
    const q = parseInt(f.quarter);
    const def = QUARTER_DEF[q];

    if (startD.getFullYear() !== yr) errs.push(`Start Date must be in ${yr} — found ${startD.getFullYear()}.`);
    if (deadlineD.getFullYear() !== yr) errs.push(`Deadline must be in ${yr} — found ${deadlineD.getFullYear()}.`);
    if (deadlineD <= startD) errs.push("Deadline must be after Start Date.");

    const qStartBound = new Date(`${yr}-${def.start}`);
    const qEndBound = new Date(`${yr}-${def.end}`);
    if (startD < qStartBound || startD > qEndBound) errs.push(`Start Date must fall within ${def.months} ${yr}.`);
    if (deadlineD < qStartBound || deadlineD > qEndBound) errs.push(`Deadline must fall within ${def.months} ${yr}.`);

    // Validate each filled reminder — each must be > start, < deadline, and > previous filled reminder
    let lastFilledD = startD;
    let lastFilledIdx = -1;
    f.reminders.forEach((r, i) => {
      if (!r) return;
      const rD = new Date(r);
      if (rD <= startD) errs.push(`Reminder ${i + 1} must be after Start Date.`);
      if (rD >= deadlineD) errs.push(`Reminder ${i + 1} must be before Deadline.`);
      if (lastFilledIdx >= 0 && rD <= lastFilledD) errs.push(`Reminder ${i + 1} must be after Reminder ${lastFilledIdx + 1}.`);
      lastFilledD = rD;
      lastFilledIdx = i;
    });

    return errs;
  };

  const errors = getErrors();
  const isValid = errors.length === 0;

  const submit = async () => {
    setTouched(true);
    if (!isValid) return;
    const q = parseInt(f.quarter);
    const filled = f.reminders.filter(r => !!r);
    const newCycle = {
      id: "CY" + uid(),
      q: `Q${q} ${yr}`,
      year: yr, quarter: q,
      start: f.start, deadline: f.deadline,
      r1: filled[0] || "", r2: filled[1] || "",
      reminders: filled,
      status: "Draft", sent: 0, submitted: 0, closed: false, emailHistory: []
    };
    onAdd(newCycle);
    try {
      const res = await apiFetch("/api/cycles", { method: "POST", body: JSON.stringify({ quarter_label: newCycle.q, start_date: newCycle.start, end_date: newCycle.deadline || newCycle.deadline, deadline: newCycle.deadline }) });
      const d = await res.json();
      if (d.success && d.data) { /* ID updated */ }
    } catch (e) {}
  };

  const selDef = f.quarter ? QUARTER_DEF[parseInt(f.quarter)] : null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        {/* Header */}
        <div style={{
          padding: "22px 28px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "linear-gradient(135deg,#0D1B2A,#1E3A5F)", borderRadius: "14px 14px 0 0"
        }}>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 17, color: "#fff" }}>Create New Cycle</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 }}>Select year & quarter — dates auto-fill instantly</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "5px 11px", fontSize: 18, cursor: "pointer" }}>&#215;</button>
        </div>

        <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Year + Quarter */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldRow label="Year">
              <input className="inp" type="number" value={f.year}
                onChange={e => handleYearChange(e.target.value)} min={2025} max={2035}
                onKeyDown={(e) => { if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault(); }} />
            </FieldRow>
            <FieldRow label="Quarter *">
              <select className="inp" value={f.quarter} onChange={e => handleQuarterChange(e.target.value)}>
                <option value="">— Select quarter —</option>
                {[1, 2, 3, 4].map(q => {
                  const taken = usedQ.includes(q);
                  return (
                    <option key={q} value={q} disabled={taken}>
                      {QUARTER_DEF[q].label}{taken ? " · exists" : ""}
                    </option>
                  );
                })}
              </select>
            </FieldRow>
          </div>

          {/* Auto-fill confirmation pill */}
          {selDef && f.start && (
            <div style={{
              background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8,
              padding: "10px 14px", fontSize: 12, color: "#1E40AF", display: "flex", alignItems: "center", gap: 8
            }}>
              <span>📅</span>
              <span>Auto-set: <strong>{f.start}</strong> to <strong>{f.deadline}</strong>
                <span style={{ marginLeft: 8, opacity: .65 }}>({selDef.months} {yr})</span>
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#60A5FA" }}>Adjustable below</span>
            </div>
          )}

          {/* Start + Deadline */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldRow label="Start Date *">
              <input className="inp" type="date" value={f.start} onChange={e => upd("start", e.target.value)} onClick={(e) => { e.target.showPicker?.(); }} />
            </FieldRow>
            <FieldRow label="Deadline *">
              <input className="inp" type="date" value={f.deadline} onChange={e => upd("deadline", e.target.value)} onClick={(e) => { e.target.showPicker?.(); }} />
            </FieldRow>
          </div>

          {/* Dynamic Reminders */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>
                Reminders
                <span style={{ marginLeft: 6, fontSize: 11, color: "#94A3B8", fontWeight: 400, textTransform: "none" }}>
                  ({f.reminders.filter(r => r).length} set · optional)
                </span>
              </label>
              <button onClick={addReminder} style={{
                background: "#FFF5F0", border: "1.5px solid #FED7AA", borderRadius: 8,
                color: "#E8520A", fontSize: 11, fontWeight: 700, padding: "4px 10px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4
              }}>
                &#43; Add Reminder
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {f.reminders.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%", background: r ? "#E8520A" : "#F1F5F9",
                    color: r ? "#fff" : "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, flexShrink: 0
                  }}>R{i + 1}</span>
                  <input className="inp" type="date" value={r} onChange={e => updReminder(i, e.target.value)}
                    style={{ flex: 1, borderColor: r ? "#FED7AA" : "" }} onClick={(e) => { e.target.showPicker?.(); }} />
                  {f.reminders.length > 1 && (
                    <button onClick={() => removeReminder(i)} style={{
                      background: "none", border: "1.5px solid #FCA5A5", borderRadius: 6,
                      color: "#EF4444", width: 26, height: 26, cursor: "pointer", fontSize: 14, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>&#215;</button>
                  )}
                </div>
              ))}
            </div>
            {f.reminders.length === 0 && (
              <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "8px 0" }}>
                No reminders added. Click "+ Add Reminder" to schedule automated nudges.
              </div>
            )}
          </div>

          {/* Info banner */}
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#166534" }}>
            Cycle saves as <strong>Draft</strong>. Activate only after the quarter start date — early activation is blocked.
          </div>

          {/* Validation errors */}
          {touched && errors.length > 0 && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px" }}>
              {errors.map((e, i) => (
                <div key={i} style={{
                  fontSize: 12, color: "#EF4444", display: "flex", alignItems: "flex-start", gap: 6,
                  marginBottom: i < errors.length - 1 ? 4 : 0
                }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}>&#9679;</span> {e}
                </div>
              ))}
            </div>
          )}
          {touched && isValid && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#166534" }}>
              ✓ All fields valid — ready to create.
            </div>
          )}
        </div>

        <div style={{ padding: "0 28px 24px", display: "flex", gap: 10 }}>
          <button className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: 14 }} onClick={submit}>
            Create Cycle
          </button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
const Scheduler = ({ employees, cycles, setCycles, clients, topBarProps, cycleEmailState, setCycleEmailState }) => {
  const allYears = [...new Set((cycles || []).map(c => c.year))].sort().reverse();
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [histOpen, setHistOpen] = useState({});
  const [toast, setToast] = useState("");
  const [previewModal, setPreviewModal] = useState(null);
  const [shLogOpen, setShLogOpen] = useState({});
  const [toastType, setToastType] = useState("");
  const showToast = (msg, type = "") => { setToast(msg); setToastType(type); setTimeout(() => { setToast(""); setToastType(""); }, 2800); };

  const togExp = id => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const togHist = id => setHistOpen(p => ({ ...p, [id]: !p[id] }));
  const togShLog = key => setShLogOpen(p => ({ ...p, [key]: !p[key] }));
  const updCyc = (id, fld, v) => setCycles(p => p.map(c => c.id === id ? { ...c, [fld]: v } : c));
  const closeCyc = async id => {
    setCycles(p => p.map(c => c.id === id ? { ...c, status: "Closed", closed: true } : c)); showToast("Cycle closed");
    try { await apiFetch(`/api/cycles/${id}/close`, { method: "POST" }); } catch (e) {}
  };

  const typeToField = { "Review Request": "requestAt", "Reminder 1": "reminder1At", "Reminder 2": "reminder2At", "Reminder 3": "reminder3At" };

  const sendStakeholderEmail = async (cycId, clId, shId, shName, shEmail, empList, quarter, type) => {
    const key = cycId + "_" + clId + "_" + shId;
    const field = typeToField[type] || "requestAt";
    const now = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    const newLogs = empList.map(emp => ({ empId: emp.id, empName: emp.name, type, at: now }));
    setCycleEmailState(p => {
      const prev = p[key] || { requestAt: null, reminder1At: null, reminder2At: null, reminder3At: null, logs: [] };
      return { ...p, [key]: { ...prev, [field]: now, logs: [...(prev.logs || []), ...newLogs] } };
    });
    setCycles(p => p.map(c => c.id === cycId ? {
      ...c,
      sent: type === "Review Request" ? c.sent + empList.length : c.sent,
      emailHistory: [{
        at: now, type, recipients: empList.length,
        notes: type + " → " + shName + " (" + shEmail + ") for " + empList.length + " employee" + (empList.length === 1 ? "" : "s")
      }, ...c.emailHistory]
    } : c));
    setPreviewModal(null);
    try {
      const res = await apiFetch(`/api/email-dispatch/${cycId}`, { method: "POST", body: JSON.stringify({ client_id: clId, stakeholder_id: shId, type, employee_ids: empList.map(e => e.id) }) });
      const d = await res.json();
      if (!d.success) { showToast("Email queued but API error: " + (d.message || ""), "error"); return; }
    } catch (e) {}
    showToast(type + " sent to " + shName + " for " + empList.length + " employee" + (empList.length === 1 ? "" : "s"));
  };

  const sendClientBulkEmail = (cycId, clId, clName, shs, empsByShId, quarter, type) => {
    const now = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    const field = typeToField[type] || "requestAt";
    setCycleEmailState(p => {
      const next = { ...p };
      shs.forEach(sh => {
        const key = cycId + "_" + clId + "_" + sh.id;
        const prev = next[key] || { requestAt: null, reminder1At: null, reminder2At: null, reminder3At: null, logs: [] };
        const emps = empsByShId[sh.id] || [];
        const newLogs = emps.map(emp => ({ empId: emp.id, empName: emp.name, type, at: now }));
        next[key] = { ...prev, [field]: now, logs: [...(prev.logs || []), ...newLogs] };
      });
      return next;
    });
    const totalEmps = Object.values(empsByShId).reduce((s, a) => s + a.length, 0);
    setCycles(p => p.map(c => c.id === cycId ? {
      ...c,
      sent: type === "Review Request" ? c.sent + totalEmps : c.sent,
      emailHistory: [{
        at: now, type, recipients: shs.length,
        notes: "Bulk " + type + " → " + shs.length + " stakeholder" + (shs.length === 1 ? "" : "s") + " of " + clName
      }, ...c.emailHistory]
    } : c));
    showToast("Bulk " + type + " sent to " + shs.length + " stakeholder" + (shs.length === 1 ? "" : "s") + " of " + clName);
  };

  const openPreview = (cycId, clId, shId, shName, shEmail, empList, type, quarter, deadline) => {
    setPreviewModal({ cycId, clId, shId, shName, shEmail, empList, type, quarter, deadline });
  };

  const activateCyc = async id => {
    const cyc = cycles.find(c => c.id === id);
    if (!cyc) return;

    // Sort all cycles chronologically for sequence checks
    const sorted = [...cycles].sort((a, b) => (a.year * 10 + a.quarter) - (b.year * 10 + b.quarter));
    const activeCycles = cycles.filter(c => c.status === "Active");
    const activeCount = activeCycles.length;

    // Guard 1: hard cap — max 2 active cycles at a time
    if (activeCount >= 2) {
      showToast("2 cycles are already active — close one before activating another");
      return;
    }

    // Guard 2: if 1 active, only the IMMEDIATE next cycle in sequence can be activated
    if (activeCount === 1) {
      const activeOne = activeCycles[0];
      const activeIdx = sorted.findIndex(c => c.id === activeOne.id);
      const targetIdx = sorted.findIndex(c => c.id === id);
      if (targetIdx !== activeIdx + 1) {
        const nextCyc = sorted[activeIdx + 1];
        if (nextCyc && nextCyc.id !== id) {
          showToast("Activate " + nextCyc.q + " next — it is the immediate successor of " + activeOne.q + ". You cannot skip cycles.");
        } else {
          showToast("No immediate next cycle available to activate.");
        }
        return;
      }
      // Pre-activating the immediate next cycle — skip start-date guard intentionally
      setCycles(p => p.map(c => c.id === id ? { ...c, status: "Active" } : c));
      showToast(cyc.q + " activated alongside " + activeOne.q + " — 2 cycles now running");
      try { await apiFetch(`/api/cycles/${id}/activate`, { method: "POST" }); } catch (e) {}
      return;
    }

    // Guard 3: 0 active cycles — apply start date guard as normal
    if (cyc.start) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const startD = new Date(cyc.start); startD.setHours(0, 0, 0, 0);
      if (today < startD) {
        const diff = Math.ceil((startD - today) / (1000 * 60 * 60 * 24));
        showToast("Cannot activate " + cyc.q + " yet — starts in " + diff + " day" + (diff === 1 ? "" : "s") + " (" + cyc.start + ")");
        return;
      }
    }

    setCycles(p => p.map(c => c.id === id ? { ...c, status: "Active" } : c));
    showToast(cyc.q + " activated successfully");
    try { await apiFetch(`/api/cycles/${id}/activate`, { method: "POST" }); } catch (e) {}
  };

  // Returns null if cycle can be activated, or a short reason string if blocked
  // Used to disable the Activate button and show tooltip text
  const getActivateBlock = (c) => {
    const sorted = [...cycles].sort((a, b) => (a.year * 10 + a.quarter) - (b.year * 10 + b.quarter));
    const activeCycles = cycles.filter(x => x.status === "Active");
    const activeCount = activeCycles.length;

    if (activeCount >= 2)
      return "2 cycles active — close one first";

    if (activeCount === 1) {
      const activeOne = activeCycles[0];
      const activeIdx = sorted.findIndex(x => x.id === activeOne.id);
      const targetIdx = sorted.findIndex(x => x.id === c.id);
      if (targetIdx !== activeIdx + 1) {
        const nextCyc = sorted[activeIdx + 1];
        return nextCyc ? "Activate " + nextCyc.q + " first" : "No next cycle";
      }
      return null; // immediate next — allowed
    }

    // 0 active: start date guard
    if (c.start) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const startD = new Date(c.start); startD.setHours(0, 0, 0, 0);
      if (today < startD) {
        const diff = Math.ceil((startD - today) / (1000 * 60 * 60 * 24));
        return "Starts in " + diff + " day" + (diff === 1 ? "" : "s");
      }
    }
    return null;
  };

  const addCycle = nc => {
    setCycles(p => [...p, nc]);
    setSelYear(nc.year);
    setShowNew(false);
    showToast("Cycle created — now viewing " + nc.year);
  };

  const yearCycles = cycles.filter(c => c.year === selYear).sort((a, b) => a.quarter - b.quarter);

  // ── Derive year label from actual cycle data — no hardcoded years ──────────
  // "CURRENT" = the year that contains at least one Active cycle
  // "CLOSED"  = every cycle in that year is Closed
  // "UPCOMING"= year has cycles but none Active and none Closed yet
  // (no label) = newly created year with only Draft cycles
  const getYearLabel = (y) => {
    const yCycles = cycles.filter(c => c.year === y);
    if (yCycles.length === 0) return null;
    const hasActive = yCycles.some(c => c.status === "Active");
    const allClosed = yCycles.every(c => c.closed);
    if (hasActive) return { text: "CURRENT", bg: "#10B981" };
    if (allClosed) return { text: "CLOSED", bg: "#94A3B8" };
    const hasAnyScheduled = yCycles.some(c => c.status === "Scheduled");
    if (hasAnyScheduled) return { text: "UPCOMING", bg: "#6366F1" };
    return null; // Draft-only years get no badge
  };

  // Summary stats for selected year (for closed years)
  const closedYear = yearCycles.every(c => c.closed);
  const yearStats = {
    totalSent: yearCycles.reduce((s, c) => s + c.sent, 0),
    totalSubmitted: yearCycles.reduce((s, c) => s + c.submitted, 0),
    totalEmails: yearCycles.reduce((s, c) => s + c.emailHistory.length, 0),
  };

  return (
    <div className="fade-in">
      <TopBar title="Cycle Scheduler" subtitle="Configure and manage quarterly review cycles with auto-trigger" {...topBarProps} />

      {/* ── Year selector + action ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Year:</span>
        {allYears.map(y => {
          const lbl = getYearLabel(y);
          return (
            <button key={y} className={`tab${selYear === y ? " active" : ""}`} onClick={() => { setSelYear(y); setEditId(null); }}>
              {y}
              {lbl && (
                <span style={{
                  marginLeft: 5, fontSize: 9, background: selYear === y ? "rgba(255,255,255,.3)" : lbl.bg,
                  color: "#fff", padding: "1px 6px", borderRadius: 100, fontWeight: 700
                }}>
                  {lbl.text}
                </span>
              )}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {!closedYear && <button className="btn-primary" onClick={() => setShowNew(true)}>+ Create New Cycle</button>}
          {closedYear && (
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Year PDF export for " + selYear + " — download would begin in production")}>📥 Export Year PDF</button>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Year Excel export for " + selYear + " — download would begin in production")}>📊 Export Year Excel</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Closed year summary bar ── */}
      {closedYear && (
        <div style={{
          background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "14px 20px", marginBottom: 18,
          display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap"
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B" }}>📁 {selYear} — Full Year Summary</div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { l: "Cycles Run", v: yearCycles.length, c: "#0D1B2A" },
              { l: "Total Sent", v: yearStats.totalSent, c: "#3B82F6" },
              { l: "Submitted", v: yearStats.totalSubmitted, c: "#10B981" },
              { l: "Emails Sent", v: yearStats.totalEmails, c: "#8B5CF6" },
            ].map(s => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cycle cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {yearCycles.map(c => {
          const isEd = editId === c.id && !c.closed;
          const isExp = expanded[c.id];
          const isHist = histOpen[c.id];
          const headerBg = c.status === "Active" ? "#E8520A" : c.closed ? "#64748B" : "#F1F5F9";
          const headerFg = (c.status === "Active" || c.closed) ? "#fff" : "#94A3B8";
          const completionPct = c.sent > 0 ? Math.round((c.submitted / c.sent) * 100) : 0;

          return (
            <div key={c.id} className="card" style={{
              border: c.status === "Active" ? "2px solid rgba(232,82,10,.22)" : c.closed ? "1.5px solid #E2E8F0" : "1.5px solid #E2E8F0",
              overflow: "hidden", opacity: c.closed ? 0.92 : 1
            }}>

              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* Quarter badge */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 12, flexShrink: 0, background: headerBg, color: headerFg,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Sora',sans-serif", fontWeight: 800
                  }}>
                    <div style={{ fontSize: 13 }}>{(c.q || "").split(" ")[0]}</div>
                    <div style={{ fontSize: 10, opacity: 0.75 }}>{c.year}</div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A" }}>{c.q}</span>
                      <Badge status={c.status} />
                      {c.status === "Active" && <span style={{ fontSize: 11, color: "#E8520A", background: "#FFF5F0", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>{c.sent - c.submitted} pending · {c.submitted} submitted</span>}
                      {c.closed && c.sent > 0 && (
                        <span style={{ fontSize: 11, color: "#10B981", background: "#F0FDF4", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>
                          {completionPct}% completion · {c.submitted}/{c.sent} submitted
                        </span>
                      )}
                    </div>

                    {/* Dates row */}
                    {isEd ? (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {[["start", "Start"], ["deadline", "Deadline"], ["r1", "Reminder 1"], ["r2", "Reminder 2"]].map(([fld, lbl]) => (
                          <div key={fld}>
                            <label style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 3, textTransform: "uppercase" }}>{lbl}</label>
                            <input type="date" value={c[fld]} onChange={e => updCyc(c.id, fld, e.target.value)} style={{ fontSize: 12, padding: "5px 9px", width: "auto" }} onClick={(e) => { e.target.showPicker?.(); }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#64748B", flexWrap: "wrap" }}>
                        <span>Start: <strong style={{ color: "#0D1B2A" }}>{c.start}</strong></span>
                        <span>Deadline: <strong style={{ color: "#0D1B2A" }}>{c.deadline}</strong></span>
                        {c.r1 && <span>R1: <strong style={{ color: "#0D1B2A" }}>{c.r1}</strong></span>}
                        {c.r2 && <span>R2: <strong style={{ color: "#0D1B2A" }}>{c.r2}</strong></span>}
                      </div>
                    )}
                  </div>

                  {/* Progress counter for active/closed */}
                  {(c.status === "Active" || (c.closed && c.sent > 0)) && (
                    <div style={{ textAlign: "right", flexShrink: 0, marginRight: 8 }}>
                      <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: "#0D1B2A" }}>{c.submitted}/{c.sent}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>submitted</div>
                      <div className="progress-bar" style={{ marginTop: 6, width: 100 }}>
                        <div className="progress-fill" style={{ width: `${completionPct}%`, background: c.closed ? "#10B981" : "#E8520A" }} />
                      </div>
                    </div>
                  )}

                  {/* Action buttons — suppressed for closed cycles */}
                  {!c.closed && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                      {isEd ? (
                        <>
                          <button className="btn-primary" style={{ fontSize: 12 }} onClick={async () => {
                            const prev = cycles.find(x => x.id === c.id);
                            try {
                              const res = await apiFetch(`/api/cycles/${c.id}`, { method: "PUT", body: JSON.stringify({ start_date: c.start, end_date: c.deadline, deadline: c.deadline, r1: c.r1, r2: c.r2 }) });
                              const d = await res.json();
                              if (!d.success) { showToast("Error: " + (d.message || "Save failed")); return; }
                              setEditId(null); showToast("Cycle dates saved");
                            } catch (e) { showToast("Network error — dates not saved", "error"); }
                          }}>Save</button>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setEditId(c.id)}>Edit Dates</button>
                      )}
                      {(c.status === "Scheduled" || c.status === "Draft") && !isEd && (() => {
                        const block = getActivateBlock(c);
                        return block ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <button className="btn-ghost" style={{ fontSize: 12, opacity: 0.45, cursor: "not-allowed", border: "1.5px dashed #CBD5E1", color: "#94A3B8" }} disabled>Activate</button>
                            <span style={{ fontSize: 9, color: "#EF4444", fontWeight: 600, textAlign: "center", maxWidth: 90, lineHeight: 1.3 }}>{block}</span>
                          </div>
                        ) : (
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => activateCyc(c.id)}>Activate</button>
                        );
                      })()}
                      {c.status === "Active" && !isEd && <button className="btn-danger" style={{ fontSize: 12 }} onClick={() => closeCyc(c.id)}>Close Cycle</button>}
                    </div>
                  )}

                  {c.closed && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => showToast(c.q + " report — PDF download would begin in production")}>📄 View Report</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expand tabs */}
              <div style={{ borderTop: "1px solid #F1F5F9", display: "flex" }}>
                <button onClick={() => togExp(c.id)} style={{
                  flex: 1, padding: "10px 20px", background: "#FAFBFF", border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 6, borderRight: "1px solid #F1F5F9"
                }}>
                  Client &amp; Stakeholder Breakdown ({clients.filter(cl => employees.some(e => e.allocations.some(a => a.clientId === cl.id))).length} clients) {isExp ? "▲" : "▼"}
                </button>
                <button onClick={() => togHist(c.id)} style={{
                  flex: 1, padding: "10px 20px", background: "#FAFBFF", border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 6
                }}>
                  Email Trigger History ({c.emailHistory.length}) {isHist ? "▲" : "▼"}
                </button>
              </div>

              {isExp && (
                <div className="slide-down" style={{ borderTop: "1px solid #F1F5F9", background: "#FAFBFF" }}>
                  {clients.filter(cl => employees.some(e => e.allocations.some(a => a.clientId === cl.id))).map((cl, clIdx) => {
                    const clEmps = employees.filter(e => e.allocations.some(a => a.clientId === cl.id));
                    const clColor = cl.color || cl.color_hex || CLIENT_COLORS[cl.id] || "#64748B";
                    const activeStakeholders = cl.stakeholders.filter(s => s.active);
                    // allSent = every active stakeholder has had review request sent
                    const allSent = activeStakeholders.length > 0 && activeStakeholders.every(sh => {
                      const key = c.id + "_" + cl.id + "_" + sh.id;
                      const st = cycleEmailState[key] || {};
                      return !!st.requestAt;
                    });

                    // Build empsByShId for bulk send
                    const empsByShId = {};
                    activeStakeholders.forEach(sh => {
                      empsByShId[sh.id] = clEmps.filter(emp => {
                        const alloc = emp.allocations.find(a => a.clientId === cl.id);
                        if (!alloc) return false;
                        if (alloc.stakeholders && alloc.stakeholders.length > 0) {
                          return alloc.stakeholders.some(s => s.stakeholderId === sh.id);
                        }
                        if (sh.level === "dept") return alloc.deptId === sh.deptId;
                        const pid = cl.primaryStakeholderId
                          ? cl.primaryStakeholderId
                          : (cl.stakeholders.filter(s => s.active && s.level === "client")[0] || {}).id;
                        return pid && pid === sh.id;
                      });
                    });

                    return (
                      <div key={cl.id} style={{ borderBottom: clIdx < clients.filter(cl2 => employees.some(e => e.allocations.some(a => a.clientId === cl2.id))).length - 1 ? "1.5px solid #E2E8F0" : "none" }}>

                        {/* ── Client header row ── */}
                        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, background: "#fff" }}>
                          <div style={{ width: 12, height: 12, borderRadius: "50%", background: clColor, flexShrink: 0 }} />
                          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", flex: 1 }}>{cl.name}</div>
                          <span style={{ fontSize: 11, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 100, padding: "2px 9px", color: "#64748B", fontWeight: 600 }}>
                            {clEmps.length} employee{clEmps.length !== 1 ? "s" : ""}
                          </span>
                          <span style={{ fontSize: 11, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 100, padding: "2px 9px", color: "#64748B", fontWeight: 600 }}>
                            {activeStakeholders.length} stakeholder{activeStakeholders.length !== 1 ? "s" : ""}
                          </span>
                          {!c.closed && (
                            allSent ? (
                              <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>&#10003; All Requested</span>
                            ) : (
                              <button className="btn-secondary" style={{ fontSize: 11, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5 }}
                                onClick={() => sendClientBulkEmail(c.id, cl.id, cl.name,
                                  activeStakeholders.filter(sh => { const k = c.id + "_" + cl.id + "_" + sh.id; return !(cycleEmailState[k] && cycleEmailState[k].requestAt); }),
                                  empsByShId, c.q, "Review Request")}>
                                &#128231; Request All
                              </button>
                            )
                          )}
                        </div>

                        {/* ── Stakeholder rows ── */}
                        {activeStakeholders.length === 0 && (
                          <div style={{ padding: "12px 20px 12px 44px", fontSize: 12, color: "#94A3B8", fontStyle: "italic", background: "#FAFBFF" }}>
                            No active stakeholders configured for this client.
                          </div>
                        )}
                        {activeStakeholders.map((sh, shIdx) => {
                          const shEmps = clEmps.filter(emp => {
                            const alloc = emp.allocations.find(a => a.clientId === cl.id);
                            if (!alloc) return false;

                            // ── Custom stakeholder split: employee appears ONLY under
                            //    the specific stakeholders listed in the split ──────────
                            if (alloc.stakeholders && alloc.stakeholders.length > 0) {
                              return alloc.stakeholders.some(s => s.stakeholderId === sh.id);
                            }

                            // ── Default (no custom split) ─────────────────────────────
                            // Dept-level stakeholder → filter by deptId match
                            if (sh.level === "dept") {
                              return alloc.deptId === sh.deptId;
                            }

                            // Client-level stakeholder → only show under the PRIMARY.
                            // Use explicit primaryStakeholderId if set, else first active client-level.
                            const primaryId = cl.primaryStakeholderId
                              ? cl.primaryStakeholderId
                              : (cl.stakeholders.filter(s => s.active && s.level === "client")[0] || {}).id;
                            return primaryId && primaryId === sh.id;
                          });
                          if (shEmps.length === 0) return null;
                          const shKey = c.id + "_" + cl.id + "_" + sh.id;
                          const shState = cycleEmailState[shKey] || { requestAt: null, reminder1At: null, reminder2At: null, reminder3At: null, logs: [] };
                          const reqSent = !!shState.requestAt;
                          const r1Sent = !!shState.reminder1At;
                          const r2Sent = !!shState.reminder2At;
                          const r3Sent = !!shState.reminder3At;
                          const hasR1 = !!c.r1;
                          const hasR2 = !!c.r2;
                          const hasR3 = !!(c.r3);
                          const logKey = shKey + "_log";
                          const logOpen = !!shLogOpen[logKey];

                          return (
                            <div key={sh.id} style={{
                              padding: "12px 20px 14px 36px",
                              borderTop: "1px dashed #E2E8F0", background: shIdx % 2 === 0 ? "#FAFBFF" : "#F8FAFC"
                            }}>

                              {/* Stakeholder info + action row */}
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                                <Avatar name={sh.name} size={30} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{sh.name}</div>
                                  <div style={{ fontSize: 11, color: "#64748B" }}>{sh.designation} · {sh.email}</div>
                                </div>
                                {/* Primary badge: uses explicit primaryStakeholderId */}
                                {sh.level === "client" && (() => {
                                  const pid = cl.primaryStakeholderId
                                    ? cl.primaryStakeholderId
                                    : (cl.stakeholders.filter(s => s.active && s.level === "client")[0] || {}).id;
                                  return pid === sh.id;
                                })() && (
                                    <span style={{
                                      fontSize: 10, fontWeight: 700, background: "#FFF5F0", color: "#E8520A",
                                      border: "1px solid #FDBA74", padding: "2px 8px", borderRadius: 100
                                    }}>Primary</span>
                                  )}
                                <span style={{
                                  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .5,
                                  background: sh.level === "client" ? "#EFF6FF" : "#F5F3FF",
                                  color: sh.level === "client" ? "#3B82F6" : "#8B5CF6",
                                  padding: "3px 9px", borderRadius: 100
                                }}>
                                  {sh.level === "client" ? "All Employees" : "Dept Only"}
                                </span>
                                <span style={{ fontSize: 11, color: "#64748B" }}>{shEmps.length} emp{shEmps.length !== 1 ? "s" : ""}</span>

                                {/* ── Email button state machine ── */}
                                {!c.closed && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end", marginLeft: 4 }}>

                                    {/* Request Review button */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                      {!reqSent && (
                                        <button title="Preview email" onClick={() => openPreview(c.id, cl.id, sh.id, sh.name, sh.email, shEmps, "Review Request", c.q, c.deadline)}
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
                                          onClick={() => sendStakeholderEmail(c.id, cl.id, sh.id, sh.name, sh.email, shEmps, c.q, "Review Request")}>
                                          Request Review
                                        </button>
                                      )}
                                    </div>

                                    {/* Reminder 1 */}
                                    {hasR1 && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {reqSent && !r1Sent && (
                                          <button title="Preview Reminder 1" onClick={() => openPreview(c.id, cl.id, sh.id, sh.name, sh.email, shEmps, "Reminder 1", c.q, c.deadline)}
                                            style={{ background: "none", border: "1.5px solid #CBD5E1", borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontSize: 13, color: "#64748B" }}>
                                            &#128065;
                                          </button>
                                        )}
                                        {r1Sent ? (
                                          <span style={{
                                            fontSize: 11, color: "#F59E0B", fontWeight: 700, background: "#FFFBEB",
                                            border: "1px solid #FDE68A", borderRadius: 100, padding: "3px 9px", whiteSpace: "nowrap"
                                          }}>
                                            &#10003; Reminder 1 · {shState.reminder1At}
                                          </span>
                                        ) : (
                                          <button className="btn-secondary" style={{
                                            fontSize: 11, padding: "5px 12px", whiteSpace: "nowrap",
                                            ...(reqSent ? {} : { opacity: 0.4, cursor: "not-allowed" })
                                          }}
                                            disabled={!reqSent}
                                            onClick={() => sendStakeholderEmail(c.id, cl.id, sh.id, sh.name, sh.email, shEmps, c.q, "Reminder 1")}>
                                            Send Reminder 1
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {/* Reminder 2 */}
                                    {hasR2 && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {reqSent && r1Sent && !r2Sent && (
                                          <button title="Preview Reminder 2" onClick={() => openPreview(c.id, cl.id, sh.id, sh.name, sh.email, shEmps, "Reminder 2", c.q, c.deadline)}
                                            style={{ background: "none", border: "1.5px solid #CBD5E1", borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontSize: 13, color: "#64748B" }}>
                                            &#128065;
                                          </button>
                                        )}
                                        {r2Sent ? (
                                          <span style={{
                                            fontSize: 11, color: "#8B5CF6", fontWeight: 700, background: "#F5F3FF",
                                            border: "1px solid #DDD6FE", borderRadius: 100, padding: "3px 9px", whiteSpace: "nowrap"
                                          }}>
                                            &#10003; Reminder 2 · {shState.reminder2At}
                                          </span>
                                        ) : (
                                          <button className="btn-secondary" style={{
                                            fontSize: 11, padding: "5px 12px", whiteSpace: "nowrap",
                                            ...((reqSent && r1Sent) ? {} : { opacity: 0.4, cursor: "not-allowed" })
                                          }}
                                            disabled={!(reqSent && r1Sent)}
                                            onClick={() => sendStakeholderEmail(c.id, cl.id, sh.id, sh.name, sh.email, shEmps, c.q, "Reminder 2")}>
                                            Send Reminder 2
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {/* Reminder 3 */}
                                    {hasR3 && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {reqSent && r1Sent && r2Sent && !r3Sent && (
                                          <button title="Preview Reminder 3" onClick={() => openPreview(c.id, cl.id, sh.id, sh.name, sh.email, shEmps, "Reminder 3", c.q, c.deadline)}
                                            style={{ background: "none", border: "1.5px solid #CBD5E1", borderRadius: 7, padding: "3px 8px", cursor: "pointer", fontSize: 13, color: "#64748B" }}>
                                            &#128065;
                                          </button>
                                        )}
                                        {r3Sent ? (
                                          <span style={{
                                            fontSize: 11, color: "#EF4444", fontWeight: 700, background: "#FEF2F2",
                                            border: "1px solid #FECACA", borderRadius: 100, padding: "3px 9px", whiteSpace: "nowrap"
                                          }}>
                                            &#10003; Reminder 3 · {shState.reminder3At}
                                          </span>
                                        ) : (
                                          <button className="btn-secondary" style={{
                                            fontSize: 11, padding: "5px 12px", whiteSpace: "nowrap",
                                            ...((reqSent && r1Sent && r2Sent) ? {} : { opacity: 0.4, cursor: "not-allowed" })
                                          }}
                                            disabled={!(reqSent && r1Sent && r2Sent)}
                                            onClick={() => sendStakeholderEmail(c.id, cl.id, sh.id, sh.name, sh.email, shEmps, c.q, "Reminder 3")}>
                                            Send Reminder 3
                                          </button>
                                        )}
                                      </div>
                                    )}

                                  </div>
                                )}
                              </div>

                              {/* Employee chips */}
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 4 }}>
                                {shEmps.map(emp => {
                                  const alloc = emp.allocations.find(a => a.clientId === cl.id);
                                  const shEntry = alloc && alloc.stakeholders && alloc.stakeholders.length > 0
                                    ? alloc.stakeholders.find(s => s.stakeholderId === sh.id)
                                    : null;
                                  const pct = shEntry ? shEntry.pct : (alloc ? alloc.pct : null);
                                  const isCustom = shEntry !== null && shEntry !== undefined;
                                  return (
                                    <div key={emp.id} style={{
                                      display: "flex", alignItems: "center", gap: 6,
                                      background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 8,
                                      padding: "5px 10px", boxShadow: "0 1px 3px rgba(0,0,0,.04)"
                                    }}>
                                      <Avatar name={emp.name} size={22} />
                                      <div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", lineHeight: 1.2 }}>{emp.name}</div>
                                        <div style={{ fontSize: 10, color: "#94A3B8" }}>{emp.role || ""}</div>
                                      </div>
                                      {pct !== null && (
                                        <span style={{
                                          fontSize: 10, fontWeight: 800,
                                          color: isCustom ? "#6D28D9" : clColor,
                                          background: isCustom ? "#F5F3FF" : clColor + "18",
                                          border: "1px solid " + (isCustom ? "#DDD6FE" : clColor + "44"),
                                          padding: "2px 7px", borderRadius: 100, marginLeft: 2
                                        }}>
                                          {pct}%{isCustom ? " ✶" : ""}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Per-stakeholder email log (collapsible) */}
                              {shState.logs && shState.logs.length > 0 && (
                                <div style={{ marginTop: 10, paddingLeft: 4 }}>
                                  <button onClick={() => togShLog(logKey)}
                                    style={{
                                      background: "none", border: "none", cursor: "pointer", fontSize: 11,
                                      color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0
                                    }}>
                                    &#128203; Email Log ({shState.logs.length}) {logOpen ? "▲" : "▼"}
                                  </button>
                                  {logOpen && (
                                    <div className="slide-down" style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                                      {shState.logs.map((log, li) => (
                                        <div key={li} style={{
                                          display: "flex", alignItems: "center", gap: 10,
                                          background: "#fff", border: "1px solid #E2E8F0", borderRadius: 7, padding: "7px 12px"
                                        }}>
                                          <div style={{
                                            width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background:
                                              log.type === "Review Request" ? "#10B981" :
                                                log.type === "Reminder 1" ? "#F59E0B" :
                                                  log.type === "Reminder 2" ? "#8B5CF6" : "#EF4444"
                                          }} />
                                          <span style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", minWidth: 100 }}>{log.empName}</span>
                                          <span style={{
                                            fontSize: 11, background:
                                              log.type === "Review Request" ? "#F0FDF4" :
                                                log.type === "Reminder 1" ? "#FFFBEB" :
                                                  log.type === "Reminder 2" ? "#F5F3FF" : "#FEF2F2",
                                            color:
                                              log.type === "Review Request" ? "#059669" :
                                                log.type === "Reminder 1" ? "#D97706" :
                                                  log.type === "Reminder 2" ? "#7C3AED" : "#DC2626",
                                            border: "1px solid", borderColor:
                                              log.type === "Review Request" ? "#BBF7D0" :
                                                log.type === "Reminder 1" ? "#FDE68A" :
                                                  log.type === "Reminder 2" ? "#DDD6FE" : "#FECACA",
                                            borderRadius: 100, padding: "2px 8px", fontWeight: 600
                                          }}>{log.type}</span>
                                          <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>{log.at}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* ── Unallocated employees warning ── */}
                  {employees.filter(e => e.allocations.length === 0).length > 0 && (
                    <div style={{
                      padding: "14px 20px", background: "#FEF2F2", borderTop: "1.5px solid #FECACA",
                      display: "flex", alignItems: "flex-start", gap: 12
                    }}>
                      <div style={{ fontSize: 20, flexShrink: 0 }}>⚠️</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", marginBottom: 8 }}>
                          {employees.filter(e => e.allocations.length === 0).length} unallocated employee{employees.filter(e => e.allocations.length === 0).length !== 1 ? "s" : ""} — not scoped to any client review
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {employees.filter(e => e.allocations.length === 0).map(emp => (
                            <div key={emp.id} style={{
                              display: "flex", alignItems: "center", gap: 6,
                              background: "#fff", border: "1.5px solid #FECACA", borderRadius: 8, padding: "5px 10px"
                            }}>
                              <Avatar name={emp.name} size={20} />
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#991B1B" }}>{emp.name}</span>
                              <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 600 }}>0% allocated</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isHist && (
                <div className="slide-down" style={{ borderTop: "1px solid #F1F5F9", padding: "16px 20px", background: "#FAFBFF" }}>
                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>
                    Email Activity Timeline — {c.q}
                  </div>
                  {c.emailHistory.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>No emails triggered yet for this cycle.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {c.emailHistory.map((h, i) => {
                        const dot = h.type === "Review Request" ? "#10B981" : h.type === "Reminder 1" ? "#F59E0B" :
                          h.type === "Reminder 2" ? "#8B5CF6" : h.type === "Reminder 3" ? "#EF4444" :
                            h.type === "Submission Confirm" ? "#3B82F6" : "#64748B";
                        return (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 12, background: "#fff",
                            border: "1px solid #E2E8F0", borderRadius: 9, padding: "10px 14px"
                          }}>
                            <div style={{ width: 9, height: 9, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{h.type}</div>
                              <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{h.notes}</div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <span style={{
                                fontSize: 11, fontWeight: 600, background: dot + "18",
                                color: dot, border: "1px solid " + dot + "33", borderRadius: 100, padding: "2px 9px", display: "inline-block", marginBottom: 3
                              }}>
                                {h.recipients} recipient{h.recipients !== 1 ? "s" : ""}
                              </span>
                              <div style={{ fontSize: 11, color: "#94A3B8" }}>{h.at}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showNew && <NewCycleModal onAdd={addCycle} onClose={() => setShowNew(false)} existing={cycles} />}

      {/* ── Email Preview Modal ── */}
      {previewModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPreviewModal(null); }}>
          <div className="modal" style={{ maxWidth: 600, width: "96vw" }}>
            {/* Header */}
            <div style={{
              padding: "20px 28px", borderBottom: "1px solid #F1F5F9",
              background: "linear-gradient(135deg,#0D1B2A 0%,#1E3A5F 100%)", borderRadius: "14px 14px 0 0",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>
                  &#128065; Preview Email
                </div>
                <div style={{ fontSize: 12, color: "#8CA4BE", marginTop: 3 }}>{previewModal.type} → {previewModal.shName}</div>
              </div>
              <button onClick={() => setPreviewModal(null)} style={{ background: "none", border: "none", color: "#8CA4BE", fontSize: 22, cursor: "pointer" }}>&#215;</button>
            </div>

            {/* Email preview body */}
            <div style={{ padding: "24px 28px" }}>
              {/* To / Subject */}
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", marginBottom: 16, border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, width: 52 }}>TO:</span>
                  <span style={{ fontSize: 12, color: "#0D1B2A", fontWeight: 600 }}>{previewModal.shName} &lt;{previewModal.shEmail}&gt;</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, width: 52 }}>CC:</span>
                  <span style={{ fontSize: 12, color: "#64748B" }}>admin@dolluz.com (Super Admin) + CC list</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, width: 52 }}>SUBJECT:</span>
                  <span style={{ fontSize: 12, color: "#0D1B2A", fontWeight: 600 }}>
                    {previewModal.type === "Review Request" ? "Performance Review Request" :
                      previewModal.type === "Reminder 1" ? "[Reminder] Performance Review Pending" :
                        previewModal.type === "Reminder 2" ? "[Second Reminder] Action Required" :
                          "[Final Reminder] Urgent: Review Deadline"
                    } — {previewModal.quarter}
                  </span>
                </div>
              </div>

              {/* Email body preview */}
              <div style={{
                background: "#FAFBFF", borderRadius: 10, padding: "16px 18px", border: "1px solid #E2E8F0",
                fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.7, color: "#1E293B", whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto"
              }}>
                {"Dear " + previewModal.shName + ",\n\n" +
                  (previewModal.type === "Review Request"
                    ? "This is to formally notify you that the " + previewModal.quarter + " employee performance review cycle has been initiated at Dolluz. As a designated stakeholder, we kindly request you to evaluate the performance of the following employee(s) assigned to you:\n\n"
                    : previewModal.type === "Reminder 1"
                      ? "This is a gentle reminder that the " + previewModal.quarter + " performance review is still pending for the following employee(s):\n\n"
                      : previewModal.type === "Reminder 2"
                        ? "This is our second reminder that the " + previewModal.quarter + " performance review is still outstanding for:\n\n"
                        : "This is a final reminder regarding the " + previewModal.quarter + " performance review for:\n\n") +
                  previewModal.empList.map((e, i) => "  " + (i + 1) + ". " + e.name + (e.role ? " (" + e.role + ")" : "")).join("\n") +
                  "\n\nPlease complete the evaluation by " + (previewModal.deadline || "the deadline") + ".\n\nPortal: https://portal.dolluz.com/review\n\nWarm regards,\nSuper Admin\nDolluz HR Team"
                }
              </div>

              {/* CC note */}
              <div style={{ marginTop: 12, background: "#FFF5F0", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 14px", fontSize: 11, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                &#128274; All outgoing emails automatically include CC recipients configured in Email → CC Management.
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={() => setPreviewModal(null)}>Cancel</button>
                <button className="btn-primary" onClick={() =>
                  sendStakeholderEmail(previewModal.cycId, previewModal.clId, previewModal.shId, previewModal.shName, previewModal.shEmail, previewModal.empList, previewModal.quarter, previewModal.type)}>
                  &#128231; Send {previewModal.type}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} type={toastType} />}
    </div>
  );
};

export { NewCycleModal };
export default Scheduler;
