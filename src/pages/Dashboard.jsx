import Toast from "../components/Toast";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import TopBar from "../components/TopBar";
import KpiCard from "../components/KpiCard";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import { gapPct } from "../constants";
import { apiFetch } from "../utils/api";

const Dashboard = ({ employees, setPage, topBarProps, allReviews, clients, cycles }) => {
  const reviews = allReviews || [];
  const pending = reviews.filter(r => ["Pending", "Email Sent", "In Progress", "Not Started", "Initiated"].includes(r.status)).length;
  const leaking = (employees || []).filter(e => gapPct(e) > 0).length;
  const [localRv, setLocalRv] = useState(reviews);

  useEffect(() => {
    if (allReviews && allReviews.length > 0) setLocalRv(allReviews);
  }, [allReviews]);

  // Active cycle label for subtitle
  const activeCycle = (cycles || []).find(c => c.status === "Active");
  const cycleLabel = activeCycle ? activeCycle.q + " · Review cycle in progress" : "No active cycle";

  // Build trend chart from real cycle data (submitted vs total reviews per quarter)
  const trendData = (cycles || [])
    .filter(c => c.sent > 0 || c.submitted > 0)
    .slice()
    .sort((a, b) => {
      if ((a.year || 0) !== (b.year || 0)) return (a.year || 0) - (b.year || 0);
      return (a.quarter || 0) - (b.quarter || 0);
    })
    .map(c => ({
      quarter: (c.q || "").split(" ")[0],
      submitted: c.submitted || 0,
      total: c.sent || 0,
    }));

  // Derive score distribution from real review data
  const SCORE_DIST = [
    { name: "Approved", value: reviews.filter(r => r.status === "Approved").length, color: "#10B981" },
    { name: "Submitted", value: reviews.filter(r => r.status === "Submitted").length, color: "#3B82F6" },
    { name: "In Progress", value: reviews.filter(r => r.status === "In Progress" || r.status === "Initiated").length, color: "#F59E0B" },
    { name: "Not Started", value: reviews.filter(r => r.status === "Not Started" || r.status === "Pending").length, color: "#E2E8F0" },
  ].filter(d => d.value > 0);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("");
  const showToast = (msg, type = "") => { setToast(msg); setToastType(type); setTimeout(() => { setToast(""); setToastType(""); }, 2800); };
  const doApprove = async (r) => {
    const prev = [...localRv];
    setLocalRv(p => p.map(x => x.id === r.id ? { ...x, status: "Approved" } : x));
    try {
      const res = await apiFetch(`/api/reviews/${r.id}/approve`, { method: "PUT" });
      const d = await res.json();
      if (!d.success) { setLocalRv(prev); showToast("Error: " + (d.message || "Approve failed"), "error"); return; }
      showToast((r.employee_name || r.employee) + " review approved", "#10B981");
    } catch (e) { setLocalRv(prev); showToast("Network error — approve not saved", "error"); }
  };
  const doReactivate = async (r) => {
    const prev = [...localRv];
    setLocalRv(p => p.map(x => x.id === r.id ? { ...x, status: "Email Sent" } : x));
    try {
      const res = await apiFetch(`/api/reviews/${r.id}`, { method: "PUT", body: JSON.stringify({ status: "Email Sent" }) });
      const d = await res.json();
      if (!d.success) { setLocalRv(prev); showToast("Error: " + (d.message || "Reactivate failed"), "error"); return; }
      showToast("Reactivated — re-sent to " + (r.stakeholder_name || r.stakeholder));
    } catch (e) { setLocalRv(prev); showToast("Network error — reactivate not saved", "error"); }
  };
  const doRemind = async (r) => {
    try {
      const res = await apiFetch(`/api/reviews/${r.id}/remind`, { method: "POST" });
      const d = await res.json();
      if (!d.success) { showToast("Error: " + (d.message || "Remind failed"), "error"); return; }
      showToast("Reminder sent to " + (r.stakeholder_name || r.stakeholder));
    } catch (e) { showToast("Network error — reminder not sent", "error"); }
  };
  return (
    <div className="fade-in">
      <TopBar title="Dashboard" subtitle={cycleLabel} {...topBarProps} />
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <KpiCard label="Active Clients" value={(clients || []).filter(c => c.status === "active").length || (clients || []).length} sub="Managed clients" icon="🏢" color="#3B82F6" delay={0} onClick={() => setPage("clients")} />
        <KpiCard label="Total Resources" value={(employees || []).length} sub="Tracked employees" icon="👥" color="#10B981" delay={60} onClick={() => setPage("employees")} />
        <KpiCard label="Reviews Pending" value={pending} sub="1 overdue" icon="⏳" color="#F59E0B" delay={120} onClick={() => setPage("reviews")} />
        <KpiCard label="Billing Leakage" value={leaking} sub="under-allocated" icon="⚠️" color="#EF4444" delay={180} onClick={() => setPage("resources")} />
      </div>

      {leaking > 0 && (
        <div style={{
          background: "#FEF2F2", border: "2px solid #FECACA", borderRadius: 12, padding: "13px 18px",
          marginBottom: 20, display: "flex", alignItems: "center", gap: 12
        }}>
          <span style={{ fontSize: 20 }}>&#9888;</span>
          <span style={{ fontSize: 13, color: "#991B1B", fontWeight: 500 }}>
            <strong>{leaking} employees</strong> have unallocated capacity — potential billing leakage.
          </span>
          <button className="btn-primary" style={{ background: "#EF4444", fontSize: 12, marginLeft: "auto" }}
            onClick={() => setPage("resources")}>Fix Now</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A", marginBottom: 20 }}>Review Completion Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Bar dataKey="submitted" name="Submitted" fill="#E8520A" radius={[5, 5, 0, 0]} />
              <Bar dataKey="total" name="Total" fill="#E2E8F0" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding: "22px 24px" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A", marginBottom: 4 }}>Score Distribution</div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>{activeCycle ? activeCycle.q : "All cycles"}</div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={SCORE_DIST} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {SCORE_DIST.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          {SCORE_DIST.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
              <span style={{ color: "#64748B", flex: 1 }}>{d.name}</span>
              <span style={{ fontWeight: 700, color: "#0D1B2A" }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: "22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A" }}>{activeCycle ? activeCycle.q : "Current"} — Review Status</div>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPage("reviews")}>View All →</button>
        </div>
        <table>
          <thead><tr><th>Employee</th><th>Client</th><th>Stakeholder</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead>
          <tbody>
            {localRv.slice(0, 6).map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={r.employee_name || r.employee || "?"} size={30} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.employee_name || r.employee}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>{r.employee_code || r.empId}</div>
                    </div>
                  </div>
                </td>
                <td><span style={{ fontSize: 13, color: "#475569" }}>{(r.client_name || r.client || "").split(" ")[0]}</span></td>
                <td><span style={{ fontSize: 13, color: "#475569" }}>{r.stakeholder_name || r.stakeholder}</span></td>
                <td><Badge status={r.status} /></td>
                <td style={{ fontSize: 12, color: "#94A3B8" }}>{r.submittedAt || "—"}</td>
                <td>
                  {["Pending", "Email Sent"].includes(r.status) && <button className="btn-ghost" style={{ fontSize: 12, color: "#E8520A" }} onClick={() => doRemind(r)}>Remind</button>}
                  {r.status === "Submitted" && <button className="btn-ghost" style={{ fontSize: 12, color: "#10B981" }} onClick={() => doApprove(r)}>Approve</button>}
                  {r.status === "Overdue" && <button className="btn-ghost" style={{ fontSize: 12, color: "#EF4444" }} onClick={() => doReactivate(r)}>Reactivate</button>}
                  {r.status === "Approved" && <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPage("reviews")}>View →</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toast && <Toast msg={toast} type={toastType} />}
    </div>
  );
};

export default Dashboard;
