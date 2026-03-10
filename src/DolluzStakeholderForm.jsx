import { useState, useEffect, useRef } from "react";
import { apiFetch } from "./utils/api";

const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { min-height: 100vh; }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes slideUp  { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shake    { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
    @keyframes pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.95)} }
    @keyframes spin     { to { transform: rotate(360deg); } }
    @keyframes pop      { 0%{transform:scale(.8);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
    @keyframes countdown { from{stroke-dashoffset:0} to{stroke-dashoffset:138} }
    @keyframes gradMove { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes checkDraw { from{stroke-dashoffset:50} to{stroke-dashoffset:0} }

    .fade-up  { animation: fadeUp  .55s cubic-bezier(.22,1,.36,1) both; }
    .slide-up { animation: slideUp .6s  cubic-bezier(.22,1,.36,1) both; }
    .fade-in  { animation: fadeIn  .4s  ease both; }
    .pop      { animation: pop     .4s  cubic-bezier(.22,1,.36,1) both; }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: #E8520A44; border-radius: 10px; }

    .otp-input {
      width: 52px; height: 58px; text-align: center;
      font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 600;
      border: 2px solid #E2E8F0; border-radius: 12px;
      color: #0D1B2A; background: #fff; outline: none;
      transition: border-color .2s, box-shadow .2s, transform .15s;
      caret-color: #E8520A;
    }
    .otp-input:focus {
      border-color: #E8520A;
      box-shadow: 0 0 0 4px rgba(232,82,10,.12);
      transform: scale(1.05);
    }
    .otp-input.filled { border-color: #10B981; background: #F0FDF4; }
    .otp-input.error  { border-color: #EF4444; animation: shake .4s ease; }

    .rating-btn {
      flex: 1; padding: 10px 6px; border-radius: 10px;
      border: 2px solid #E2E8F0; background: #fff;
      font-family: 'DM Sans', sans-serif; font-size: 11.5px; font-weight: 500;
      color: #94A3B8; cursor: pointer; transition: all .18s;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      position: relative; overflow: hidden;
    }
    .rating-btn:hover { border-color: #CBD5E1; color: #475569; transform: translateY(-1px); }
    .rating-btn.selected-1 { border-color: #EF4444; background: #FEF2F2; color: #DC2626; font-weight: 700; }
    .rating-btn.selected-2 { border-color: #F59E0B; background: #FFFBEB; color: #D97706; font-weight: 700; }
    .rating-btn.selected-3 { border-color: #3B82F6; background: #EFF6FF; color: #2563EB; font-weight: 700; }
    .rating-btn.selected-4 { border-color: #10B981; background: #F0FDF4; color: #059669; font-weight: 700; }

    .form-input {
      width: 100%; padding: 11px 14px;
      font-family: 'DM Sans', sans-serif; font-size: 14px;
      border: 2px solid #E2E8F0; border-radius: 10px;
      color: #0D1B2A; background: #fff; outline: none;
      transition: border-color .2s, box-shadow .2s;
    }
    .form-input:focus {
      border-color: #E8520A;
      box-shadow: 0 0 0 4px rgba(232,82,10,.1);
    }

    .step-btn {
      padding: 13px 28px; border-radius: 12px; border: none;
      font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all .2s;
      display: inline-flex; align-items: center; gap: 8px;
    }
    .step-btn-primary {
      background: linear-gradient(135deg, #E8520A, #FF7434);
      color: #fff; box-shadow: 0 4px 20px rgba(232,82,10,.3);
    }
    .step-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(232,82,10,.4);
    }
    .step-btn-primary:active { transform: translateY(0); }
    .step-btn-primary:disabled {
      background: #E2E8F0; color: #94A3B8;
      box-shadow: none; cursor: not-allowed; transform: none;
    }
    .step-btn-secondary {
      background: #fff; color: #475569;
      border: 2px solid #E2E8F0 !important;
    }
    .step-btn-secondary:hover { border-color: #CBD5E1 !important; background: #F8FAFC; }

    .progress-track { height: 4px; background: #F1F5F9; border-radius: 100px; overflow: hidden; }
    .progress-fill  {
      height: 100%; border-radius: 100px;
      background: linear-gradient(90deg, #E8520A, #FF8C5A);
      transition: width .6s cubic-bezier(.22,1,.36,1);
    }

    .section-card {
      background: #fff; border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
      margin-bottom: 16px; overflow: hidden;
    }

    .copy-checkbox {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 16px 18px; background: #FFF8F5;
      border: 2px solid #FED7C3; border-radius: 12px; cursor: pointer;
    }
    .copy-checkbox input[type=checkbox] {
      width: 18px; height: 18px; margin-top: 1px; cursor: pointer;
      accent-color: #E8520A; flex-shrink: 0;
    }
  `}</style>
);

/* ─── Constants ─────────────────────────────────────────────────────── */
const CRITERIA = [
  { id: 1, label: "Works to Full Potential", section: "Performance" },
  { id: 2, label: "Quality of Work", section: "Performance" },
  { id: 3, label: "Work Consistency", section: "Performance" },
  { id: 4, label: "Communication", section: "Interpersonal" },
  { id: 5, label: "Independent Work", section: "Performance" },
  { id: 6, label: "Takes Initiative", section: "Performance" },
  { id: 7, label: "Group Work", section: "Interpersonal" },
  { id: 8, label: "Productivity", section: "Performance" },
  { id: 9, label: "Creativity", section: "Performance" },
  { id: 10, label: "Honesty", section: "Values" },
  { id: 11, label: "Integrity", section: "Values" },
  { id: 12, label: "Coworker Relations", section: "Interpersonal" },
  { id: 13, label: "Client Relations", section: "Interpersonal" },
  { id: 14, label: "Technical Skills", section: "Performance" },
  { id: 15, label: "Dependability", section: "Values" },
  { id: 16, label: "Punctuality", section: "Conduct" },
  { id: 17, label: "Attendance", section: "Conduct" },
];

const RATINGS = [
  { value: 1, label: "Unsatisfactory", short: "Unsat.", emoji: "😟", color: "1" },
  { value: 2, label: "Satisfactory", short: "Sat.", emoji: "🙂", color: "2" },
  { value: 3, label: "Good", short: "Good", emoji: "😊", color: "3" },
  { value: 4, label: "Excellent", short: "Excel.", emoji: "🌟", color: "4" },
];

const SECTIONS = ["Performance", "Interpersonal", "Values", "Conduct"];

/* ─── Background ─────────────────────────────────────────────────────── */
const Bg = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 0,
    background: "linear-gradient(135deg, #0D1B2A 0%, #1A3A5C 40%, #0D2E1E 100%)",
    backgroundSize: "400% 400%", animation: "gradMove 12s ease infinite",
    overflow: "hidden",
  }}>
    {/* Decorative circles */}
    {[
      { w: 500, h: 500, t: -100, l: -150, op: .06 },
      { w: 400, h: 400, t: "auto", b: -80, r: -100, op: .05 },
      { w: 300, h: 300, t: 160, r: 80, op: .04 },
    ].map((c, i) => (
      <div key={i} style={{
        position: "absolute", width: c.w, height: c.h,
        top: c.t, left: c.l, bottom: c.b, right: c.r,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(232,82,10,${c.op * 3}) 0%, transparent 70%)`,
        opacity: c.op * 10,
      }} />
    ))}
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `radial-gradient(circle, rgba(255,255,255,.015) 1px, transparent 1px)`,
      backgroundSize: "28px 28px",
    }} />
  </div>
);

/* ─── Screen: Email Entry ─────────────────────────────────────────────── */
const EmailScreen = ({ onNext }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
    setError(""); setLoading(true);
    try {
      const res = await apiFetch("/api/auth/stakeholder/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to send OTP."); return; }
      onNext(email, data._devOtp || null);
    } catch (e) {
      setError("Network error. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="slide-up" style={{ width: "100%", maxWidth: 440 }}>
      {/* Card */}
      <div style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", boxShadow: "0 32px 80px rgba(0,0,0,.3)" }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: "#0D1B2A", letterSpacing: -1 }}>
            Dolluz<span style={{ color: "#E8520A" }}>.</span>
          </div>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginTop: 3 }}>
            Employee Performance Review
          </div>
        </div>

        {/* Employee info banner */}
        <div style={{ background: "linear-gradient(135deg,#F0F9FF,#EFF6FF)", border: "1.5px solid #BFDBFE", borderRadius: 14, padding: "14px 16px", marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: "#3B82F6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>You are reviewing</div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 17, color: "#0D1B2A" }}>Rajesh T</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>Reimbursement Coordinator · HCL Healthcare · Q1 2026</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 11, background: "#DBEAFE", color: "#1D4ED8", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>Medical Billing Dept.</span>
            <span style={{ fontSize: 11, background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>DZIND109</span>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 7 }}>
            Enter your work email to continue
          </label>
          <input
            className="form-input"
            type="email"
            placeholder="yourname@hcl.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handle()}
            style={{ fontSize: 15 }}
          />
          {error && (
            <div style={{ marginTop: 8, fontSize: 12, color: "#DC2626", display: "flex", alignItems: "flex-start", gap: 6, animation: "fadeIn .3s ease" }}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}
          {!error && (
            <div style={{ marginTop: 7, fontSize: 11, color: "#94A3B8" }}>
              Your domain will be validated against HCL Healthcare's authorised domains.
            </div>
          )}
        </div>

        <button
          className="step-btn step-btn-primary"
          style={{ width: "100%", justifyContent: "center", fontSize: 15 }}
          onClick={handle}
          disabled={!email || loading}
        >
          {loading
            ? <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} /> Verifying…</>
            : <>Continue <span>→</span></>
          }
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "#94A3B8" }}>
          Need help? Contact <span style={{ color: "#E8520A", fontWeight: 600 }}>admin@dolluz.com</span>
        </div>
      </div>

      {/* Hint */}
    </div>
  );
};

/* ─── Screen: OTP ─────────────────────────────────────────────────────── */
const OTPScreen = ({ email, devOtp, onNext }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 min
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    refs[0].current?.focus();
    // pre-fill devOtp digits if server returned it (development mode only)
    if (devOtp && /^\d{6}$/.test(devOtp)) {
      setOtp(devOtp.split(""));
    }
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line

  const handleKey = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setErrorMsg("");
    if (val && i < 5) refs[i + 1].current?.focus();
  };

  const handleBackspace = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const verify = async () => {
    const code = otp.join("");
    if (code.length < 6) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/stakeholder/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Incorrect OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => refs[0].current?.focus(), 50);
        return;
      }
      onNext(data.token, data.reviewIds);
    } catch (e) {
      setErrorMsg("Network error. Please try again.");
    } finally { setLoading(false); }
  };

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const filled = otp.filter(Boolean).length;
  const pct = (600 - countdown) / 600;

  return (
    <div className="slide-up" style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", boxShadow: "0 32px 80px rgba(0,0,0,.3)" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: "#0D1B2A" }}>
            Dolluz<span style={{ color: "#E8520A" }}>.</span>
          </div>
        </div>

        {/* Icon */}
        <div style={{ textAlign: "center", margin: "20px 0 24px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#FFF5F0,#FED7C3)", border: "2px solid #FED7C3", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
            📬
          </div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: "#0D1B2A", marginTop: 14 }}>
            Check your inbox
          </div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 6, lineHeight: 1.5 }}>
            We sent a 6-digit code to<br />
            <span style={{ fontWeight: 700, color: "#E8520A" }}>{email}</span>
          </div>
        </div>

        {/* Countdown ring */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="30" cy="30" r="22" fill="none" stroke="#F1F5F9" strokeWidth="4" />
              <circle cx="30" cy="30" r="22" fill="none"
                stroke={countdown < 60 ? "#EF4444" : "#E8520A"} strokeWidth="4"
                strokeDasharray="138" strokeDashoffset={138 * pct}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset .9s linear" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color: countdown < 60 ? "#EF4444" : "#0D1B2A" }}>
              {fmt(countdown)}
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>code expires</div>
        </div>

        {/* OTP inputs */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {otp.map((v, i) => (
            <input
              key={i} ref={refs[i]}
              className={`otp-input ${v ? "filled" : ""} ${errorMsg ? "error" : ""}`}
              maxLength={1} value={v} type="text" inputMode="numeric"
              onChange={e => handleKey(i, e.target.value)}
              onKeyDown={e => handleBackspace(i, e)}
            />
          ))}
        </div>

        {errorMsg && (
          <div style={{ textAlign: "center", fontSize: 13, color: "#DC2626", marginBottom: 16, animation: "fadeIn .3s ease" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <button
          className="step-btn step-btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={verify}
          disabled={filled < 6 || loading}
        >
          {loading
            ? <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} /> Verifying…</>
            : "Verify & Open Review"
          }
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#94A3B8" }}>
          Didn't receive it? <span style={{ color: "#E8520A", fontWeight: 600, cursor: "pointer" }}>Resend code</span>
        </div>

      </div>
    </div>
  );
};

/* ─── Screen: Review Form ─────────────────────────────────────────────── */
const FormScreen = ({ onSubmit, sendCopy, setSendCopy, token, reviewId, reviewData }) => {
  const [ratings, setRatings] = useState({});
  const [prevGoals, setPrevGoals] = useState("");
  const [nextGoals, setNextGoals] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("Performance");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Use criteria from server if available, otherwise fall back to static CRITERIA
  const criteria = (reviewData && reviewData.criteria && reviewData.criteria.length)
    ? reviewData.criteria
    : CRITERIA;

  // Pre-fill any previously saved responses
  useEffect(() => {
    if (reviewData && reviewData.responses && reviewData.responses.length) {
      const saved = {};
      reviewData.responses.forEach(r => { saved[r.criterion_id] = r.rating; });
      setRatings(saved);
    }
    if (reviewData && reviewData.text) {
      if (reviewData.text.prev_goals) setPrevGoals(reviewData.text.prev_goals);
      if (reviewData.text.next_goals) setNextGoals(reviewData.text.next_goals);
      if (reviewData.text.free_feedback) setFeedback(reviewData.text.free_feedback);
    }
  }, [reviewData]);

  // Auto-save every 2 minutes (visual only — real save is on submit)
  useEffect(() => {
    const t = setInterval(() => {
      setSaving(true);
      setTimeout(() => { setSaving(false); setJustSaved(true); setTimeout(() => setJustSaved(false), 2500); }, 800);
    }, 20000);
    return () => clearInterval(t);
  }, []);

  const totalRated = Object.keys(ratings).length;
  const progress = Math.round((totalRated / criteria.length) * 100);
  const sectionCriteria = s => criteria.filter(c => c.section === s).sort((a, b) => a.id - b.id);
  const sectionProgress = s => {
    const c = sectionCriteria(s);
    const done = c.filter(cr => ratings[cr.id]).length;
    return Math.round((done / c.length) * 100);
  };

  const hasAnyInput = totalRated > 0 || prevGoals.trim().length > 0 || nextGoals.trim().length > 0 || feedback.trim().length > 0;

  const saveProgress = () => {
    if (!hasAnyInput) return;
    setSaving(true);
    setTimeout(() => { setSaving(false); setJustSaved(true); setTimeout(() => setJustSaved(false), 2500); }, 800);
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const responses = Object.entries(ratings).map(([criterion_id, rating]) => ({
        criterion_id: parseInt(criterion_id),
        rating,
        comment: "",
      }));
      const res = await apiFetch(`/api/reviews/${reviewId}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ responses, prev_goals: prevGoals, next_goals: nextGoals, free_feedback: feedback, send_copy: sendCopy }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.message || "Submission failed. Please try again."); return; }
      onSubmit();
    } catch (e) {
      setSubmitError("Network error. Please try again.");
    } finally { setSubmitting(false); }
  };

  const ratingColor = v => ["", "#EF4444", "#F59E0B", "#3B82F6", "#10B981"][v] || "#E2E8F0";

  // Employee info from reviewData
  const emp = reviewData && reviewData.review ? reviewData.review : {};
  const empName = emp.employee_name || "Employee";
  const empCode = emp.employee_code || "";
  const empRole = emp.designation || "";
  const empDept = emp.department || "";
  const empClient = emp.client_name || "";
  const empCycle = emp.cycle_name || "";
  const stName = emp.stakeholder_name || "";
  const empInitials = empName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ width: "100%", maxWidth: 760, paddingBottom: 40 }}>
      {/* Sticky header */}
      <div style={{
        background: "rgba(13,27,42,.92)", backdropFilter: "blur(16px)",
        borderRadius: 18, padding: "16px 24px", marginBottom: 20,
        boxShadow: "0 8px 32px rgba(0,0,0,.3)", position: "sticky", top: 16, zIndex: 10
      }} className="fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: -.5 }}>
              Dolluz<span style={{ color: "#E8520A" }}>.</span>
              <span style={{ fontWeight: 400, fontSize: 13, color: "rgba(255,255,255,.5)", marginLeft: 8 }}>Performance Review</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {justSaved && (
              <span style={{ fontSize: 12, color: "#10B981", animation: "fadeIn .3s ease", display: "flex", alignItems: "center", gap: 5 }}>
                <span>✓</span> Saved
              </span>
            )}
            {saving && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                Saving…
              </span>
            )}
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "rgba(255,255,255,.5)", background: "rgba(255,255,255,.08)", padding: "4px 10px", borderRadius: 8 }}>
              {empCycle || "Active Cycle"}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: progress === 100 ? "#10B981" : "#E8520A" }}>{progress}%</span>
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "rgba(255,255,255,.4)" }}>
          <span>{totalRated} of {criteria.length} criteria rated</span>
          <span>{criteria.length - totalRated} remaining</span>
        </div>
      </div>

      {/* Employee info card */}
      <div className="section-card fade-up" style={{ padding: "20px 24px", background: "linear-gradient(135deg,#0D1B2A,#1A3A5C)", border: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "0 0 auto" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#E8520A,#FF8C5A)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", flexShrink: 0 }}>{empInitials}</div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>{empName}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 }}>{empRole}{empCode ? ` · ${empCode}` : ""}</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 44, background: "rgba(255,255,255,.12)", flexShrink: 0, display: "none" }} className="info-divider" />

          {/* Meta fields — 2-line each, evenly spaced */}
          <div style={{ marginLeft: "auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px 24px", minWidth: 0 }}>
            {[
              ["Client", empClient],
              ["Dept", empDept],
              ["Quarter", empCycle],
              ["Reviewer", stName],
            ].map(([label, value]) => (
              <div key={label} style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.38)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.9)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }} className="fade-up">
        {SECTIONS.map(s => {
          const pct = sectionProgress(s);
          const isActive = activeSection === s;
          return (
            <button key={s} onClick={() => setActiveSection(s)} style={{
              flex: 1, padding: "10px 8px", borderRadius: 12, border: "2px solid",
              borderColor: isActive ? "#E8520A" : "#E2E8F0",
              background: isActive ? "#FFF5F0" : "#fff",
              cursor: "pointer", transition: "all .2s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#E8520A" : "#64748B" }}>{s}</span>
              <div style={{ width: "100%", height: 3, background: "#F1F5F9", borderRadius: 100, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#10B981" : "#E8520A", borderRadius: 100, transition: "width .4s" }} />
              </div>
              <span style={{ fontSize: 10, color: pct === 100 ? "#10B981" : "#94A3B8", fontWeight: 600 }}>{pct}%</span>
            </button>
          );
        })}
      </div>

      {/* Criteria for active section */}
      <div className="section-card fade-up">
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A" }}>{activeSection}</div>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{sectionCriteria(activeSection).length} criteria</span>
        </div>
        <div style={{ padding: "4px 0" }}>
          {sectionCriteria(activeSection).map((c, ci) => {
            const selected = ratings[c.id];
            return (
              <div key={c.id} style={{
                padding: "16px 22px",
                borderBottom: ci < sectionCriteria(activeSection).length - 1 ? "1px solid #F8FAFC" : "none",
                background: selected ? `${ratingColor(selected)}08` : "#fff",
                transition: "background .2s"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: selected ? ratingColor(selected) : "#F1F5F9", color: selected ? "#fff" : "#94A3B8", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}>
                    {selected ? "✓" : c.id}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>{c.label}</span>
                  {selected && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: ratingColor(selected) }}>{RATINGS[selected - 1].label}</span>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {RATINGS.map(r => (
                    <button key={r.value}
                      className={`rating-btn ${selected === r.value ? `selected-${r.value}` : ""}`}
                      onClick={() => setRatings(prev => ({ ...prev, [c.id]: r.value }))}
                    >
                      <span style={{ fontSize: 16 }}>{r.emoji}</span>
                      <span>{r.short}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save & Exit — visible from first touch, disabled until hasAnyInput */}
      {hasAnyInput && (
        <div className="fade-up" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button className="step-btn step-btn-secondary"
            style={{ fontSize: 13, padding: "10px 20px" }}
            onClick={saveProgress}
          >
            💾 Save & Exit
          </button>
        </div>
      )}

      {/* Goals & Feedback (show after Performance section rated) */}
      {totalRated >= 5 && (
        <div className="fade-up">
          {/* Previous Goals */}
          <div className="section-card">
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A" }}>Goals — Previous Period (Q4 2025)</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>How well were the goals set in Q4 2025 achieved?</div>
            </div>
            <div style={{ padding: "18px 22px" }}>
              <textarea className="form-input" rows={3}
                placeholder="Describe the goals set in the previous period and the level of achievement…"
                value={prevGoals} onChange={e => setPrevGoals(e.target.value)}
                style={{ resize: "vertical", lineHeight: 1.6 }}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "#94A3B8", marginTop: 5 }}>{prevGoals.length} characters</div>
            </div>
          </div>

          {/* Next Goals */}
          <div className="section-card">
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A" }}>Goals — Next Period (Q2 2026)</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>What goals are you setting for this associate in Q2 2026?</div>
            </div>
            <div style={{ padding: "18px 22px" }}>
              <textarea className="form-input" rows={3}
                placeholder="Set clear, measurable goals for the next review period…"
                value={nextGoals} onChange={e => setNextGoals(e.target.value)}
                style={{ resize: "vertical", lineHeight: 1.6 }}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: "#94A3B8", marginTop: 5 }}>{nextGoals.length} characters</div>
            </div>
          </div>

          {/* Feedback */}
          <div className="section-card">
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A" }}>Overall Feedback</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Optional — any additional comments, commendations, or areas of improvement</div>
            </div>
            <div style={{ padding: "18px 22px" }}>
              <textarea className="form-input" rows={3}
                placeholder="Share any additional observations about this associate's performance…"
                value={feedback} onChange={e => setFeedback(e.target.value)}
                style={{ resize: "vertical", lineHeight: 1.6 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit zone */}
      {totalRated >= 5 && (
        <div className="section-card fade-up" style={{ padding: "24px 26px" }}>
          {/* Send copy checkbox */}
          <label className="copy-checkbox" style={{ marginBottom: 24 }}>
            <input type="checkbox" checked={sendCopy} onChange={e => setSendCopy(e.target.checked)} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#92400E" }}>
                📧 Send a copy of this response to my email
              </div>
              <div style={{ fontSize: 12, color: "#B45309", marginTop: 3, lineHeight: 1.5 }}>
                A PDF copy of your completed review will be sent to your authenticated email. A copy will also be sent to the primary stakeholder (if different from you).
              </div>
            </div>
          </label>

          {/* Completion check */}
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Review Completeness</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                ["Performance Criteria", `${totalRated}/${criteria.length} rated`, totalRated === criteria.length],
                ["Previous Period Goals", prevGoals.trim().length > 10 ? "Completed" : "Required", prevGoals.trim().length > 10],
                ["Next Period Goals", nextGoals.trim().length > 10 ? "Completed" : "Required", nextGoals.trim().length > 10],
              ].map(([l, v, done]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#64748B" }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: done ? "#10B981" : "#EF4444", display: "flex", alignItems: "center", gap: 4 }}>
                    {done ? "✓" : "○"} {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {submitError && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
              ⚠️ {submitError}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button className="step-btn step-btn-secondary"
              style={{
                flex: "0 0 auto", fontSize: 14, padding: "12px 22px",
                opacity: hasAnyInput ? 1 : 0.45,
                cursor: hasAnyInput ? "pointer" : "not-allowed"
              }}
              onClick={saveProgress}
              disabled={!hasAnyInput}
            >
              💾 Save & Exit
            </button>
            <button
              className="step-btn step-btn-primary"
              style={{ flex: 1, justifyContent: "center", fontSize: 15, padding: "14px" }}
              onClick={handleSubmit}
              disabled={submitting || totalRated < criteria.length || prevGoals.trim().length <= 10 || nextGoals.trim().length <= 10}
            >
              {submitting
                ? <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} /> Submitting…</>
                : totalRated < criteria.length
                  ? `Rate ${criteria.length - totalRated} more criteria to submit`
                  : (prevGoals.trim().length <= 10 || nextGoals.trim().length <= 10)
                    ? "Please complete Goals fields to submit"
                    : "Submit Review ✓"
              }
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
            Once submitted, this review link will expire permanently.<br />
            For amendments, contact <span style={{ color: "#E8520A" }}>admin@dolluz.com</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Screen: Submitted ───────────────────────────────────────────────── */
const SubmittedScreen = ({ sendCopy, employeeName, cycleName, criteriaCount, submittedAt }) => (
  <div className="pop" style={{ width: "100%", maxWidth: 420 }}>
    <div style={{ background: "#fff", borderRadius: 24, padding: "48px 36px", boxShadow: "0 32px 80px rgba(0,0,0,.3)", textAlign: "center" }}>
      {/* Animated checkmark */}
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", border: "3px solid #10B981", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M7 18L14 25L29 10" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="50" strokeDashoffset="0" style={{ animation: "checkDraw .6s ease .2s both" }} />
        </svg>
      </div>

      <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: "#0D1B2A", marginBottom: 8 }}>
        Review Submitted!
      </div>
      <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 24 }}>
        Thank you for completing the performance review for <strong>{employeeName || "this associate"}</strong>{cycleName ? ` (${cycleName})` : ""}.<br />
        Your response has been received by the Dolluz team.
      </div>

      {/* Summary chips — PDF chip conditional on sendCopy */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {[
          ["📋", `${criteriaCount || 17} criteria rated`, true],
          ["📅", `Submitted: ${submittedAt || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, true],
          ["🔒", "This link has now expired", true],
          ["📧", "PDF copy sent to your email", sendCopy],
        ].filter(([, , show]) => show).map(([icon, text]) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 13, color: "#475569" }}>
            <span>{icon}</span><span>{text}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
        For any amendments or queries, please contact<br />
        <span style={{ color: "#E8520A", fontWeight: 600 }}>admin@dolluz.com</span>
      </div>

      {/* Dolluz branding */}
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #F1F5F9" }}>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: "#0D1B2A" }}>
          Dolluz<span style={{ color: "#E8520A" }}>.</span>
        </div>
        <div style={{ fontSize: 10, color: "#94A3B8", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>
          Employee Performance Review
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main App ────────────────────────────────────────────────────────── */
export default function App() {
  const [step, setStep] = useState("email"); // email | otp | form | submitted
  const [email, setEmail] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [token, setToken] = useState(null);
  const [reviewId, setReviewId] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [sendCopy, setSendCopy] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(null);

  // Read ?r= param from URL to use as preferred review ID
  const urlReviewId = (() => {
    try { return new URLSearchParams(window.location.search).get("r"); } catch { return null; }
  })();

  const steps = { email: 0, otp: 1, form: 2, submitted: 3 };
  const currentStep = steps[step];

  // After OTP verification: pick the right reviewId and fetch form data
  const handleOtpSuccess = async (tok, reviewIds) => {
    setToken(tok);
    // Prefer URL param review ID if it's in the list, otherwise first in list
    const preferred = reviewIds.find(id => String(id) === String(urlReviewId)) || reviewIds[0];
    setReviewId(preferred);
    try {
      const res = await apiFetch(`/api/reviews/${preferred}/form`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setReviewData(data.data);
    } catch (e) {
      // Form loads with fallback static data if fetch fails
    }
    setStep("form");
  };

  const handleSubmitSuccess = () => {
    setSubmittedAt(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
    setStep("submitted");
  };

  const criteriaCount = reviewData && reviewData.criteria ? reviewData.criteria.length : 17;
  const emp = reviewData && reviewData.review ? reviewData.review : {};

  return (
    <>
      <FontLink />
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: step === "form" ? "20px 16px" : "24px 16px",
        position: "relative", fontFamily: "'DM Sans',sans-serif"
      }}>
        <Bg />

        {/* Step indicator (not on submitted) */}
        {step !== "submitted" && (
          <div className="fade-in" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            {["Verify Email", "Enter OTP", "Complete Review"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: i < currentStep ? "#10B981" : i === currentStep ? "#E8520A" : "rgba(255,255,255,.15)",
                    color: "#fff", fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .3s"
                  }}>{i < currentStep ? "✓" : i + 1}</div>
                  <span style={{ fontSize: 12, color: i <= currentStep ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.35)", fontWeight: i === currentStep ? 600 : 400 }}>{s}</span>
                </div>
                {i < 2 && <div style={{ width: 28, height: 1, background: i < currentStep ? "#10B981" : "rgba(255,255,255,.15)", transition: "background .3s" }} />}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: "center" }}>
          {step === "email" && (
            <EmailScreen onNext={(e, dOtp) => { setEmail(e); setDevOtp(dOtp); setStep("otp"); }} />
          )}
          {step === "otp" && (
            <OTPScreen email={email} devOtp={devOtp} onNext={handleOtpSuccess} />
          )}
          {step === "form" && (
            <FormScreen
              sendCopy={sendCopy} setSendCopy={setSendCopy}
              token={token} reviewId={reviewId} reviewData={reviewData}
              onSubmit={handleSubmitSuccess}
            />
          )}
          {step === "submitted" && (
            <SubmittedScreen
              sendCopy={sendCopy}
              employeeName={emp.employee_name}
              cycleName={emp.cycle_name}
              criteriaCount={criteriaCount}
              submittedAt={submittedAt}
            />
          )}
        </div>

        {/* Footer */}
        {step !== "submitted" && (
          <div style={{ position: "relative", zIndex: 1, marginTop: 20, fontSize: 11, color: "rgba(255,255,255,.3)", textAlign: "center" }}>
            Secured by Dolluz Corp · EPR Portal · {new Date().getFullYear()} · Confidential
          </div>
        )}
      </div>
    </>
  );
}
