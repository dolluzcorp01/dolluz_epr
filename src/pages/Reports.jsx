import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Toast from "../components/Toast";

const Reports = ({ topBarProps, employees, allReviews, clients, cycles }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState("");
  const [empFilter, setEmpFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [cmpQ1, setCmpQ1] = useState("");
  const [cmpQ2, setCmpQ2] = useState("");
  const [toastType, setToastType] = useState("");
  const showToast = (msg, type = "") => { setToast(msg); setToastType(type); setTimeout(() => { setToast(""); setToastType(""); }, 2800); };

  const reviews = allReviews || [];
  const allCycles = (cycles || []).slice().sort((a, b) => {
    if ((a.year || 0) !== (b.year || 0)) return (a.year || 0) - (b.year || 0);
    return (a.quarter || 0) - (b.quarter || 0);
  });

  // ── Quarter overview data derived from real cycles + reviews ─────────────────
  const qData = allCycles.map(c => {
    const cycleReviews = reviews.filter(r => (r.cycle_name || r.quarter || r.q) === c.q);
    const approved = cycleReviews.filter(r => r.status === "Approved");
    const hikeVals = approved.map(r => parseFloat(r.hikeGiven || r.approved_hike || 0)).filter(v => v > 0);
    const avgHike = hikeVals.length ? (hikeVals.reduce((a, b) => a + b, 0) / hikeVals.length).toFixed(1) : 0;
    const sent = c.sent || 0;
    const submitted = c.submitted || 0;
    return {
      q: c.q,
      sent,
      submitted,
      approved: approved.length,
      avgHike: parseFloat(avgHike),
      completion: sent ? Math.round((submitted / sent) * 100) : 0,
    };
  });

  const allQuarters = qData.map(q => q.q);

  // ── Employee drill-down: hike per quarter per employee ───────────────────────
  const empMap = {};
  reviews.forEach(r => {
    const name = r.employee_name || r.employee || "";
    const code = r.employee_code || r.empId || "";
    const q = r.cycle_name || r.quarter || r.q || "";
    const hike = parseFloat(r.hikeGiven || r.approved_hike || 0);
    if (!name || !q) return;
    if (!empMap[code || name]) empMap[code || name] = { name, code, hikes: {} };
    if (hike > 0) empMap[code || name].hikes[q] = hike;
  });
  const empHikeData = Object.values(empMap);

  // ── Client data: submissions per quarter ─────────────────────────────────────
  const clientMap = {};
  reviews.forEach(r => {
    const client = r.client_name || r.client || "";
    const q = r.cycle_name || r.quarter || r.q || "";
    if (!client || !q) return;
    if (!clientMap[client]) clientMap[client] = { client, counts: {}, totalEmps: 0 };
    if (!clientMap[client].counts[q]) clientMap[client].counts[q] = 0;
    if (r.status === "Submitted" || r.status === "Approved") clientMap[client].counts[q]++;
  });
  // Count distinct employees per client from allocations
  (clients || []).forEach(cl => {
    const name = cl.name || "";
    if (clientMap[name]) {
      clientMap[name].totalEmps = (cl.stakeholders || []).length;
    }
  });
  const clientData = Object.values(clientMap);

  const allNames = ["All", ...empHikeData.map(e => e.name)];
  const allClientNames = ["All", ...clientData.map(c => c.client)];

  // ── Quarter comparison ────────────────────────────────────────────────────────
  const q1Label = cmpQ1 || allQuarters[0] || "";
  const q2Label = cmpQ2 || allQuarters[allQuarters.length - 1] || "";
  const getQData = (qLabel) => qData.find(q => q.q === qLabel) || {};

  // ── Summary KPIs ──────────────────────────────────────────────────────────────
  const totalReviews = reviews.length;
  const approvedReviews = reviews.filter(r => r.status === "Approved").length;
  const allHikes = reviews.map(r => parseFloat(r.hikeGiven || r.approved_hike || 0)).filter(v => v > 0);
  const highestAvgHike = allHikes.length ? Math.max(...allHikes).toFixed(1) + "%" : "—";
  const activeCycle = (cycles || []).find(c => c.status === "Active");
  const activeLabel = activeCycle
    ? `${activeCycle.q} · ${activeCycle.sent ? Math.round(((activeCycle.submitted || 0) / activeCycle.sent) * 100) : 0}%`
    : "No active cycle";

  const REPORT_TABS = ["Quarter Overview", "Employee Drill-down", "Client Performance", "Quarter Comparison", "Submission History"];

  const Tab = ({ i, label }) => (
    <button onClick={() => setActiveTab(i)} style={{
      padding: "10px 16px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: activeTab === i ? 700 : 500,
      background: activeTab === i ? "#FFF5F0" : "#fff", color: activeTab === i ? "#E8520A" : "#475569",
      borderBottom: activeTab === i ? "2.5px solid #E8520A" : "2.5px solid transparent", whiteSpace: "nowrap"
    }}>
      {label}
    </button>
  );

  return (
    <div className="fade-in">
      <TopBar title="Reports & Analytics" subtitle="Multi-dimensional EPR performance insights and exports" {...topBarProps} />

      {/* ── Summary KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { l: "Total Reviews (All Time)", v: totalReviews, c: "#0D1B2A", bg: "#F8FAFC" },
          { l: "Approved Reviews", v: approvedReviews, c: "#10B981", bg: "#F0FDF4" },
          { l: "Highest Hike Given", v: highestAvgHike, c: "#E8520A", bg: "#FFF5F0" },
          { l: "Active Quarter", v: activeLabel, c: "#3B82F6", bg: "#EFF6FF" },
        ].map(s => (
          <div key={s.l} style={{ background: s.bg, borderRadius: 10, padding: "14px 18px", border: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>{s.l}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", overflowX: "auto" }}>
          {REPORT_TABS.map((t, i) => <Tab key={i} i={i} label={t} />)}
        </div>

        {/* ── Tab 0: Quarter Overview ── */}
        {activeTab === 0 && (
          <div style={{ padding: "20px 24px" }}>
            {qData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8", fontSize: 13 }}>No cycle data available.</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Full overview exported to PDF")}>📄 Export PDF</button>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Full overview exported to Excel")}>📊 Export Excel</button>
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
                  {qData.map((q, i) => (
                    <div key={i} style={{
                      flex: "0 0 auto", minWidth: 160, background: "#F8FAFC", borderRadius: 10, padding: "16px",
                      border: activeCycle && q.q === activeCycle.q ? "2px solid rgba(232,82,10,.3)" : "1px solid #F1F5F9"
                    }}>
                      <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 13, color: activeCycle && q.q === activeCycle.q ? "#E8520A" : "#64748B", marginBottom: 10 }}>{q.q}</div>
                      {[["Sent", q.sent, "#475569"], ["Submitted", q.submitted, "#3B82F6"], ["Approved", q.approved, "#10B981"], ["Avg Hike", q.avgHike ? q.avgHike + "%" : "—", "#E8520A"]].map(([l, v, c]) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                          <span style={{ color: "#94A3B8" }}>{l}</span><span style={{ fontWeight: 700, color: c }}>{v}</span>
                        </div>
                      ))}
                      <div className="progress-bar" style={{ marginTop: 6 }}><div className="progress-fill" style={{ width: q.completion + "%", background: activeCycle && q.q === activeCycle.q ? "#E8520A" : "#10B981" }} /></div>
                      <div style={{ fontSize: 10, color: "#94A3B8", textAlign: "right", marginTop: 3 }}>{q.completion}% complete</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 16 }}>Hike % Trend — All Quarters</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={qData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="q" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Line type="monotone" dataKey="avgHike" name="Avg Hike %" stroke="#E8520A" strokeWidth={3} dot={{ fill: "#E8520A", r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}

        {/* ── Tab 1: Employee Drill-down ── */}
        {activeTab === 1 && (
          <div style={{ padding: "20px 24px" }}>
            {empHikeData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8", fontSize: 13 }}>No employee review data available.</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
                  <select className="inp" value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={{ maxWidth: 220 }}>
                    {allNames.map(n => <option key={n}>{n}</option>)}
                  </select>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Employee report exported to PDF")}>📄 PDF</button>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Employee report exported to Excel")}>📊 Excel</button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        {allQuarters.map(q => <th key={q} style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{q}</th>)}
                        <th style={{ textAlign: "center" }}>Avg Hike</th>
                        <th style={{ textAlign: "center" }}>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empHikeData.filter(e => empFilter === "All" || e.name === empFilter).map((e, idx) => {
                        const vals = allQuarters.map(q => e.hikes[q] || null).filter(v => v !== null);
                        const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
                        const delta = vals.length >= 2 ? (vals[vals.length - 1] - vals[0]).toFixed(1) : null;
                        return (
                          <tr key={e.code || idx}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Avatar name={e.name} size={28} />
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 12 }}>{e.name}</div>
                                  <div style={{ fontSize: 10, color: "#94A3B8" }}>{e.code}</div>
                                </div>
                              </div>
                            </td>
                            {allQuarters.map((q, i) => {
                              const v = e.hikes[q] || null;
                              return (
                                <td key={i} style={{ textAlign: "center" }}>
                                  {v !== null
                                    ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: v >= 20 ? "#10B981" : v >= 17 ? "#E8520A" : "#475569" }}>{v}%</span>
                                    : <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>}
                                </td>
                              );
                            })}
                            <td style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: "#3B82F6" }}>{avg}{avg !== "—" ? "%" : ""}</td>
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
              </>
            )}
          </div>
        )}

        {/* ── Tab 2: Client Performance ── */}
        {activeTab === 2 && (
          <div style={{ padding: "20px 24px" }}>
            {clientData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8", fontSize: 13 }}>No client review data available.</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
                  <select className="inp" value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ maxWidth: 260 }}>
                    {allClientNames.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Client report exported to PDF")}>📄 PDF</button>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Client report exported to Excel")}>📊 Excel</button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th>Client</th>
                        {allQuarters.map(q => <th key={q} style={{ textAlign: "center", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>{q}</th>)}
                        <th style={{ textAlign: "center" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientData.filter(c => clientFilter === "All" || c.client === clientFilter).map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>{c.client}</td>
                          {allQuarters.map((q, j) => {
                            const v = c.counts[q] || 0;
                            return (
                              <td key={j} style={{ textAlign: "center" }}>
                                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: v >= 4 ? "#10B981" : v >= 2 ? "#E8520A" : v === 0 ? "#CBD5E1" : "#475569" }}>{v}</span>
                              </td>
                            );
                          })}
                          <td style={{ textAlign: "center", fontWeight: 700, color: "#3B82F6" }}>{Object.values(c.counts).reduce((a, b) => a + b, 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab 3: Quarter Comparison ── */}
        {activeTab === 3 && (
          <div style={{ padding: "20px 24px" }}>
            {allQuarters.length < 2 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8", fontSize: 13 }}>Need at least 2 quarters of data to compare.</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Compare:</span>
                    <select className="inp" value={q1Label} onChange={e => setCmpQ1(e.target.value)} style={{ maxWidth: 140 }}>
                      {allQuarters.map(q => <option key={q}>{q}</option>)}
                    </select>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8" }}>vs</span>
                    <select className="inp" value={q2Label} onChange={e => setCmpQ2(e.target.value)} style={{ maxWidth: 140 }}>
                      {allQuarters.map(q => <option key={q}>{q}</option>)}
                    </select>
                  </div>
                  <button className="btn-ghost" style={{ fontSize: 12, marginLeft: "auto" }} onClick={() => showToast("Comparison exported to PDF")}>📄 Export</button>
                </div>
                {(() => {
                  const d1 = getQData(q1Label);
                  const d2 = getQData(q2Label);
                  const metrics = [
                    { l: "Reviews Sent", v1: d1.sent, v2: d2.sent },
                    { l: "Submitted", v1: d1.submitted, v2: d2.submitted },
                    { l: "Approved", v1: d1.approved, v2: d2.approved },
                    { l: "Avg Hike %", v1: d1.avgHike, v2: d2.avgHike },
                    { l: "Completion %", v1: d1.completion, v2: d2.completion },
                  ];
                  return (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                        {[{ q: q1Label, d: d1, color: "#E8520A" }, { q: q2Label, d: d2, color: "#3B82F6" }].map(({ q, d, color }) => (
                          <div key={q} style={{ background: "#F8FAFC", borderRadius: 12, padding: "18px", border: `2px solid ${color}22` }}>
                            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color, marginBottom: 12 }}>{q}</div>
                            {[["Sent", d.sent || 0], ["Submitted", d.submitted || 0], ["Approved", d.approved || 0], ["Avg Hike", (d.avgHike || 0) + "%"], ["Completion", (d.completion || 0) + "%"]].map(([l, v]) => (
                              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                                <span style={{ color: "#64748B" }}>{l}</span>
                                <span style={{ fontWeight: 700, color: "#0D1B2A" }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th>Metric</th>
                            <th style={{ textAlign: "center", color: "#E8520A" }}>{q1Label}</th>
                            <th style={{ textAlign: "center", color: "#3B82F6" }}>{q2Label}</th>
                            <th style={{ textAlign: "center" }}>Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map(m => {
                            const diff = (m.v2 || 0) - (m.v1 || 0);
                            return (
                              <tr key={m.l}>
                                <td style={{ fontWeight: 500, fontSize: 13 }}>{m.l}</td>
                                <td style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{m.v1 ?? "—"}</td>
                                <td style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{m.v2 ?? "—"}</td>
                                <td style={{ textAlign: "center" }}>
                                  <span style={{ fontWeight: 700, fontSize: 12, color: diff > 0 ? "#10B981" : diff < 0 ? "#EF4444" : "#94A3B8" }}>
                                    {diff > 0 ? "▲" : diff < 0 ? "▼" : "="} {Math.abs(diff)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ── Tab 4: Submission History ── */}
        {activeTab === 4 && (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>All {reviews.length} review records across {allQuarters.length} quarters</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Full submission history exported to PDF")}>📄 PDF</button>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Full submission history exported to Excel")}>📊 Excel</button>
              </div>
            </div>
            {reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 24px", color: "#94A3B8", fontSize: 13 }}>No review records found.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ minWidth: 860 }}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Client</th>
                      <th>Quarter</th>
                      <th>Stakeholder</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Hike Given</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.slice().reverse().map((r, i) => (
                      <tr key={r.id || i}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={r.employee_name || r.employee || "?"} size={26} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 12 }}>{r.employee_name || r.employee}</div>
                              <div style={{ fontSize: 10, color: "#94A3B8" }}>{r.employee_code || r.empId}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: "#475569" }}>{(r.client_name || r.client || "").split(" ")[0]}</td>
                        <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#475569" }}>{r.cycle_name || r.quarter}</td>
                        <td style={{ fontSize: 12, color: "#64748B" }}>{r.stakeholder_name || r.stakeholder}</td>
                        <td><Badge status={r.status} /></td>
                        <td style={{ fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{r.submittedAt || "—"}</td>
                        <td style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: r.hikeGiven ? "#10B981" : "#CBD5E1" }}>
                          {r.hikeGiven ? r.hikeGiven + "%" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast msg={toast} type={toastType} />}
    </div>
  );
};

export default Reports;
