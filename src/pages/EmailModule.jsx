import { useState } from "react";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import Toast from "../components/Toast";
import { uid, CLIENT_COLORS } from "../constants";
import { apiFetch } from "../utils/api";

const TYPE_META = {
  request_review: { label: "Request Review", color: "#10B981", bg: "#F0FDF4", border: "#BBF7D0" },
  reminder_1: { label: "Reminder 1", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  reminder_2: { label: "Reminder 2", color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
  reminder_3: { label: "Reminder 3", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  thank_you: { label: "Thank You", color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
  thank_you_pdf: { label: "Thank You (PDF)", color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE" },
};

const EmailModule = ({ cycles, clients, employees, emailTemplates, setEmailTemplates, ccList, setCcList, cycleEmailState, currentRole, topBarProps }) => {
  const [tab, setTab] = useState("templates");
  const [editing, setEditing] = useState(null);   // template id being edited
  const [draft, setDraft] = useState(null);   // draft of editing template
  const [preview, setPreview] = useState(null);   // template id being previewed
  const [newCC, setNewCC] = useState({ name: "", email: "" });
  const [ccErr, setCcErr] = useState("");
  const [toast, setToast] = useState("");
  const [selCycle, setSelCycle] = useState(((cycles || [])[0] || {}).id || "");
  const isSuperAdmin = currentRole === "Super Admin";
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const startEdit = tpl => { setEditing(tpl.id); setDraft({ ...tpl }); };
  const saveEdit = async () => {
    setEmailTemplates(p => p.map(t => t.id === draft.id ? { ...draft } : t));
    setEditing(null); setDraft(null);
    showToast("Template saved");
    try { await apiFetch(`/api/email-templates/${draft.id}`, { method: "PUT", body: JSON.stringify({ subject: draft.subject, body: draft.body }) }); } catch (e) {}
  };
  const addNewTpl = () => {
    const id = "TPL" + String(Date.now()).slice(-4);
    const tpl = { id, type: "custom", name: "New Template", subject: "", body: "", editable: true, system: false };
    setEmailTemplates(p => [...p, tpl]);
    startEdit(tpl);
  };

  const addCC = async () => {
    if (!newCC.email.includes("@")) { setCcErr("Enter a valid email address"); return; }
    if (ccList.some(c => c.email === newCC.email)) { setCcErr("This email is already in the CC list"); return; }
    setCcList(p => [...p, { id: "CC" + Date.now(), name: newCC.name || newCC.email.split("@")[0], email: newCC.email, addedAt: new Date().toLocaleDateString("en-IN"), locked: false }]);
    setNewCC({ name: "", email: "" }); setCcErr("");
    showToast("CC email added");
    try { await apiFetch("/api/email-templates/cc", { method: "POST", body: JSON.stringify({ email: newCC.email }) }); } catch (e) {}
  };
  const removeCC = async id => {
    setCcList(p => p.filter(c => c.id !== id));
    try { await apiFetch(`/api/email-templates/cc/${id}`, { method: "DELETE" }); } catch (e) {}
  };

  const activeCycle = (cycles || []).find(c => c.id === selCycle);

  const renderVars = (body, shName, empList, quarter, deadline) => {
    const empStr = (empList || []).map((e, i) => "  " + (i + 1) + ". " + e.name).join("\n");
    return body
      .replace(/{{stakeholder_name}}/g, shName || "[Stakeholder Name]")
      .replace(/{{employee_list}}/g, empStr || "  [Employee List]")
      .replace(/{{quarter}}/g, quarter || "[Quarter]")
      .replace(/{{deadline}}/g, deadline || "[Deadline]")
      .replace(/{{portal_link}}/g, "https://portal.dolluz.com/review")
      .replace(/{{admin_name}}/g, "Super Admin");
  };

  return (
    <div className="fade-up">
      <TopBar title="Email" subtitle="Templates, workflow and CC management" {...topBarProps} />

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 24, background: "#fff", padding: "6px", borderRadius: 12,
        border: "1px solid #E2E8F0", width: "fit-content", boxShadow: "0 1px 4px rgba(0,0,0,.04)"
      }}>
        {[["templates", "&#128196; Templates"], ["workflow", "&#128200; Workflow"], ["cc", "&#128274; CC Management"]].map(([id, lbl]) => (
          <button key={id} className={"tab" + (tab === id ? " active" : "")} onClick={() => setTab(id)}
            dangerouslySetInnerHTML={{ __html: lbl }} />
        ))}
      </div>

      {/* ────── TEMPLATES TAB ────── */}
      {tab === "templates" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#0D1B2A" }}>Email Templates</div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{emailTemplates.length} templates &middot; used for all outgoing review emails</div>
            </div>
            {isSuperAdmin && (
              <button className="btn-primary" onClick={addNewTpl}>+ New Template</button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {emailTemplates.map(tpl => {
              const meta = TYPE_META[tpl.type] || { label: tpl.name, color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" };
              const isEd = editing === tpl.id;
              return (
                <div key={tpl.id} className="card" style={{ overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A" }}>{tpl.name}</div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, background: meta.bg, color: meta.color,
                          border: "1px solid " + meta.border, borderRadius: 100, padding: "2px 8px", textTransform: "uppercase", letterSpacing: .4
                        }}>
                          {meta.label}
                        </span>
                        {tpl.system && <span style={{ fontSize: 10, color: "#94A3B8", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 100, padding: "2px 7px" }}>System</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Subject: {tpl.subject || "(no subject)"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPreview(tpl.id)}>&#128065; Preview</button>
                      {isSuperAdmin && tpl.editable && !isEd && (
                        <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => startEdit(tpl)}>Edit</button>
                      )}
                      {isEd && <button className="btn-primary" style={{ fontSize: 12 }} onClick={saveEdit}>Save</button>}
                      {isEd && <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setEditing(null); setDraft(null); }}>Cancel</button>}
                      {isSuperAdmin && !tpl.system && (
                        <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => { setEmailTemplates(p => p.filter(t => t.id !== tpl.id)); showToast("Template deleted"); }}>Delete</button>
                      )}
                    </div>
                  </div>

                  {/* Edit panel */}
                  {isEd && draft && (
                    <div className="fade-in" style={{ borderTop: "1.5px dashed #E2E8F0", background: "#FAFBFF", padding: "18px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase" }}>Template Name</label>
                          <input className="inp" value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} style={{ maxWidth: 320 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase" }}>Subject Line</label>
                          <input className="inp" value={draft.subject} onChange={e => setDraft(p => ({ ...p, subject: e.target.value }))} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase" }}>
                            Email Body
                            <span style={{ marginLeft: 8, fontWeight: 400, color: "#CBD5E1", fontSize: 10 }}>
                              Variables: {"{{stakeholder_name}} {{employee_list}} {{quarter}} {{deadline}} {{portal_link}} {{admin_name}}"}
                            </span>
                          </label>
                          <textarea className="inp" rows={10} value={draft.body}
                            onChange={e => setDraft(p => ({ ...p, body: e.target.value }))}
                            style={{ resize: "vertical", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7, fontSize: 13 }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────── WORKFLOW TAB ────── */}
      {tab === "workflow" && (
        <div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#0D1B2A", marginBottom: 4 }}>Email Workflow</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>Full audit trail — per cycle, per client, per stakeholder, per employee</div>
          </div>

          {/* Cycle selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Cycle:</span>
            <select value={selCycle} onChange={e => setSelCycle(e.target.value)} style={{ fontSize: 13, padding: "6px 12px", width: "auto", border: "1.5px solid #E2E8F0", borderRadius: 8 }}>
              {(cycles || []).map(c => <option key={c.id} value={c.id}>{c.q} &mdash; {c.status}</option>)}
            </select>
          </div>

          {activeCycle ? (() => {
            // Find every unique stakeholder key for this cycle
            const cycleKeys = Object.keys(cycleEmailState || {}).filter(k => k.startsWith(activeCycle.id + "_"));
            const hasAny = cycleKeys.length > 0;

            if (!hasAny) {
              return (
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>&#128231;</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0D1B2A", marginBottom: 4 }}>No emails sent yet</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>Activate the cycle and use Request Review buttons to trigger emails.</div>
                </div>
              );
            }

            // Group keys by client
            const clientGroups = {};
            cycleKeys.forEach(key => {
              const parts = key.split("_");
              const clId = parts[1];
              const shId = parts[2];
              if (!clientGroups[clId]) clientGroups[clId] = [];
              clientGroups[clId].push({ shId, key });
            });

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Object.entries(clientGroups).map(([clId, shEntries]) => {
                  const cl = (clients || []).find(c => c.id === clId);
                  const clName = cl ? cl.name : clId;
                  const clColor = CLIENT_COLORS[clId] || "#64748B";

                  return (
                    <div key={clId} className="card" style={{ overflow: "hidden" }}>
                      {/* Client header */}
                      <div style={{
                        padding: "12px 20px", background: clColor + "10",
                        borderBottom: "2px solid " + clColor + "30", display: "flex", alignItems: "center", gap: 10
                      }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: clColor }} />
                        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 14, color: clColor }}>{clName}</div>
                        <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: "auto" }}>{shEntries.length} stakeholder{shEntries.length !== 1 ? "s" : ""}</span>
                      </div>

                      {/* Stakeholder rows */}
                      {shEntries.map(({ shId, key }) => {
                        const shState = cycleEmailState[key] || {};
                        const sh = cl ? cl.stakeholders.find(s => s.id === shId) : null;
                        const shName = sh ? sh.name : shId;
                        const shEmail = sh ? sh.email : "";
                        const logs = shState.logs || [];

                        // Determine which reminders were configured for this cycle
                        const hasR1 = activeCycle.r1;
                        const hasR2 = activeCycle.r2;
                        const r3Date = (activeCycle.reminders && activeCycle.reminders.length > 2) ? activeCycle.reminders[2] : null;
                        const hasR3 = !!r3Date;

                        const steps = [
                          { label: "Request Review", at: shState.requestAt, color: "#10B981", bg: "#F0FDF4", border: "#BBF7D0", icon: "&#9993;" },
                          hasR1 && { label: "Reminder 1", at: shState.reminder1At, color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: "&#9203;" },
                          hasR2 && { label: "Reminder 2", at: shState.reminder2At, color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE", icon: "&#9203;" },
                          hasR3 && { label: "Reminder 3", at: shState.reminder3At, color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: "&#9888;" },
                        ].filter(Boolean);

                        return (
                          <div key={shId} style={{ borderBottom: "1px solid #F1F5F9", padding: "16px 20px" }}>
                            {/* Stakeholder header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                              <Avatar name={shName} size={30} />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#0D1B2A" }}>{shName}</div>
                                <div style={{ fontSize: 11, color: "#64748B" }}>{shEmail}</div>
                              </div>
                              <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {steps.map(s => (
                                  <span key={s.label} style={{
                                    fontSize: 10, background: s.at ? s.bg : "#F8FAFC",
                                    color: s.at ? s.color : "#94A3B8",
                                    border: "1px solid " + (s.at ? s.border : "#E2E8F0"),
                                    borderRadius: 100, padding: "2px 8px", fontWeight: 600, whiteSpace: "nowrap"
                                  }}>
                                    {s.at ? "✓ " : "○ "}{s.label}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Email timeline */}
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                              {steps.map((s, si) => (
                                <div key={s.label} style={{
                                  flex: "0 0 auto", minWidth: 160, background: s.at ? s.bg : "#F8FAFC",
                                  border: "1.5px solid " + (s.at ? s.border : "#E2E8F0"),
                                  borderRadius: 10, padding: "10px 14px"
                                }}>
                                  <div style={{
                                    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .5,
                                    color: s.at ? s.color : "#94A3B8", marginBottom: 4
                                  }} dangerouslySetInnerHTML={{ __html: s.icon + " " + s.label }} />
                                  {s.at ? (
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", fontFamily: "'JetBrains Mono',monospace" }}>{s.at}</div>
                                  ) : (
                                    <div style={{ fontSize: 11, color: "#CBD5E1" }}>Not sent yet</div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Per-employee log for this stakeholder */}
                            {logs.length > 0 && (
                              <div>
                                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: .4, marginBottom: 6 }}>
                                  Employee Activity Log ({logs.length} events)
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflowY: "auto" }}>
                                  {logs.map((log, li) => {
                                    const dot = log.type === "Review Request" ? "#10B981" :
                                      log.type === "Reminder 1" ? "#F59E0B" :
                                        log.type === "Reminder 2" ? "#8B5CF6" :
                                          log.type === "Reminder 3" ? "#EF4444" : "#64748B";
                                    return (
                                      <div key={li} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        background: "#FAFBFF", borderRadius: 7, padding: "6px 12px", border: "1px solid #F1F5F9"
                                      }}>
                                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", flex: 1 }}>{log.empName}</span>
                                        <span style={{
                                          fontSize: 11, background: dot + "18", color: dot, border: "1px solid " + dot + "33",
                                          borderRadius: 100, padding: "1px 7px", fontWeight: 600
                                        }}>{log.type}</span>
                                        <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>{log.at}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })() : (
            <div style={{ fontSize: 13, color: "#94A3B8" }}>Select a cycle to view its email history.</div>
          )}
        </div>
      )}

      {/* ────── CC MANAGEMENT TAB ────── */}
      {tab === "cc" && (
        <div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#0D1B2A", marginBottom: 4 }}>CC Management</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>All email IDs listed here will be CC&apos;d on every outgoing email from this system &mdash; review requests, reminders, thank-you emails, and submission confirmations.</div>
          </div>

          {/* Warning if not Super Admin */}
          {!isSuperAdmin && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "#991B1B", display: "flex", gap: 8 }}>
              &#128274; CC Management can only be edited by Super Admin.
            </div>
          )}

          {/* Add CC form — Super Admin only */}
          {isSuperAdmin && (
            <div className="card" style={{ padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 12 }}>
                Add CC Email
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input className="inp" placeholder="Full Name (optional)" value={newCC.name}
                  onChange={e => setNewCC(p => ({ ...p, name: e.target.value }))}
                  style={{ maxWidth: 200 }} />
                <input className="inp" placeholder="email@example.com" value={newCC.email}
                  onChange={e => { setNewCC(p => ({ ...p, email: e.target.value })); setCcErr(""); }}
                  style={{ flex: 1 }} />
                <button className="btn-primary" style={{ whiteSpace: "nowrap" }} onClick={addCC}>+ Add</button>
              </div>
              {ccErr && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>{ccErr}</div>}
            </div>
          )}

          {/* CC list */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{
              padding: "12px 20px", borderBottom: "1px solid #F1F5F9", background: "#FAFBFF",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: "#0D1B2A" }}>
                Active CC List ({ccList.length} email{ccList.length !== 1 ? "s" : ""})
              </span>
              <span style={{ fontSize: 11, color: "#64748B" }}>Applied to all outgoing emails system-wide</span>
            </div>
            {ccList.length === 0 ? (
              <div style={{ padding: "32px 24px", textAlign: "center", fontSize: 13, color: "#94A3B8" }}>No CC emails configured.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Added</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ccList.map(cc => (
                    <tr key={cc.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={cc.name} size={28} />
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#0D1B2A" }}>{cc.name}</span>
                          {cc.locked && <span style={{ fontSize: 10, background: "#FFF5F0", color: "#E8520A", border: "1px solid #FDBA74", borderRadius: 100, padding: "1px 7px", fontWeight: 700 }}>Default</span>}
                        </div>
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#3B82F6" }}>{cc.email}</td>
                      <td style={{ fontSize: 12, color: "#64748B" }}>{cc.addedAt}</td>
                      <td style={{ textAlign: "right" }}>
                        {isSuperAdmin && !cc.locked ? (
                          <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => { removeCC(cc.id); showToast("CC removed"); }}>Remove</button>
                        ) : (
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>&#128274; Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ────── TEMPLATE PREVIEW MODAL ────── */}
      {preview && (() => {
        const tpl = emailTemplates.find(t => t.id === preview);
        if (!tpl) return null;
        const meta = TYPE_META[tpl.type] || { color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0", label: tpl.name };
        return (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPreview(null); }}>
            <div className="modal" style={{ maxWidth: 620, width: "96vw" }}>
              <div style={{
                padding: "20px 28px", borderBottom: "1px solid #F1F5F9",
                background: "linear-gradient(135deg,#0D1B2A 0%,#1E3A5F 100%)", borderRadius: "14px 14px 0 0",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>{tpl.name}</div>
                  <div style={{ fontSize: 12, color: "#8CA4BE", marginTop: 2 }}>Email Template Preview</div>
                </div>
                <button onClick={() => setPreview(null)} style={{ background: "none", border: "none", color: "#8CA4BE", fontSize: 22, cursor: "pointer" }}>&#215;</button>
              </div>
              <div style={{ padding: "24px 28px" }}>
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 16px", marginBottom: 16, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 3, textTransform: "uppercase" }}>Subject</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1B2A" }}>{tpl.subject || "(no subject)"}</div>
                </div>
                <div style={{
                  background: "#FAFBFF", borderRadius: 10, padding: "16px 18px", border: "1px solid #E2E8F0",
                  fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.8, color: "#1E293B", whiteSpace: "pre-wrap", maxHeight: 340, overflowY: "auto"
                }}>
                  {renderVars(tpl.body, "[Stakeholder Name]", [{ name: "Employee 1" }, { name: "Employee 2" }], "[Quarter]", "[Deadline]")}
                </div>
                <div style={{ marginTop: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "8px 14px", fontSize: 11, color: "#065F46" }}>
                  &#10003; CC list from CC Management will be automatically included on all sent emails.
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                  <button className="btn-secondary" onClick={() => setPreview(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && <Toast msg={toast} />}
    </div>
  );
};

export default EmailModule;
