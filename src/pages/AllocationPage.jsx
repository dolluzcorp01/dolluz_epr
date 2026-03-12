import { useState } from "react";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import Toast from "../components/Toast";
import { CLIENT_COLORS, gapPct, totalPct } from "../constants";
import { apiFetch } from "../utils/api";

const AllocationPage = ({ clients, employees, setEmployees, topBarProps, onAddNewEmployee }) => {
  const [filter, setFilter] = useState("all");
  const [empSel, setEmpSel] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("");
  const showToast = (msg, type = "") => { setToast(msg); setToastType(type); setTimeout(() => { setToast(""); setToastType(""); }, 2800); };

  const counts = {
    all: employees.length,
    leakage: employees.filter(e => gapPct(e) > 0).length,
    unallocated: employees.filter(e => totalPct(e) === 0).length,
    under: employees.filter(e => { const t = totalPct(e); return t > 0 && t < 100; }).length,
  };
  const filtered = employees.filter(e => {
    const t = totalPct(e);
    if (filter === "leakage") return gapPct(e) > 0;
    if (filter === "unallocated") return t === 0;
    if (filter === "under") return t > 0 && t < 100;
    return true;
  });

  const openEdit = emp => { setEmpSel(emp.id); setDrafts((emp.allocations || []).map(a => ({ ...a }))); };
  const closeEdit = () => { setEmpSel(null); setDrafts([]); };
  const draftTotal = drafts.reduce((s, a) => s + Number(a.pct), 0);
  const draftGap = 100 - draftTotal;

  const addDraft = () => {
    const used = drafts.map(a => a.clientId);
    const avail = clients.filter(c => !used.includes(c.id) && c.status === "active");
    if (!avail.length) return;
    const c = avail[0];
    setDrafts(p => [...p, { clientId: c.id, deptId: c.departments[0] ? c.departments[0].id : "", clientName: c.name, pct: Math.min(draftGap, 100), color: c.color || c.color_hex || CLIENT_COLORS[c.id] || "#64748B", stakeholders: [] }]);
  };
  const remDraft = idx => setDrafts(p => p.filter((_, i) => i !== idx));
  const updPct = (idx, v) => setDrafts(p => p.map((a, i) => i === idx ? { ...a, pct: Math.max(0, Math.min(100, Number(v))) } : a));
  const updClient = (idx, cid) => { const c = clients.find(x => x.id === cid); setDrafts(p => p.map((a, i) => i === idx ? { ...a, clientId: cid, clientName: c ? c.name : "", deptId: (c && c.departments[0]) ? c.departments[0].id : "", color: (c && (c.color || c.color_hex)) || CLIENT_COLORS[cid] || "#64748B", stakeholders: [] } : a)); };
  const updDept = (idx, did) => setDrafts(p => p.map((a, i) => i === idx ? { ...a, deptId: did } : a));

  const updStakeholderPct = (draftIdx, shId, rawVal, maxPct) => {
    setDrafts(p => p.map((a, i) => {
      if (i !== draftIdx) return a;
      const existing = a.stakeholders || [];
      const others = existing.filter(s => s.stakeholderId !== shId);
      const v = Number(rawVal);
      if (!rawVal || v === 0) return { ...a, stakeholders: others };
      return { ...a, stakeholders: [...others, { stakeholderId: shId, pct: Math.min(v, maxPct) }] };
    }));
  };
  const resetStakeholderSplit = (draftIdx) => {
    setDrafts(p => p.map((a, i) => i === draftIdx ? { ...a, stakeholders: [] } : a));
  };
  const saveDrafts = async eid => {
    if (draftTotal > 100) { showToast("Total exceeds 100% — please fix", "error"); return; }
    const badSplit = drafts.find(a => {
      if (!a.stakeholders || a.stakeholders.length === 0) return false;
      const shTotal = a.stakeholders.reduce((s, x) => s + Number(x.pct), 0);
      return shTotal !== Number(a.pct);
    });
    if (badSplit) {
      const cl = clients.find(c => c.id === badSplit.clientId);
      showToast("Stakeholder split for " + (cl ? cl.name.split(" ")[0] : "client") + " must total " + badSplit.pct + "%", "error"); return;
    }
    const prevEmployees = [...employees];
    setEmployees(p => p.map(e => e.id === eid ? { ...e, allocations: drafts } : e));
    closeEdit();
    try {
      const res = await apiFetch("/api/allocations", { method: "POST", body: JSON.stringify({ employee_id: eid, allocations: drafts }) });
      const d = await res.json();
      if (!d.success) {
        setEmployees(prevEmployees);
        showToast("Error: " + (d.message || "Save failed"), "error");
        return;
      }
      showToast("Allocation saved", "#10B981");
    } catch (e) {
      setEmployees(prevEmployees);
      showToast("Network error — allocation not saved", "error");
    }
  };

  const leakEmps = employees.filter(e => gapPct(e) > 0);

  return (
    <div className="fade-in">
      <TopBar title="Allocation & Billing Leakage" subtitle="Filter, diagnose and fix employee allocation gaps inline" {...topBarProps} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn-primary" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}
          onClick={onAddNewEmployee}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Employee
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Fully Allocated", v: employees.filter(e => totalPct(e) === 100).length, sub: "100% deployed", c: "#10B981", bg: "#F0FDF4" },
          { label: "Under-Allocated", v: counts.under, sub: "partial gap", c: "#F59E0B", bg: "#FFFBEB" },
          { label: "Unallocated", v: counts.unallocated, sub: "not deployed", c: "#EF4444", bg: "#FEF2F2" },
          { label: "Multi-Client Split", v: employees.filter(e => (e.allocations || []).length > 1).length, sub: "2+ clients", c: "#6366F1", bg: "#EEF2FF" },
        ].map(s => (
          <div key={s.label} className="card fade-up" style={{ padding: "16px 18px", borderTop: `3px solid ${s.c}`, background: s.bg }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: s.c, letterSpacing: -1 }}>{s.v}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {leakEmps.length > 0 && (
        <div style={{ background: "#FEF2F2", border: "2px solid #FECACA", borderRadius: 12, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>&#9888;</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#991B1B" }}>Billing Leakage — {leakEmps.length} employee{leakEmps.length > 1 ? "s" : ""} under-allocated</div>
            <div style={{ fontSize: 12, color: "#B91C1C", marginTop: 3 }}>{leakEmps.map(e => `${e.name.split(" ")[0]} (${gapPct(e)}% gap)`).join(" · ")}</div>
          </div>
          <button className="btn-primary" style={{ background: "#EF4444", fontSize: 12, flexShrink: 0 }} onClick={() => setFilter("leakage")}>View All</button>
        </div>
      )}

      <div className="card" style={{ padding: "14px 18px", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", background: "#F8FAFC", borderRadius: 10, padding: 4, width: "fit-content", border: "1.5px solid #E2E8F0" }}>
          {[
            { k: "all", label: "All Employees", c: "#0D1B2A" },
            { k: "leakage", label: "Billing Leakage", c: "#EF4444" },
            { k: "unallocated", label: "Unallocated", c: "#F59E0B" },
            { k: "under", label: "Under-Allocated", c: "#3B82F6" },
          ].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: filter === f.k ? "#fff" : "transparent",
              color: filter === f.k ? f.c : "#64748B",
              fontFamily: "'DM Sans',sans-serif", fontSize: 12,
              fontWeight: filter === f.k ? 700 : 500,
              boxShadow: filter === f.k ? "0 1px 4px rgba(0,0,0,.1)" : "none",
              transition: "all .18s", display: "flex", alignItems: "center", gap: 6
            }}>
              {f.label}
              <span style={{ background: filter === f.k ? f.c + "18" : "#E2E8F0", color: filter === f.k ? f.c : "#94A3B8", borderRadius: 100, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{counts[f.k]}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && <div className="card" style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>All clear — no employees match this filter.</div>}
        {filtered.map(emp => {
          const tot = totalPct(emp);
          const gap = gapPct(emp);
          const isEd = empSel === emp.id;
          const isLeak = gap > 0;
          const borderColor = tot === 0 ? "#FECACA" : tot < 100 ? "#FDE68A" : "#E2E8F0";
          return (
            <div key={emp.id} className="card" style={{ border: `1.5px solid ${borderColor}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={emp.name} size={38} />
                <div style={{ minWidth: 0, width: 170, flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0D1B2A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{emp.code} · {emp.role}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", height: 10, borderRadius: 100, overflow: "hidden", background: "#F1F5F9", marginBottom: 6 }}>
                    {(emp.allocations || []).map((a, i) => <div key={i} title={`${a.clientName}: ${a.pct}%`} style={{ width: `${a.pct}%`, background: a.color }} />)}
                    {gap > 0 && <div style={{ width: `${gap}%`, background: "#FEE2E2" }} />}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {(emp.allocations || []).map((a, i) => (
                      <span key={i} style={{ fontSize: 10, color: a.color, background: a.color + "18", padding: "2px 7px", borderRadius: 100, fontWeight: 700 }}>{(a.clientName || "").split(" ")[0]} {a.pct}%</span>
                    ))}
                    {gap > 0 && <span style={{ fontSize: 10, color: "#EF4444", background: "#FEE2E2", padding: "2px 7px", borderRadius: 100, fontWeight: 700 }}>Unallocated {gap}%</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, width: 72 }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: -1, color: tot === 100 ? "#10B981" : tot === 0 ? "#EF4444" : "#F59E0B", lineHeight: 1 }}>{tot}%</div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{tot === 100 ? "Fully allocated" : tot === 0 ? "Unallocated" : `${gap}% gap`}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!isEd && (
                    <button className={isLeak ? "btn-primary" : "btn-secondary"} style={{ fontSize: 12, ...(isLeak ? { background: "#EF4444" } : {}) }} onClick={() => openEdit(emp)}>
                      {isLeak ? "Fix Allocation" : "Edit"}
                    </button>
                  )}
                  {isEd && <button className="btn-ghost" style={{ fontSize: 12 }} onClick={closeEdit}>Cancel</button>}
                </div>
              </div>

              {!isEd && (emp.allocations || []).length > 0 && (
                <div style={{ borderTop: "1px solid #F1F5F9", padding: "9px 20px", background: "#FAFBFF", display: "flex", flexWrap: "wrap", gap: 14 }}>
                  {(emp.allocations || []).map(a => {
                    const co = clients.find(c => c.id === a.clientId);
                    const hasCustom = a.stakeholders && a.stakeholders.length > 0;
                    if (hasCustom) {
                      return (
                        <div key={a.clientId} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: a.color }}>{(a.clientName || "").split(" ")[0]}</span>
                          <span style={{ fontSize: 11, color: "#CBD5E1" }}>&#8594;</span>
                          {a.stakeholders.map((s, si) => {
                            const sh = co ? (co.stakeholders || []).find(x => x.id === s.stakeholderId) : null;
                            return (
                              <span key={s.stakeholderId} style={{
                                display: "inline-flex", alignItems: "center", gap: 4,
                                fontSize: 11, background: "#F5F3FF", border: "1px solid #DDD6FE",
                                borderRadius: 100, padding: "2px 8px"
                              }}>
                                <Avatar name={sh ? sh.name : "?"} size={14} />
                                <span style={{ fontWeight: 600, color: "#4C1D95" }}>{sh ? sh.name.split(" ").slice(0, 2).join(" ") : "?"}</span>
                                <span style={{ fontWeight: 800, color: "#6D28D9" }}>{s.pct}%</span>
                                {si < a.stakeholders.length - 1 && <span style={{ color: "#C4B5FD" }}>·</span>}
                              </span>
                            );
                          })}
                        </div>
                      );
                    }
                    const primaryId = co ? (co.primaryStakeholderId ? co.primaryStakeholderId : ((co.stakeholders || []).filter(s => s.active && s.level === "client")[0] || {}).id) : null;
                    const primarySh = co ? (co.stakeholders || []).find(s => s.id === primaryId) : null;
                    return (
                      <div key={a.clientId} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: a.color }}>{(a.clientName || "").split(" ")[0]}</span>
                        <span style={{ fontSize: 11, color: "#CBD5E1" }}>&#8594;</span>
                        {primarySh ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 11, background: a.color + "10", border: "1px solid " + a.color + "33",
                            borderRadius: 100, padding: "2px 8px"
                          }}>
                            <Avatar name={primarySh.name} size={14} />
                            <span style={{ fontWeight: 600, color: a.color }}>{primarySh.name.split(" ").slice(0, 2).join(" ")}</span>
                            <span style={{ fontSize: 10, color: "#94A3B8", fontStyle: "italic" }}>primary</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: "#94A3B8", fontStyle: "italic" }}>No stakeholder set</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {isEd && (
                <div className="fade-in" style={{ borderTop: "2px dashed #E2E8F0", background: "#FAFBFF", padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: "#0D1B2A", marginBottom: 12 }}>
                    Edit Allocation — {emp.name}
                    <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 400, color: "#64748B" }}>Total must equal 100%</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                    {drafts.map((a, idx) => {
                      const co = clients.find(c => c.id === a.clientId);
                      const activeStakeholders = co ? (co.stakeholders || []).filter(s => s.active) : [];
                      const hasCustomSplit = (a.stakeholders || []).length > 0;
                      const shTotal = (a.stakeholders || []).reduce((s, x) => s + Number(x.pct), 0);
                      const shValid = !hasCustomSplit || shTotal === Number(a.pct);
                      return (
                        <div key={idx} style={{ background: "#fff", border: `1.5px solid ${a.color}44`, borderLeft: `4px solid ${a.color}`, borderRadius: 10, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
                            <div style={{ width: 12, height: 12, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                            <select className="inp" value={a.clientId} onChange={e => updClient(idx, e.target.value)} style={{ width: 160, fontSize: 12, padding: "6px 9px" }}>
                              {clients.filter(c => c.status === "active").map(c => <option key={c.id} value={c.id} disabled={drafts.some((d, i) => i !== idx && d.clientId === c.id)}>{c.name.split(" ")[0]}</option>)}
                            </select>
                            <select className="inp" value={a.deptId} onChange={e => updDept(idx, e.target.value)} style={{ width: 150, fontSize: 12, padding: "6px 9px" }}>
                              {(co ? co.departments : []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <input className="inp" type="number" min={1} max={100} value={a.pct} onChange={e => updPct(idx, e.target.value)} style={{ width: 68, fontSize: 13, fontWeight: 700, textAlign: "center", padding: "6px 9px", color: a.color, borderColor: a.color + "44" }} onKeyDown={(e) => { if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault(); }} />
                            <span style={{ fontSize: 13, color: "#64748B" }}>%</span>
                            {[25, 50, 75, 100].map(v => (
                              <button key={v} onClick={() => updPct(idx, v)} style={{ background: a.pct === v ? a.color + "22" : "#F1F5F9", color: a.pct === v ? a.color : "#64748B", border: `1.5px solid ${a.pct === v ? a.color : "#E2E8F0"}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{v}%</button>
                            ))}
                            <button className="btn-danger" onClick={() => remDraft(idx)} style={{ marginLeft: "auto" }}>Remove</button>
                          </div>

                          {activeStakeholders.length > 0 && (
                            <div style={{ borderTop: `1px dashed ${a.color}33`, background: hasCustomSplit ? "#F5F3FF" : "#FAFBFF", padding: "10px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: hasCustomSplit ? "#6D28D9" : "#94A3B8" }}>
                                  🎯 Stakeholder Split
                                </span>
                                <span style={{ fontSize: 10, color: "#94A3B8" }}>
                                  {hasCustomSplit ? "Custom split active — must total " + a.pct + "%" : "Optional — leave empty to auto-assign by scope level"}
                                </span>
                                {hasCustomSplit && (
                                  <button onClick={() => resetStakeholderSplit(idx)} style={{ marginLeft: "auto", fontSize: 10, color: "#EF4444", background: "none", border: "1px solid #FECACA", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                                    Reset to default
                                  </button>
                                )}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {activeStakeholders.map(sh => {
                                  const entry = (a.stakeholders || []).find(s => s.stakeholderId === sh.id);
                                  const shPct = entry ? entry.pct : "";
                                  return (
                                    <div key={sh.id} style={{
                                      display: "flex", alignItems: "center", gap: 6,
                                      background: "#fff", border: `1.5px solid ${entry ? "#8B5CF6" : "#E2E8F0"}`,
                                      borderRadius: 8, padding: "6px 10px", minWidth: 190
                                    }}>
                                      <Avatar name={sh.name} size={22} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sh.name}</div>
                                        <div style={{ fontSize: 10, color: "#94A3B8" }}>
                                          {sh.level === "client" ? "All employees" : "Dept only"}
                                        </div>
                                      </div>
                                      <input type="number" min={0} max={a.pct}
                                        value={shPct}
                                        placeholder="0"
                                        onChange={e => updStakeholderPct(idx, sh.id, e.target.value, Number(a.pct))}
                                        onKeyDown={(e) => { if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault(); }}
                                        style={{
                                          width: 46, fontSize: 12, fontWeight: 700, textAlign: "center",
                                          padding: "4px 6px", borderRadius: 6, border: `1.5px solid ${entry ? "#8B5CF6" : "#E2E8F0"}`,
                                          color: entry ? "#6D28D9" : "#94A3B8", outline: "none"
                                        }} />
                                      <span style={{ fontSize: 11, color: "#94A3B8" }}>%</span>
                                    </div>
                                  );
                                })}
                              </div>
                              {hasCustomSplit && (
                                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ flex: 1, height: 6, borderRadius: 100, background: "#E2E8F0", overflow: "hidden" }}>
                                    <div style={{
                                      width: `${Math.min((shTotal / Number(a.pct)) * 100, 100)}%`, height: "100%",
                                      background: shValid ? "#8B5CF6" : "#EF4444", transition: "width .2s"
                                    }} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: shValid ? "#6D28D9" : "#EF4444", flexShrink: 0 }}>
                                    {shTotal}/{a.pct}% {shValid ? "✓" : "— must equal " + a.pct + "%"}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <button className="btn-secondary" style={{ fontSize: 12 }} onClick={addDraft} disabled={drafts.length >= clients.filter(c => c.status === "active").length}>+ Add Client</button>
                    <div style={{ flex: 1, height: 8, borderRadius: 100, background: "#F1F5F9", overflow: "hidden" }}>
                      {drafts.map((a, i) => <div key={i} style={{ width: `${a.pct}%`, height: "100%", background: a.color, display: "inline-block" }} />)}
                    </div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: -1, color: draftTotal === 100 ? "#10B981" : draftTotal > 100 ? "#EF4444" : "#F59E0B" }}>{draftTotal}%</div>
                    {draftGap > 0 && <span style={{ fontSize: 12, color: "#EF4444", fontWeight: 600 }}>{draftGap}% remaining</span>}
                    {draftTotal > 100 && <span style={{ fontSize: 12, color: "#EF4444", fontWeight: 700 }}>Exceeds 100%</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-primary" disabled={draftTotal > 100} onClick={() => saveDrafts(emp.id)} style={{ fontSize: 13 }}>Save Allocation</button>
                    <button className="btn-ghost" onClick={closeEdit} style={{ fontSize: 13 }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {toast && <Toast msg={toast} type={toastType} />}
    </div>
  );
};

export default AllocationPage;