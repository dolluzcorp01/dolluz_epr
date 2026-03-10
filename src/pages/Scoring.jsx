import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Toast from "../components/Toast";
import { QUARTER_SCORES, ACTIVE_QUARTER, COMP_INIT, CLIENT_COLORS } from "../constants";
import { apiFetch } from "../utils/api";


const Scoring = ({ topBarProps, cycles, setCycles, clients, employees, cycleEmailState, allReviews, setAllReviews, scoringHikes, setScoringHikes, scoringLocked, setScoringLocked }) => {

  // ── Cycle selector — Active + Closed only ───────────────────────────────────
  const scoringCycles = (cycles || [])
    .filter(c => c.status === "Active" || c.status === "Closed")
    .slice().sort((a, b) => {
      const ord = { "Q1": 1, "Q2": 2, "Q3": 3, "Q4": 4 };
      if (a.year !== b.year) return b.year - a.year;
      return (ord[(b.q || "").split(" ")[0]] || 0) - (ord[(a.q || "").split(" ")[0]] || 0);
    });
  const activeCycle = (cycles || []).find(c => c.status === "Active");
  const [selCycId, setSelCycId] = useState(activeCycle ? activeCycle.id : (scoringCycles.length > 0 ? scoringCycles[0].id : ""));
  const selCycle = (cycles || []).find(c => c.id === selCycId) || null;
  const quarter = selCycle ? selCycle.q : ACTIVE_QUARTER;
  const isHistorical = selCycle ? !!selCycle.closed : false;

  const allQtrs = Object.keys(QUARTER_SCORES);
  const [comps, setComps] = useState(COMP_INIT.map(c => ({ ...c })));
  const [empScores, setEmpScores] = useState([]);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Fetch competencies from API on mount
  useEffect(() => {
    apiFetch("/api/scoring/competencies")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data && d.data.length > 0)
          setComps(d.data.map(c => ({ ...c, name: c.name, weight: Number(c.weight) })));
      })
      .catch(() => {});
  }, []); // eslint-disable-line

  // Sync selCycId when cycles load (e.g. from API)
  useEffect(() => {
    if (!selCycId && scoringCycles.length > 0) {
      const active = scoringCycles.find(c => c.status === "Active");
      setSelCycId(active ? active.id : scoringCycles[0].id);
    }
  }, [cycles]); // eslint-disable-line

  // Fetch scoring data from API when cycle selection changes
  useEffect(() => {
    if (!selCycId) { setEmpScores([]); return; }
    setScoringLoading(true);
    apiFetch(`/api/scoring?cycle_id=${selCycId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const qt = selCycle ? selCycle.q : ACTIVE_QUARTER;
          const rows = d.data.map(row => ({
            code:         row.employee_code,
            name:         row.employee_name,
            ctc:          Number(row.ctc_at_time || row.base_ctc || 0),
            score:        row.score != null ? parseFloat(row.score) : null,
            approvedHike: row.approved_hike != null ? String(row.approved_hike) : null,
          }));
          setEmpScores(rows);
          // Pre-populate hike + lock state from API data
          const hikeUpd = {}, lockUpd = {};
          d.data.forEach(row => {
            if (row.approved_hike != null) hikeUpd[row.employee_code] = String(row.approved_hike);
            if (row.scoring_locked)        lockUpd[row.employee_code] = true;
          });
          if (Object.keys(hikeUpd).length) setScoringHikes(p => ({ ...p, [qt]: { ...(p[qt] || {}), ...hikeUpd } }));
          if (Object.keys(lockUpd).length) setScoringLocked(p => ({ ...p, [qt]: { ...(p[qt] || {}), ...lockUpd } }));
        }
      })
      .catch(() => {})
      .finally(() => setScoringLoading(false));
  }, [selCycId]); // eslint-disable-line
  const [toast, setToast] = useState("");
  const [showTrend, setShowTrend] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const showToast = (msg, color) => { setToast({ msg, color: color || "#0D1B2A" }); setTimeout(() => setToast(""), 2800); };

  // ── Scoring Walkthrough ─────────────────────────────────────────────────────
  const GUIDE_STEPS = [
    {
      icon: "🎯", title: "What is Scoring & Hikes?", color: "#E8520A",
      body: "This module is the heart of the EPR process. It calculates each employee's hike percentage based on how stakeholders rated their performance across defined competencies.",
      tip: "Think of it as translating client satisfaction into fair, data-backed compensation decisions."
    },
    {
      icon: "⚖️", title: "Step 1 — Set Competency Weights", color: "#3B82F6",
      body: "Define how much each competency matters. Six competencies are pre-loaded. Their weights must add up to exactly 100%. You can adjust them each quarter — but closed quarters are locked.",
      tip: "Example: If 'Client Satisfaction' carries 30% weight, it influences the final score 3× more than a 10% competency."
    },
    {
      icon: "📊", title: "Step 2 — Score Column", color: "#8B5CF6",
      body: "Each employee's Score (0–100) is a weighted average of all criteria rated by their stakeholder. Green = 85+, Amber = 70–84, Red = below 70.",
      tip: "A score of 85+ is excellent. Below 60 warrants a conversation."
    },
    {
      icon: "💰", title: "Step 3 — Hike Formula", color: "#10B981",
      body: "Suggested hike = (Score ÷ 100) × 4 × 6. For a score of 85: (85÷100)×4×6 = 20.4%. Click ✓ on any row to apply the suggestion, or type a custom override.",
      tip: "Use the per-row ✓ button for individual approval, or Bulk Approve to apply all suggestions at once."
    },
    {
      icon: "🔒", title: "Step 4 — Lock & Publish", color: "#F59E0B",
      body: "Lock individual rows once finalised — locked rows cannot be changed. When all rows are locked, use Publish Quarter to close scoring and automatically mark all reviews as Closed.",
      tip: "Best practice: Review each employee, adjust where needed, lock, then publish."
    },
    {
      icon: "📈", title: "Step 5 — Trend Analysis", color: "#0D1B2A",
      body: "Click 'Show Trends' to see each employee's score and hike move quarter-over-quarter. Upward trends signal growth; flat or declining trends are early signals to investigate.",
      tip: "Employees with consistent upward trends for 3+ quarters are top performers for promotions."
    },
  ];

  // empScores: use API data when available, fall back to hardcoded constants for historical display
  const staticScores = QUARTER_SCORES[quarter] || [];
  const displayScores = empScores.length > 0 ? empScores : staticScores;
  const MULT = 6;
  const totalW = comps.reduce((s, c) => s + Number(c.weight), 0);
  const weightOk = totalW === 100;

  // ── Review status per employee (mirrors Review Management priority rollup) ──
  const SCORE_STATUS_PRIORITY = ["Not Started", "Closed", "Submitted", "Initiated", "In Progress", "Overdue"];

  const getEmpReviewStatus = (empCode) => {
    if (scoringLocked[quarter] && scoringLocked[quarter][empCode]) return "Closed";

    const emp = (employees || []).find(e => e.code === empCode);
    if (!emp) return "Not Started";

    let highestPriority = "Not Started";

    (emp.allocations || []).forEach(alloc => {
      const cl = (clients || []).find(c => c.id === alloc.clientId);
      if (!cl) return;

      // Resolve stakeholders — same rules as getEmpStakeholders in Reviews
      const active = cl.stakeholders.filter(s => s.active);
      let stakeholders = [];

      if (alloc.stakeholders && alloc.stakeholders.length > 0) {
        stakeholders = active.filter(sh => alloc.stakeholders.some(s => s.stakeholderId === sh.id));
      } else {
        const pid = cl.primaryStakeholderId
          ? cl.primaryStakeholderId
          : ((active.filter(s => s.level === "client")[0]) || {}).id;
        const reviews = allReviews || [];
        stakeholders = active.filter(sh => {
          if (sh.level === "client") return pid && pid === sh.id;
          if (sh.level === "dept" && sh.deptId === alloc.deptId) {
            const hasRecord = reviews.some(r =>
              r.empId === empCode && r.client === cl.name && r.stakeholder === sh.name && r.quarter === quarter
            );
            if (hasRecord) return true;
            const key = selCycId + "_" + alloc.clientId + "_" + sh.id;
            const es = (cycleEmailState || {})[key] || {};
            return (es.logs || []).some(l => l.empId === empCode);
          }
          return false;
        });
      }

      // Get individual status for each stakeholder
      stakeholders.forEach(sh => {
        const rev = (allReviews || []).find(r =>
          r.empId === empCode && r.client === cl.name && r.stakeholder === sh.name && r.quarter === quarter
        );
        let status = "Not Started";
        if (rev) {
          if (rev.status === "Approved") status = "Closed";
          else if (rev.status === "Submitted") status = "Submitted";
          else if (rev.status === "In Progress") status = "In Progress";
          else status = "Initiated";
        } else {
          const key = selCycId + "_" + alloc.clientId + "_" + sh.id;
          const es = (cycleEmailState || {})[key] || {};
          if (es.requestAt) status = "Initiated";
        }
        // Keep highest-priority (most attention-needed) status
        if (SCORE_STATUS_PRIORITY.indexOf(status) > SCORE_STATUS_PRIORITY.indexOf(highestPriority)) {
          highestPriority = status;
        }
      });
    });

    return highestPriority;
  };

  // ── Score color coding ───────────────────────────────────────────────────────
  const scoreColor = (s) => s >= 85 ? "#10B981" : s >= 70 ? "#E8520A" : "#EF4444";
  const scoreBg = (s) => s >= 85 ? "#F0FDF4" : s >= 70 ? "#FFF5F0" : "#FEF2F2";
  const scoreBdr = (s) => s >= 85 ? "#BBF7D0" : s >= 70 ? "#FDBA74" : "#FECACA";

  // ── Review status badge ──────────────────────────────────────────────────────
  const REV_CLR = {
    "Not Started": { bg: "#F8FAFC", tc: "#94A3B8", bdr: "#E2E8F0" },
    "Initiated": { bg: "#EEF2FF", tc: "#4338CA", bdr: "#C7D2FE" },
    "In Progress": { bg: "#FEF3C7", tc: "#92400E", bdr: "#FDE68A" },
    "Submitted": { bg: "#DBEAFE", tc: "#1E40AF", bdr: "#BFDBFE" },
    "Closed": { bg: "#D1FAE5", tc: "#065F46", bdr: "#A7F3D0" },
  };
  const RevBadge = ({ status }) => {
    const c = REV_CLR[status] || REV_CLR["Not Started"];
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, background: c.bg, color: c.tc,
        border: "1px solid " + c.bdr, borderRadius: 100, padding: "2px 8px",
        display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap"
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.tc, display: "inline-block" }} />
        {status}
      </span>
    );
  };

  // ── Weight helpers ───────────────────────────────────────────────────────────
  const updW = (i, v) => { if (isHistorical) return; setComps(p => p.map((c, j) => j === i ? { ...c, weight: Math.max(0, Math.min(100, Number(v) || 0)) } : c)); setDirty(true); };
  const saveW = () => { if (!weightOk) { showToast("Weights must total 100%"); return; } setDirty(false); showToast("Weights saved", "#10B981"); };

  // ── Hike helpers ─────────────────────────────────────────────────────────────
  const getHike = code => (scoringHikes[quarter] ? scoringHikes[quarter][code] : undefined);
  const setHike = (code, v) => setScoringHikes(p => ({ ...p, [quarter]: { ...(p[quarter] || {}), [code]: v } }));
  const isLocked = code => (scoringLocked[quarter] ? !!scoringLocked[quarter][code] : false);

  const applySuggested = (code, score) => {
    if (!isLocked(code) && score !== null) {
      setHike(code, ((score / 100) * 4 * MULT).toFixed(2));
    }
  };

  const toggleLk = async (code) => {
    const nowLocked = !isLocked(code);
    setScoringLocked(p => ({ ...p, [quarter]: { ...(p[quarter] || {}), [code]: nowLocked } }));
    if (setAllReviews) {
      setAllReviews(prev => prev.map(r =>
        r.empId === code && r.quarter === quarter
          ? { ...r, status: nowLocked ? "Approved" : "Submitted" }
          : r
      ));
    }
    showToast(nowLocked ? "Hike locked — review marked Approved" : "Row unlocked — status returned to Submitted", nowLocked ? "#10B981" : "#64748B");
    const hikeValue = (nowLocked && scoringHikes && scoringHikes[quarter]) ? scoringHikes[quarter][code] : undefined;
    if (nowLocked) {
      try { await apiFetch(`/api/scoring/${code}/lock`, { method: "PUT" }); } catch (e) {}
      if (hikeValue !== undefined) {
        try { await apiFetch(`/api/scoring/${code}/hike`, { method: "PUT", body: JSON.stringify({ hike_pct: hikeValue }) }); } catch (e) {}
      }
    }
  };

  const bulkApprove = () => {
    const updates = {};
    displayScores.forEach(e => { if (e.score !== null && !isLocked(e.code)) updates[e.code] = ((e.score / 100) * 4 * MULT).toFixed(2); });
    setScoringHikes(p => ({ ...p, [quarter]: { ...(p[quarter] || {}), ...updates } }));
    showToast("All suggested hikes applied — review and lock each row", "#3B82F6");
  };

  const publishQuarter = () => {
    const lockUpd = {};
    displayScores.forEach(e => {
      const fin = getHike(e.code);
      if (e.score !== null && fin && fin !== "") lockUpd[e.code] = true;
    });
    setScoringLocked(p => ({ ...p, [quarter]: { ...(p[quarter] || {}), ...lockUpd } }));
    // Bridge: mark all reviews in this quarter as Approved
    if (setAllReviews) {
      setAllReviews(prev => prev.map(r =>
        r.quarter === quarter ? { ...r, status: "Approved" } : r
      ));
    }
    // Close the cycle
    if (setCycles && selCycle) {
      setCycles(prev => prev.map(c =>
        c.id === selCycle.id ? { ...c, status: "Closed", closed: true } : c
      ));
    }
    setShowPublishModal(false);
    showToast(quarter + " published — " + Object.keys(lockUpd).length + " hikes finalised & cycle closed", "#10B981");
  };

  // ── Publish readiness ────────────────────────────────────────────────────────
  const scoredEmps = displayScores.filter(e => e.score !== null);
  const hikedEmps = scoredEmps.filter(e => { const h = getHike(e.code); return h && h !== ""; });
  const lockedEmps = scoredEmps.filter(e => isLocked(e.code));
  const allHiked = scoredEmps.length > 0 && hikedEmps.length === scoredEmps.length;
  const allLocked = scoredEmps.length > 0 && lockedEmps.length === scoredEmps.length;
  const publishReady = allHiked;

  // ── Trend ────────────────────────────────────────────────────────────────────
  const chronoQtrs = [...allQtrs].reverse();
  const trendData = displayScores.map(e => ({
    name: e.name, code: e.code,
    trend: chronoQtrs.map(q => {
      const entry = (QUARTER_SCORES[q] || []).find(x => x.code === e.code);
      return { q: q.split(" ")[0] + " '" + q.split(" ")[1].slice(2), score: entry ? entry.score : null, hike: entry ? entry.approvedHike : null };
    })
  }));

  // ── Scoring Guide modal ──────────────────────────────────────────────────────
  const ScoringGuide = () => {
    const step = GUIDE_STEPS[guideStep];
    return (
      <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowGuide(false); }}>
        <div className="modal" style={{ maxWidth: 560 }}>
          <div style={{ borderRadius: "14px 14px 0 0", overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg," + step.color + "ee," + step.color + "99)", padding: "28px 28px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {GUIDE_STEPS.map((_, i) => (
                    <div key={i} onClick={() => setGuideStep(i)} style={{
                      width: i === guideStep ? 24 : 8, height: 8, borderRadius: 4,
                      background: i === guideStep ? "#fff" : "rgba(255,255,255,.4)", cursor: "pointer", transition: "width 0.2s"
                    }} />
                  ))}
                </div>
                <button onClick={() => setShowGuide(false)} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, color: "#fff", padding: "4px 10px", fontSize: 16, cursor: "pointer" }}>&#215;</button>
              </div>
              <div style={{ fontSize: 38, marginBottom: 10 }}>{step.icon}</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 19, color: "#fff", marginBottom: 4 }}>{step.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>Step {guideStep + 1} of {GUIDE_STEPS.length}</div>
            </div>
          </div>
          <div style={{ padding: "22px 26px" }}>
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, marginBottom: 14 }}>{step.body}</p>
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "11px 15px", display: "flex", gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>&#128161;</span>
              <p style={{ fontSize: 13, color: "#78350F", margin: 0, lineHeight: 1.7 }}>{step.tip}</p>
            </div>
          </div>
          <div style={{ padding: "0 26px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setGuideStep(s => s - 1)}
              style={{ opacity: guideStep === 0 ? 0.4 : 1, fontSize: 13, padding: "8px 16px", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, cursor: guideStep === 0 ? "default" : "pointer", color: "#475569" }}>
              &#8592; Previous
            </button>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Click dots to jump</span>
            {guideStep < GUIDE_STEPS.length - 1
              ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setGuideStep(s => s + 1)}>Next &#8594;</button>
              : <button className="btn-primary" style={{ fontSize: 13, background: "#10B981" }} onClick={() => setShowGuide(false)}>Got it &#10003;</button>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <TopBar title="Scoring & Hike Calculation" subtitle="Internal only — weighted competency scores and hike percentages" {...topBarProps} />

      {/* ── Guide banner ── */}
      <div style={{
        background: "linear-gradient(135deg,#0D1B2A,#1E3A5F)", borderRadius: 14, padding: "16px 22px", marginBottom: 18,
        display: "flex", alignItems: "center", gap: 14
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: "rgba(232,82,10,.25)", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
        }}>&#127891;</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 2 }}>New to Scoring & Hikes?</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>6-step walkthrough: weights → scores → hike formula → lock → publish</div>
        </div>
        <button onClick={() => { setGuideStep(0); setShowGuide(true); }}
          style={{ background: "#E8520A", border: "none", borderRadius: 9, color: "#fff", padding: "9px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          &#9654; Open Guide
        </button>
      </div>

      {/* ── Internal only banner ── */}
      <div style={{ background: "#FFF5F0", border: "1.5px solid #FED7C3", borderRadius: 10, padding: "10px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16 }}>&#128274;</span>
        <span style={{ fontSize: 13, color: "#92400E", fontWeight: 500 }}>
          <strong>Internal Only:</strong> Scores and hike percentages are never visible to stakeholders or employees.
        </span>
      </div>

      {/* ── Cycle selector + toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>Cycle:</span>
        <select value={selCycId} onChange={e => setSelCycId(e.target.value)}
          style={{
            padding: "7px 13px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 13,
            fontWeight: 600, color: "#0D1B2A", background: "#fff", cursor: "pointer", minWidth: 170
          }}>
          {scoringCycles.map(c => (
            <option key={c.id} value={c.id}>{c.q} {c.status === "Active" ? "— Active" : "— Closed"}</option>
          ))}
        </select>
        {selCycle && (
          <span style={{
            fontSize: 11, background: selCycle.status === "Active" ? "#D1FAE5" : "#F1F5F9",
            color: selCycle.status === "Active" ? "#065F46" : "#64748B",
            border: "1px solid " + (selCycle.status === "Active" ? "#A7F3D0" : "#E2E8F0"),
            borderRadius: 100, padding: "3px 10px", fontWeight: 700
          }}>
            {selCycle.status === "Active" ? "LIVE" : "CLOSED"}
          </span>
        )}
        {isHistorical && (
          <span style={{ fontSize: 11, color: "#64748B", background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 100, padding: "3px 10px" }}>
            &#128193; Read-only
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => { setGuideStep(0); setShowGuide(true); }}
            style={{
              padding: "7px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: "1.5px solid #E2E8F0", background: "#fff", color: "#475569"
            }}>
            &#127891; How-to Guide
          </button>
          <button onClick={() => setShowTrend(t => !t)}
            style={{
              padding: "7px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: "1.5px solid " + (showTrend ? "#8B5CF6" : "#E2E8F0"),
              background: showTrend ? "#F5F3FF" : "#fff", color: showTrend ? "#7C3AED" : "#475569"
            }}>
            &#128200; {showTrend ? "Hide" : "Show"} Trends
          </button>
        </div>
      </div>

      {/* ── Trend panel ── */}
      {showTrend && (
        <div className="card" style={{ padding: "20px 24px", marginBottom: 18, overflow: "hidden" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 4 }}>Employee Score Trend — All Quarters</div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>Score /100 · green = hike approved</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Employee</th>
                  {chronoQtrs.map(q => <th key={q} style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{q.replace(" 20", " '")}</th>)}
                  <th style={{ textAlign: "center" }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map(emp => {
                  const scores = emp.trend.map(t => t.score).filter(s => s !== null);
                  const delta = scores.length >= 2 ? (scores[scores.length - 1] - scores[0]).toFixed(1) : null;
                  return (
                    <tr key={emp.code}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={emp.name} size={26} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{emp.name}</div>
                            <div style={{ fontSize: 10, color: "#94A3B8" }}>{emp.code}</div>
                          </div>
                        </div>
                      </td>
                      {emp.trend.map((t, ti) => (
                        <td key={ti} style={{ textAlign: "center" }}>
                          {t.score !== null
                            ? <div>
                              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: scoreColor(t.score) }}>
                                {t.score.toFixed(1)}
                              </div>
                              {t.hike && <div style={{ fontSize: 9, color: "#10B981", fontWeight: 600 }}>{t.hike}%</div>}
                            </div>
                            : <span style={{ color: "#CBD5E1" }}>—</span>}
                        </td>
                      ))}
                      <td style={{ textAlign: "center" }}>
                        {delta !== null
                          ? <span style={{ fontWeight: 700, fontSize: 12, color: parseFloat(delta) >= 0 ? "#10B981" : "#EF4444" }}>
                            {parseFloat(delta) >= 0 ? "▲" : "▼"} {Math.abs(parseFloat(delta))}
                          </span>
                          : <span style={{ color: "#94A3B8" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "290px 1fr", gap: 16 }}>

        {/* ── Competency weights ── */}
        <div className="card" style={{ padding: "18px 20px", alignSelf: "start" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A" }}>Competency Weights</div>
            <span style={{
              fontSize: 10, color: isHistorical ? "#94A3B8" : "#10B981",
              background: isHistorical ? "#F1F5F9" : "#F0FDF4", padding: "2px 8px", borderRadius: 100
            }}>
              {isHistorical ? "Locked" : "Editable"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 14 }}>{quarter} · {isHistorical ? "Applied weights" : "Adjust and save"}</div>
          {comps.map((c, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>{c.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <input type="number" min={0} max={100} value={c.weight} onChange={e => updW(i, e.target.value)} disabled={isHistorical}
                    style={{
                      width: 52, padding: "3px 7px", fontSize: 12, fontWeight: 700, textAlign: "center",
                      color: isHistorical ? "#94A3B8" : "#E8520A",
                      border: "1.5px solid " + (isHistorical ? "#E2E8F0" : "#FED7C3"),
                      borderRadius: 7, background: isHistorical ? "#F8FAFC" : "#fff"
                    }} />
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>%</span>
                </div>
              </div>
              <input type="range" min={0} max={50} value={c.weight} onChange={e => updW(i, e.target.value)}
                disabled={isHistorical} style={{ width: "100%", accentColor: isHistorical ? "#CBD5E1" : "#E8520A", cursor: isHistorical ? "default" : "pointer" }} />
            </div>
          ))}
          <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Total</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: weightOk ? "#10B981" : "#EF4444" }}>{totalW}%</span>
          </div>
          {!isHistorical && (
            <>
              {!weightOk && <div style={{ fontSize: 11, color: "#EF4444", background: "#FEF2F2", padding: "7px 10px", borderRadius: 7, marginBottom: 8 }}>Weights must sum to exactly 100%.</div>}
              <button className="btn-primary" style={{
                width: "100%", justifyContent: "center", fontSize: 13,
                ...(!weightOk ? { background: "#E2E8F0", color: "#94A3B8", cursor: "not-allowed", boxShadow: "none", transform: "none" } : {})
              }}
                onClick={saveW}>
                {dirty ? "Save Weights" : <span>&#10003; Weights Saved</span>}
              </button>
            </>
          )}
          <div style={{ marginTop: 10, fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
            Multiplier: <strong style={{ color: "#E8520A" }}>{MULT}x</strong> · Max hike: <strong style={{ color: "#E8520A" }}>{4 * MULT}%</strong>
          </div>
        </div>

        {/* ── Results table ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A" }}>
                {isHistorical ? "Closed Appraisal Record" : "Appraisal Results"} — {quarter}
              </div>
              {!isHistorical && (
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  {lockedEmps.length}/{scoredEmps.length} locked · {hikedEmps.length}/{scoredEmps.length} hikes set
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!isHistorical && (
                <>
                  <button className="btn-secondary" style={{ fontSize: 12 }} onClick={bulkApprove}>&#9989; Bulk Apply Suggested</button>
                  <button onClick={() => setShowPublishModal(true)}
                    style={{
                      padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: publishReady ? "pointer" : "not-allowed",
                      border: "1.5px solid " + (publishReady ? "#10B981" : "#E2E8F0"),
                      background: publishReady ? "#10B981" : "#F8FAFC",
                      color: publishReady ? "#fff" : "#94A3B8",
                      opacity: publishReady ? 1 : 0.6
                    }}
                    disabled={!publishReady}>
                    &#128640; Publish Quarter
                  </button>
                </>
              )}
              <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => showToast("Excel export ready — download would begin in production", "#475569")}>&#128202; Export Excel</button>
              <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => showToast("PDF export ready — download would begin in production", "#475569")}>&#128196; Export PDF</button>
            </div>
          </div>

          {/* Progress bar for active quarter */}
          {!isHistorical && scoredEmps.length > 0 && (
            <div style={{ padding: "10px 18px", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", whiteSpace: "nowrap" }}>Publish progress:</span>
              <div style={{ flex: 1, background: "#E2E8F0", borderRadius: 100, height: 8, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 100, background: "#10B981",
                  width: (hikedEmps.length / scoredEmps.length * 100) + "%", transition: "width .4s"
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", whiteSpace: "nowrap" }}>
                {Math.round(hikedEmps.length / scoredEmps.length * 100)}%
              </span>
              {!publishReady && (
                <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600 }}>
                  &#9888; {scoredEmps.length - hikedEmps.length} hike{scoredEmps.length - hikedEmps.length !== 1 ? "s" : ""} missing
                </span>
              )}
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: isHistorical ? 780 : 960 }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Review Status</th>
                  <th>CTC ($/mo)</th>
                  <th>Score /100</th>
                  <th>Rating /4</th>
                  <th>Suggested %</th>
                  {isHistorical
                    ? <th>Approved Hike %</th>
                    : <><th>Hike %</th><th>New CTC</th><th>Row Status</th><th>Actions</th></>
                  }
                </tr>
              </thead>
              <tbody>
                {scoringLoading && <tr><td colSpan={10} style={{ textAlign: "center", color: "#94A3B8", padding: 24 }}>Loading scores...</td></tr>}
                {!scoringLoading && displayScores.length === 0 && <tr><td colSpan={10} style={{ textAlign: "center", color: "#94A3B8", padding: 24 }}>No scoring data for this cycle yet.</td></tr>}
                {displayScores.map(e => {
                  const sug = e.score !== null ? ((e.score / 100) * 4 * MULT).toFixed(2) : null;
                  const fin = isHistorical ? e.approvedHike : getHike(e.code);
                  const finNum = parseFloat(fin) || 0;
                  const hikeAmt = fin ? (e.ctc * (finNum / 100)).toFixed(0) : null;
                  const newCtc = fin ? (e.ctc + parseFloat(hikeAmt)).toFixed(0) : null;
                  const lk = !isHistorical && isLocked(e.code);
                  const rowStat = e.score === null ? "Pending" : lk ? "Locked" : (!fin || fin === "") ? "In Progress" : "Hike Set";
                  const revSt = getEmpReviewStatus(e.code);
                  const canScore = revSt === "Submitted" || revSt === "Closed";

                  return (
                    <tr key={e.code} style={{ background: lk ? "#FAFBFF" : "#fff", opacity: (!canScore && !isHistorical && e.score === null) ? 0.7 : 1 }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={e.name} size={28} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</div>
                            <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'JetBrains Mono',monospace" }}>{e.code}</div>
                          </div>
                        </div>
                      </td>
                      <td><RevBadge status={revSt} /></td>
                      <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: "#475569" }}>${e.ctc.toLocaleString()}</td>
                      <td>
                        {e.score !== null
                          ? <span style={{
                            fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 13,
                            background: scoreBg(e.score), color: scoreColor(e.score),
                            border: "1px solid " + scoreBdr(e.score), borderRadius: 8,
                            padding: "3px 9px", display: "inline-block"
                          }}>
                            {e.score.toFixed(2)}
                          </span>
                          : <span style={{ color: "#94A3B8", fontSize: 12 }}>Awaiting</span>}
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: e.score ? scoreColor(e.score) : "#94A3B8", fontSize: 12 }}>
                        {e.score !== null ? ((e.score / 100) * 4).toFixed(3) : "—"}
                      </td>
                      <td>
                        {sug
                          ? <span style={{ fontWeight: 700, color: "#E8520A", fontSize: 13 }}>{sug}%</span>
                          : <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>}
                      </td>

                      {isHistorical ? (
                        <td>
                          {e.approvedHike
                            ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: 14, color: "#10B981" }}>{e.approvedHike}%</span>
                            : <span style={{ color: "#94A3B8" }}>—</span>}
                        </td>
                      ) : (
                        <>
                          <td>
                            {e.score !== null
                              ? <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <input style={{
                                  width: 64, padding: "5px 7px", fontSize: 13, fontWeight: 700, textAlign: "center", borderRadius: 8,
                                  color: lk ? "#8B5CF6" : "#10B981", background: lk ? "#F5F3FF" : "#fff",
                                  borderColor: lk ? "#DDD6FE" : "#E2E8F0", border: "1.5px solid"
                                }}
                                  value={fin || ""} onChange={ev => !lk && setHike(e.code, ev.target.value)} disabled={lk} placeholder="—" />
                                <span style={{ fontSize: 12, color: "#64748B" }}>%</span>
                                {!lk && sug && (
                                  <button title={"Apply suggested: " + sug + "%"} onClick={() => applySuggested(e.code, e.score)}
                                    style={{
                                      background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6,
                                      color: "#10B981", fontSize: 12, fontWeight: 700, padding: "4px 8px", cursor: "pointer"
                                    }}>
                                    &#10003;
                                  </button>
                                )}
                              </div>
                              : <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>}
                          </td>
                          <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                            {newCtc
                              ? <div>
                                <div style={{ fontWeight: 700, color: "#10B981" }}>${parseFloat(newCtc).toLocaleString()}</div>
                                <div style={{ fontSize: 10, color: "#94A3B8" }}>+${parseFloat(hikeAmt).toLocaleString()}/mo</div>
                              </div>
                              : <span style={{ color: "#94A3B8" }}>—</span>}
                          </td>
                          <td>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100,
                              background: rowStat === "Locked" ? "#EDE9FE" : rowStat === "Hike Set" ? "#D1FAE5" : rowStat === "In Progress" ? "#FEF3C7" : "#F1F5F9",
                              color: rowStat === "Locked" ? "#6D28D9" : rowStat === "Hike Set" ? "#065F46" : rowStat === "In Progress" ? "#92400E" : "#94A3B8",
                              border: "1px solid " + (rowStat === "Locked" ? "#DDD6FE" : rowStat === "Hike Set" ? "#A7F3D0" : rowStat === "In Progress" ? "#FDE68A" : "#E2E8F0")
                            }}>
                              {rowStat}
                            </span>
                          </td>
                          <td>
                            {e.score !== null && (
                              <button onClick={() => toggleLk(e.code)}
                                style={{
                                  background: lk ? "#EDE9FE" : "#F1F5F9", color: lk ? "#6D28D9" : "#64748B",
                                  border: "1.5px solid " + (lk ? "#DDD6FE" : "#E2E8F0"), borderRadius: 7,
                                  padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer"
                                }}>
                                {lk ? <span>&#128274; Locked</span> : "Lock"}
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Publish Confirm Modal ── */}
      {showPublishModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowPublishModal(false); }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div style={{
              padding: "22px 26px", background: "linear-gradient(135deg,#065F46,#10B981)", borderRadius: "14px 14px 0 0",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>Publish Quarter</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 2 }}>{quarter}</div>
              </div>
              <button onClick={() => setShowPublishModal(false)} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, color: "#fff", padding: "5px 11px", fontSize: 18, cursor: "pointer" }}>&#215;</button>
            </div>
            <div style={{ padding: "22px 26px" }}>
              <div style={{ fontSize: 14, color: "#0D1B2A", lineHeight: 1.8, marginBottom: 16 }}>
                This will <strong>lock all {hikedEmps.length} hike rows</strong> and mark them as finalised.
              </div>
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 9, padding: "11px 14px", fontSize: 13, color: "#92400E" }}>
                &#9888; This action cannot be undone. Make sure all hike values are correct before publishing.
              </div>
              {!allLocked && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 9, padding: "11px 14px", fontSize: 13, color: "#1E40AF", marginTop: 10 }}>
                  &#8505; {scoredEmps.length - lockedEmps.length} row{scoredEmps.length - lockedEmps.length !== 1 ? "s" : ""} not yet individually locked — publishing will lock them all.
                </div>
              )}
            </div>
            <div style={{ padding: "0 26px 22px", display: "flex", gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowPublishModal(false)}>Cancel</button>
              <button onClick={publishQuarter}
                style={{
                  flex: 1, background: "#10B981", color: "#fff", border: "none", borderRadius: 9,
                  padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer"
                }}>
                &#128640; Publish Now
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, background: toast.color, color: "#fff",
          padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,.25)", zIndex: 999, display: "flex", alignItems: "center", gap: 8
        }}>
          &#10003; {toast.msg}
        </div>
      )}
      {showGuide && <ScoringGuide />}
    </div>
  );
};

export default Scoring;
