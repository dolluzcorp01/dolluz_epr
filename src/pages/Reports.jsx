import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import { ALL_REVIEWS, EMPLOYEES_INIT, CLIENTS_INIT, CLIENT_COLORS } from "../constants";

const Reports = ({ topBarProps, employees }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState("");
  const [empFilter, setEmpFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [cmpQ1, setCmpQ1] = useState("Q1 2025");
  const [cmpQ2, setCmpQ2] = useState("Q1 2026");
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  const REPORT_TABS = ["Quarter Overview", "Employee Drill-down", "Client Performance", "Quarter Comparison", "Submission History"];

  const qData = [
    { q: "Q1 2025", sent: 8, submitted: 6, approved: 6, avgHike: 17.2, completion: 75 },
    { q: "Q2 2025", sent: 9, submitted: 7, approved: 7, avgHike: 18.5, completion: 78 },
    { q: "Q3 2025", sent: 10, submitted: 8, approved: 8, avgHike: 19.1, completion: 80 },
    { q: "Q4 2025", sent: 10, submitted: 9, approved: 9, avgHike: 19.8, completion: 90 },
    { q: "Q1 2026", sent: 10, submitted: 3, approved: 2, avgHike: 19.5, completion: 30 },
  ];
  const allQuarters = qData.map(q => q.q);

  // Employee drill-down data (hike per quarter per employee)
  const empHikeData = [
    { name: "Prasanth M", code: "DZIND106", Q1_2025: 14.40, Q2_2025: 14.94, Q3_2025: 15.60, Q4_2025: 16.44, Q1_2026: null },
    { name: "Janani R", code: "DZIND132", Q1_2025: 16.56, Q2_2025: 17.16, Q3_2025: 17.88, Q4_2025: 18.54, Q1_2026: 19.31 },
    { name: "Prashant G", code: "DZIND116", Q1_2025: 18.84, Q2_2025: 19.44, Q3_2025: 20.10, Q4_2025: 20.40, Q1_2026: 21.30 },
    { name: "Ratna G", code: "DZIND119", Q1_2025: 17.28, Q2_2025: 18.00, Q3_2025: 18.53, Q4_2025: 19.05, Q1_2026: null },
    { name: "Rajasekar S", code: "DZIND136", Q1_2025: 16.20, Q2_2025: 16.80, Q3_2025: 17.55, Q4_2025: 18.45, Q1_2026: null },
    { name: "Aniket T", code: "DZIND137", Q1_2025: 16.80, Q2_2025: 17.40, Q3_2025: 18.15, Q4_2025: 18.75, Q1_2026: null },
    { name: "Sameer K", code: "DZIND138", Q1_2025: 20.16, Q2_2025: 20.70, Q3_2025: 21.30, Q4_2025: 21.60, Q1_2026: null },
    { name: "Rajesh T", code: "DZIND109", Q1_2025: 15.72, Q2_2025: 16.32, Q3_2025: 16.80, Q4_2025: 17.40, Q1_2026: null },
  ];

  // Client submission data
  const clientData = [
    { client: "HCL Healthcare", Q1_2025: 3, Q2_2025: 3, Q3_2025: 4, Q4_2025: 4, Q1_2026: 2, totalEmps: 4 },
    { client: "Verizon Consumer Group", Q1_2025: 2, Q2_2025: 2, Q3_2025: 3, Q4_2025: 3, Q1_2026: 1, totalEmps: 3 },
    { client: "City Union Bank", Q1_2025: 2, Q2_2025: 2, Q3_2025: 2, Q4_2025: 2, Q1_2026: 0, totalEmps: 2 },
    { client: "Tata Motors", Q1_2025: 0, Q2_2025: 0, Q3_2025: 0, Q4_2025: 0, Q1_2026: 0, totalEmps: 0 },
  ];

  const allNames = ["All", ...empHikeData.map(e => e.name)];
  const allClients = ["All", ...clientData.map(c => c.client)];

  // Quarter comparison helper
  const getQData = (qLabel) => qData.find(q => q.q === qLabel) || {};
  const cmpQKey = (q) => q.replace(" ", "_").replace(" ", "_");

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
          { l: "Total Reviews (All Time)", v: ALL_REVIEWS.length, c: "#0D1B2A", bg: "#F8FAFC" },
          { l: "Approved Reviews", v: ALL_REVIEWS.filter(r => r.status === "Approved").length, c: "#10B981", bg: "#F0FDF4" },
          { l: "Highest Avg Hike", v: "21.6%", c: "#E8520A", bg: "#FFF5F0" },
          { l: "Active Quarter", v: "Q1 2026 · 30%", c: "#3B82F6", bg: "#EFF6FF" },
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
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Full overview exported to PDF")}>📄 Export PDF</button>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Full overview exported to Excel")}>📊 Export Excel</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
              {qData.map((q, i) => (
                <div key={i} style={{
                  background: "#F8FAFC", borderRadius: 10, padding: "16px",
                  border: i === 4 ? "2px solid rgba(232,82,10,.3)" : "1px solid #F1F5F9"
                }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 13, color: i === 4 ? "#E8520A" : "#64748B", marginBottom: 10 }}>{q.q}</div>
                  {[["Sent", q.sent, "#475569"], ["Submitted", q.submitted, "#3B82F6"], ["Approved", q.approved, "#10B981"], ["Avg Hike", q.avgHike + "%", "#E8520A"]].map(([l, v, c]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: "#94A3B8" }}>{l}</span><span style={{ fontWeight: 700, color: c }}>{v}</span>
                    </div>
                  ))}
                  <div className="progress-bar" style={{ marginTop: 6 }}><div className="progress-fill" style={{ width: q.completion + "%", background: i === 4 ? "#E8520A" : "#10B981" }} /></div>
                  <div style={{ fontSize: 10, color: "#94A3B8", textAlign: "right", marginTop: 3 }}>{q.completion}% complete</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button className="btn-ghost" style={{ fontSize: 10, flex: 1, justifyContent: "center", color: "#EF4444", padding: "4px 0" }} onClick={() => showToast(q.q + " PDF download")}>PDF</button>
                    <button className="btn-ghost" style={{ fontSize: 10, flex: 1, justifyContent: "center", color: "#10B981", padding: "4px 0" }} onClick={() => showToast(q.q + " Excel download")}>XLS</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 16 }}>Hike % Trend — All Quarters</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={qData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="q" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={[14, 24]} />
                <Tooltip contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                <Line type="monotone" dataKey="avgHike" name="Avg Hike %" stroke="#E8520A" strokeWidth={3} dot={{ fill: "#E8520A", r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Tab 1: Employee Drill-down ── */}
        {activeTab === 1 && (
          <div style={{ padding: "20px 24px" }}>
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
              <table style={{ minWidth: 750 }}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    {allQuarters.map(q => <th key={q} style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{q}</th>)}
                    <th style={{ textAlign: "center" }}>Avg Hike</th>
                    <th style={{ textAlign: "center" }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {empHikeData.filter(e => empFilter === "All" || e.name === empFilter).map(e => {
                    const vals = [e.Q1_2025, e.Q2_2025, e.Q3_2025, e.Q4_2025, e.Q1_2026].filter(v => v !== null);
                    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
                    const delta = vals.length >= 2 ? (vals[vals.length - 1] - vals[0]).toFixed(1) : null;
                    return (
                      <tr key={e.code}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={e.name} size={28} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 12 }}>{e.name}</div>
                              <div style={{ fontSize: 10, color: "#94A3B8" }}>{e.code}</div>
                            </div>
                          </div>
                        </td>
                        {[e.Q1_2025, e.Q2_2025, e.Q3_2025, e.Q4_2025, e.Q1_2026].map((v, i) => (
                          <td key={i} style={{ textAlign: "center" }}>
                            {v !== null
                              ? <span style={{
                                fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12,
                                color: v >= 20 ? "#10B981" : v >= 17 ? "#E8520A" : "#475569"
                              }}>{v}%</span>
                              : <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>}
                          </td>
                        ))}
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
          </div>
        )}

        {/* ── Tab 2: Client Performance ── */}
        {activeTab === 2 && (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
              <select className="inp" value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ maxWidth: 260 }}>
                {allClients.map(c => <option key={c}>{c}</option>)}
              </select>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Client report exported to PDF")}>📄 PDF</button>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Client report exported to Excel")}>📊 Excel</button>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th>Client</th>
                    {allQuarters.map(q => <th key={q} style={{ textAlign: "center", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>{q}</th>)}
                    <th style={{ textAlign: "center" }}>Emps</th>
                  </tr>
                </thead>
                <tbody>
                  {clientData.filter(c => clientFilter === "All" || c.client === clientFilter).map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{c.client}</td>
                      {[c.Q1_2025, c.Q2_2025, c.Q3_2025, c.Q4_2025, c.Q1_2026].map((v, j) => (
                        <td key={j} style={{ textAlign: "center" }}>
                          <span style={{
                            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12,
                            color: v >= 4 ? "#10B981" : v >= 2 ? "#E8520A" : v === 0 ? "#CBD5E1" : "#475569"
                          }}>{v}</span>
                        </td>
                      ))}
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#3B82F6" }}>{c.totalEmps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 16 }}>Submissions by Quarter — Client View</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={allQuarters.map(q => {
                  const key = q.replace(" ", "_");
                  const obj = { q };
                  clientData.forEach(c => { obj[c.client.split(" ")[0]] = c[key.replace("-", "_").replace(" ", "_")]; });
                  return obj;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="q" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0D1B2A", border: "none", borderRadius: 8, color: "#fff", fontSize: 11 }} />
                  {["HCL", "Verizon", "City", "Tata"].map((c, i) => (
                    <Bar key={c} dataKey={c} stackId="a" fill={["#E8520A", "#3B82F6", "#10B981", "#8B5CF6"][i]} radius={i === 3 ? [5, 5, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Tab 3: Quarter Comparison ── */}
        {activeTab === 3 && (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Compare:</span>
                <select className="inp" value={cmpQ1} onChange={e => setCmpQ1(e.target.value)} style={{ maxWidth: 140 }}>
                  {allQuarters.map(q => <option key={q}>{q}</option>)}
                </select>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8" }}>vs</span>
                <select className="inp" value={cmpQ2} onChange={e => setCmpQ2(e.target.value)} style={{ maxWidth: 140 }}>
                  {allQuarters.map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
              <button className="btn-ghost" style={{ fontSize: 12, marginLeft: "auto" }} onClick={() => showToast("Comparison exported to PDF")}>📄 Export</button>
            </div>
            {(() => {
              const d1 = getQData(cmpQ1);
              const d2 = getQData(cmpQ2);
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
                    {[{ q: cmpQ1, d: d1, color: "#E8520A" }, { q: cmpQ2, d: d2, color: "#3B82F6" }].map(({ q, d, color }) => (
                      <div key={q} style={{ background: "#F8FAFC", borderRadius: 12, padding: "18px", border: `2px solid ${color}22` }}>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color, marginBottom: 12 }}>{q}</div>
                        {[["Sent", d.sent], ["Submitted", d.submitted], ["Approved", d.approved], ["Avg Hike", d.avgHike + "%"], ["Completion", d.completion + "%"]].map(([l, v]) => (
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
                        <th style={{ textAlign: "center", color: "#E8520A" }}>{cmpQ1}</th>
                        <th style={{ textAlign: "center", color: "#3B82F6" }}>{cmpQ2}</th>
                        <th style={{ textAlign: "center" }}>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map(m => {
                        const diff = m.v2 - m.v1;
                        return (
                          <tr key={m.l}>
                            <td style={{ fontWeight: 500, fontSize: 13 }}>{m.l}</td>
                            <td style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{m.v1}</td>
                            <td style={{ textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{m.v2}</td>
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
          </div>
        )}

        {/* ── Tab 4: Submission History ── */}
        {activeTab === 4 && (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>All {ALL_REVIEWS.length} review records across {allQuarters.length} quarters</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Full submission history exported to PDF")}>📄 PDF</button>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Full submission history exported to Excel")}>📊 Excel</button>
              </div>
            </div>
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
                  {ALL_REVIEWS.slice().reverse().map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={r.employee} size={26} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12 }}>{r.employee}</div>
                            <div style={{ fontSize: 10, color: "#94A3B8" }}>{r.empId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "#475569" }}>{r.client.split(" ")[0]}</td>
                      <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#475569" }}>{r.quarter}</td>
                      <td style={{ fontSize: 12, color: "#64748B" }}>{r.stakeholder}</td>
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
          </div>
        )}
      </div>
      {toast && <Toast msg={toast} />}
    </div>
  );
};

export default Reports;
