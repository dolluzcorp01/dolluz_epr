import { useState, useEffect } from "react";
import { uid, CLIENT_COLORS } from "../constants";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import FieldRow from "../components/FieldRow";
import Toast from "../components/Toast";
import { apiFetch } from "../utils/api";

const Settings = ({ topBarProps, profile, setProfile, clients, currentRole }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("");
  const showToast = (msg, type = "") => { setToast(msg); setToastType(type); setTimeout(() => { setToast(""); setToastType(""); }, 2800); };

  // ── User management state ──
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: "", body: "", priority: "Medium" });

  const ROLE_LABEL = { super_admin: "Super Admin", sub_admin: "Sub-Admin", hr_viewer: "HR Viewer", viewer: "Viewer", admin: "Admin" };

  useEffect(() => {
    apiFetch("/api/settings/users")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) setUsers(d.data.map(u => ({
          ...u,
          role: ROLE_LABEL[u.role] || u.role,
          status: u.is_active ? "Active" : "Inactive",
          lastLogin: u.last_login_at
            ? new Date(u.last_login_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "Never",
          avatar: u.avatar_initials || (u.name ? u.name[0].toUpperCase() : "?"),
          assignedClients: u.assignedClients || [],
          assignedStakeholders: u.assignedStakeholders || [],
        })));
      })
      .catch(() => { });
    apiFetch("/api/settings")
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setSec(prev => ({ ...prev, ...d.data })); })
      .catch(() => { });
  }, []); // eslint-disable-line
  const blankUser = { name: "", email: "", role: currentRole === "Admin" ? "Sub-Admin" : "Admin", status: "Active", assignedClients: [], assignedStakeholders: [] };
  const [newUser, setNewUser] = useState(blankUser);

  // Roles creatable by current user
  const creatableRoles = currentRole === "Super Admin" ? ["Admin", "Sub-Admin"] : currentRole === "Admin" ? ["Sub-Admin"] : [];

  const roleColor = r => ({ "Super Admin": "#E8520A", "Admin": "#3B82F6", "Sub-Admin": "#8B5CF6" }[r] || "#94A3B8");
  const roleBg = r => ({ "Super Admin": "#FFF5F0", "Admin": "#EFF6FF", "Sub-Admin": "#F5F3FF" }[r] || "#F8FAFC");

  const saveUser = async () => {
    if (!newUser.name || !newUser.email) { showToast("Name and email are required", "error"); return; }
    if (newUser.role === "Sub-Admin" && newUser.assignedClients.length === 0) { showToast("Sub-Admin must be assigned to at least one client", "error"); return; }
    if (editUser) {
      const prev = [...users];
      setUsers(p => p.map(u => u.id === editUser ? { ...u, ...newUser } : u));
      setShowAddUser(false); setEditUser(null); setNewUser(blankUser);
      try {
        const res = await apiFetch(`/api/settings/users/${editUser}`, { method: "PUT", body: JSON.stringify(newUser) });
        const d = await res.json();
        if (!d.success) { setUsers(prev); showToast("Error: " + (d.message || "Update failed"), "error"); return; }
        showToast(newUser.name + " updated");
      } catch (e) { setUsers(prev); showToast("Network error — update not saved", "error"); }
    } else {
      const tempUser = { ...newUser, id: "U" + uid(), lastLogin: "Never", avatar: newUser.name ? newUser.name[0].toUpperCase() : "?" };
      const prev = [...users];
      setUsers(p => [...p, tempUser]);
      setShowAddUser(false); setEditUser(null); setNewUser(blankUser);
      try {
        const res = await apiFetch("/api/settings/users", { method: "POST", body: JSON.stringify(newUser) });
        const d = await res.json();
        if (!d.success) { setUsers(prev); showToast("Error: " + (d.message || "Add failed"), "error"); return; }
        const newId = d.data?.id || d.id;
        if (newId) setUsers(p => p.map(u => u.id === tempUser.id ? { ...u, id: newId } : u));
        showToast(newUser.name + " added — welcome email sent");
      } catch (e) { setUsers(prev); showToast("Network error — user not saved", "error"); }
    }
  };

  const toggleUserStatus = async id => {
    const user = users.find(u => u.id === id);
    const newStatus = user?.status === "Active" ? "Inactive" : "Active";
    const prev = [...users];
    setUsers(p => p.map(u => u.id === id ? { ...u, status: newStatus } : u));
    try {
      const res = await apiFetch(`/api/settings/users/${id}`, { method: "PUT", body: JSON.stringify({ status: newStatus }) });
      const d = await res.json();
      if (!d.success) { setUsers(prev); showToast("Error: " + (d.message || "Status update failed"), "error"); }
    } catch (e) { setUsers(prev); showToast("Network error — status not changed", "error"); }
  };
  const deleteUser = async id => {
    const user = users.find(u => u.id === id);
    const prev = [...users];
    setUsers(p => p.filter(u => u.id !== id));
    try {
      const res = await apiFetch(`/api/settings/users/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.success) { setUsers(prev); showToast("Error: " + (d.message || "Delete failed"), "error"); return; }
      showToast("User removed");
    } catch (e) { setUsers(prev); showToast("Network error — user not deleted", "error"); }
  };

  const postAnnouncement = async () => {
    if (!newAnn.title || !newAnn.body) { showToast("Title and message are required", "error"); return; }
    const entry = { id: "AN" + uid(), ...newAnn, author: profile.name || "Admin", date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), read: 0 };
    const prev = [...announcements];
    setAnnouncements(p => [entry, ...p]);
    setNewAnn({ title: "", body: "", priority: "Medium" });
    try {
      const res = await apiFetch("/api/announcements", { method: "POST", body: JSON.stringify({ title: newAnn.title, body: newAnn.body, priority: newAnn.priority }) });
      const d = await res.json();
      if (!d.success) { setAnnouncements(prev); showToast("Error: " + (d.message || "Post failed"), "error"); return; }
      showToast("Announcement posted to all sub-users");
    } catch (e) { setAnnouncements(prev); showToast("Network error — announcement not posted", "error"); }
  };
  // Can current user reset password for target user?
  const canResetPwd = (targetRole) => {
    if (currentRole === "Super Admin") return targetRole === "Admin" || targetRole === "Sub-Admin";
    if (currentRole === "Admin") return targetRole === "Sub-Admin";
    return false;
  };

  // Toggle client assignment for Sub-Admin scope
  const toggleClient = (clId) => {
    setNewUser(p => {
      const has = p.assignedClients.includes(clId);
      const newClients = has ? p.assignedClients.filter(c => c !== clId) : [...p.assignedClients, clId];
      const validShs = (clients || []).filter(cl => newClients.includes(cl.id)).flatMap(cl => cl.stakeholders.map(s => s.id));
      return { ...p, assignedClients: newClients, assignedStakeholders: p.assignedStakeholders.filter(s => validShs.includes(s)) };
    });
  };
  const toggleStakeholder = (shId) => {
    setNewUser(p => ({ ...p, assignedStakeholders: p.assignedStakeholders.includes(shId) ? p.assignedStakeholders.filter(s => s !== shId) : [...p.assignedStakeholders, shId] }));
  };

  const prioColor = p => ({ High: "#EF4444", Medium: "#F59E0B", Low: "#10B981" }[p] || "#94A3B8");
  const prioBg = p => ({ High: "#FEF2F2", Medium: "#FFFBEB", Low: "#F0FDF4" }[p] || "#F8FAFC");

  // ── Security state ──
  const [sec, setSec] = useState({ sessionTimeout: "30", maxLoginAttempts: "5", lockoutDuration: "15", enforce2FA: false, passwordMinLen: "8", requireSpecialChar: true, requireUppercase: true, requireNumber: true, logoutOnClose: false });
  const updSec = (k, v) => setSec(p => ({ ...p, [k]: v }));

  // ── Profile state lives in App root (shared with Sidebar) ──
  const [pwForm, setPwForm] = useState({ current: "", newpw: "", confirm: "" });

  const Tab = ({ i, label, icon }) => (
    <button onClick={() => setActiveTab(i)} style={{
      padding: "12px 18px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: activeTab === i ? 700 : 500,
      background: activeTab === i ? "#FFF5F0" : "#fff", color: activeTab === i ? "#E8520A" : "#475569",
      borderBottom: activeTab === i ? "2.5px solid #E8520A" : "2.5px solid transparent",
      display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap"
    }}>
      <span dangerouslySetInnerHTML={{ __html: icon }} /> {label}
    </button>
  );

  return (
    <div className="fade-in">
      <TopBar title="System Settings" subtitle="Admin panel — users, security, announcements, system config" {...topBarProps} />

      <div className="card" style={{ marginBottom: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", overflowX: "auto" }}>
          <Tab i={0} label="User Management" icon="&#128101;" />
          <Tab i={1} label="Security & Access" icon="&#128274;" />
          <Tab i={2} label="Announcements" icon="&#128226;" />
          <Tab i={3} label="My Profile" icon="&#128100;" />
          <Tab i={4} label="System Config" icon="&#9881;" />
        </div>

        {/* ── Tab 0: User Management ── */}
        {activeTab === 0 && (
          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A" }}>Portal Users</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Manage who can log in, their roles and scoped permissions</div>
              </div>
              {creatableRoles.length > 0 && (
                <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => { setEditUser(null); setNewUser(blankUser); setShowAddUser(true); }}>+ Add User</button>
              )}
            </div>

            {/* ── Role Permission Matrix ── */}
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "16px 18px", marginBottom: 20, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 12 }}>Role Permission Matrix</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ minWidth: 560, fontSize: 11, borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "6px 12px", width: 200, color: "#0D1B2A" }}>Capability</th>
                      {["Super Admin", "Admin", "Sub-Admin"].map(r => (
                        <th key={r} style={{
                          textAlign: "center", padding: "6px 16px",
                          color: roleColor(r), background: roleBg(r), borderRadius: 6
                        }}>{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Create Admins", true, false, false],
                      ["Create Sub-Admins", true, true, false],
                      ["Reset Admin passwords", true, false, false],
                      ["Reset Sub-Admin passwords", true, true, false],
                      ["Delete any record", true, false, false],
                      ["Add / Edit Employees", true, true, false],
                      ["Activate / Close Cycles", true, true, false],
                      ["Send Emails & Reminders", true, true, false],
                      ["View Employees", true, true, true],
                      ["View Allocation %", true, true, true],
                      ["View Cycles", true, true, true],
                      ["Export Excel / PDF", true, true, true],
                      ["Access Settings", true, false, false],
                    ].map(([cap, sa, ad, sub]) => (
                      <tr key={cap} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "7px 12px", fontSize: 12, color: "#475569", fontWeight: 500 }}>{cap}</td>
                        {[sa, ad, sub].map((allowed, i) => (
                          <td key={i} style={{ textAlign: "center", padding: "7px 16px" }}>
                            {allowed
                              ? <span style={{ color: "#10B981", fontSize: 15, fontWeight: 800 }}>✓</span>
                              : <span style={{ color: "#E2E8F0", fontSize: 13 }}>✗</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#94A3B8", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>🔒 Sub-Admin scope is restricted to assigned clients &amp; stakeholders only</span>
                <span>🚫 Admin delete actions show disabled tooltip pointing to Super Admin</span>
              </div>
            </div>

            {/* ── User List ── */}
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  // Derive scope label for Sub-Admins
                  const scopeClients = (u.assignedClients || []).map(cid => {
                    const cl = (clients || []).find(c => c.id === cid);
                    return cl ? cl.name.split(" ")[0] : cid;
                  });
                  const scopeLabel = u.role !== "Sub-Admin" ? "—"
                    : scopeClients.length === 0 ? "⚠ No scope set"
                      : scopeClients.join(", ");

                  // Delete button state for this user
                  const canDelete = currentRole === "Super Admin" && u.role !== "Super Admin";
                  const adminBlockedDelete = currentRole === "Admin" && u.role !== "Super Admin";

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: "linear-gradient(135deg,#E8520A,#FF8C5A)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0
                          }}>
                            {u.avatar}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: "#94A3B8" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: roleBg(u.role), color: roleColor(u.role),
                          borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700
                        }}>{u.role}</span>
                      </td>
                      <td style={{ fontSize: 11, color: scopeLabel === "⚠ No scope set" ? "#EF4444" : "#475569", maxWidth: 160 }}>
                        {scopeLabel}
                        {u.role === "Sub-Admin" && (u.assignedStakeholders || []).length > 0 && (
                          <div style={{ fontSize: 10, color: "#8B5CF6", marginTop: 2 }}>
                            {(u.assignedStakeholders || []).length} stakeholder{(u.assignedStakeholders || []).length !== 1 ? "s" : ""} assigned
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          background: u.status === "Active" ? "#F0FDF4" : "#F8FAFC",
                          color: u.status === "Active" ? "#10B981" : "#94A3B8",
                          borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600
                        }}>{u.status}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#475569" }}>{u.lastLogin}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {/* Edit — Super Admin can edit anyone, Admin can edit Sub-Admins */}
                          {((currentRole === "Super Admin" && u.role !== "Super Admin") ||
                            (currentRole === "Admin" && u.role === "Sub-Admin")) && (
                              <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => {
                                setEditUser(u.id);
                                setNewUser({
                                  name: u.name, email: u.email, role: u.role, status: u.status,
                                  assignedClients: u.assignedClients || [], assignedStakeholders: u.assignedStakeholders || []
                                });
                                setShowAddUser(true);
                              }}>Edit</button>
                            )}

                          {/* Reset Password */}
                          {canResetPwd(u.role) && (
                            <button className="btn-ghost" style={{ fontSize: 11, color: "#3B82F6" }}
                              onClick={() => setResetPwdUser(u)}>Reset Pwd</button>
                          )}

                          {/* Activate / Deactivate */}
                          {u.role !== "Super Admin" && (currentRole === "Super Admin" || (currentRole === "Admin" && u.role === "Sub-Admin")) && (
                            <button className="btn-ghost" style={{ fontSize: 11, color: u.status === "Active" ? "#F59E0B" : "#10B981" }}
                              onClick={() => toggleUserStatus(u.id)}>
                              {u.status === "Active" ? "Deactivate" : "Activate"}
                            </button>
                          )}

                          {/* Delete — Super Admin: enabled | Admin: disabled with tooltip | Sub-Admin: hidden */}
                          {canDelete && (
                            <button className="btn-ghost" style={{ fontSize: 11, color: "#EF4444" }}
                              onClick={() => deleteUser(u.id)}>Remove</button>
                          )}
                          {adminBlockedDelete && (
                            <div style={{ position: "relative", display: "inline-block" }}
                              title="Only Super Admin can delete records">
                              <button className="btn-ghost" disabled style={{
                                fontSize: 11, color: "#EF4444", opacity: 0.4, cursor: "not-allowed",
                                border: "1.5px dashed #EF4444"
                              }}>Remove</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── Add / Edit User Modal ── */}
            {showAddUser && (
              <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAddUser(false); }}>
                <div className="modal" style={{ maxWidth: 500 }}>
                  <div style={{ padding: "22px 26px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16, color: "#0D1B2A" }}>
                      {editUser ? "Edit User" : "Add Portal User"}
                    </div>
                    <button onClick={() => setShowAddUser(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>&#215;</button>
                  </div>
                  <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "70vh", overflowY: "auto" }}>
                    {/* Name */}
                    <div>
                      <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Full Name *</label>
                      <input className="inp" type="text" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value, avatar: e.target.value[0] ? e.target.value[0].toUpperCase() : "" }))} placeholder="Full Name" />
                    </div>
                    {/* Email */}
                    <div>
                      <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Email Address *</label>
                      <input className="inp" type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="user@dolluz.com" />
                    </div>
                    {/* Role — only show if multiple options */}
                    {creatableRoles.length > 1 && (
                      <div>
                        <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Role *</label>
                        <select className="inp" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value, assignedClients: [], assignedStakeholders: [] }))}>
                          {creatableRoles.map(r => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                    )}
                    {creatableRoles.length === 1 && (
                      <div>
                        <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Role</label>
                        <div style={{
                          padding: "9px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0",
                          fontSize: 13, color: roleColor(creatableRoles[0]), fontWeight: 700
                        }}>{creatableRoles[0]}</div>
                      </div>
                    )}

                    {/* ── Sub-Admin Scope Assignment ── */}
                    {newUser.role === "Sub-Admin" && (
                      <div style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#6D28D9", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                          🎯 Scope Assignment
                        </div>
                        <div style={{ fontSize: 11, color: "#7C3AED", marginBottom: 12 }}>
                          Assign this Sub-Admin to specific clients and optionally to individual stakeholders within each client.
                        </div>
                        {(clients || []).map(cl => (
                          <div key={cl.id} style={{ marginBottom: 10 }}>
                            {/* Client checkbox */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <input type="checkbox" id={"cl_" + cl.id}
                                checked={newUser.assignedClients.includes(cl.id)}
                                onChange={() => toggleClient(cl.id)}
                                style={{ width: 15, height: 15, accentColor: "#8B5CF6" }} />
                              <label htmlFor={"cl_" + cl.id} style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: cl.color || cl.color_hex || CLIENT_COLORS[cl.id] || "#64748B", display: "inline-block" }} />
                                {cl.name}
                              </label>
                            </div>
                            {/* Stakeholder sub-checkboxes */}
                            {newUser.assignedClients.includes(cl.id) && cl.stakeholders && cl.stakeholders.filter(s => s.active).length > 0 && (
                              <div style={{ paddingLeft: 26, display: "flex", flexDirection: "column", gap: 5 }}>
                                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>
                                  Stakeholders (leave all unchecked to access all)
                                </div>
                                {cl.stakeholders.filter(s => s.active).map(sh => (
                                  <div key={sh.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input type="checkbox" id={"sh_" + sh.id}
                                      checked={newUser.assignedStakeholders.includes(sh.id)}
                                      onChange={() => toggleStakeholder(sh.id)}
                                      style={{ width: 14, height: 14, accentColor: "#8B5CF6" }} />
                                    <label htmlFor={"sh_" + sh.id} style={{ fontSize: 12, color: "#475569", cursor: "pointer" }}>
                                      {sh.name}
                                      <span style={{ marginLeft: 6, fontSize: 10, color: "#94A3B8" }}>({sh.designation})</span>
                                      <span style={{
                                        marginLeft: 6, fontSize: 10, fontWeight: 600,
                                        color: sh.level === "client" ? "#3B82F6" : "#8B5CF6"
                                      }}>
                                        {sh.level === "client" ? "All Employees" : "Dept Only"}
                                      </span>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {newUser.assignedClients.length === 0 && (
                          <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, marginTop: 4 }}>
                            ⚠ At least one client must be assigned
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    <div>
                      <label style={{ fontSize: 12, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Status</label>
                      <select className="inp" value={newUser.status} onChange={e => setNewUser(p => ({ ...p, status: e.target.value }))}>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>

                    <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#166534" }}>
                      {editUser ? "Changes take effect immediately." : "A welcome email with login credentials will be sent automatically."}
                    </div>
                  </div>
                  <div style={{ padding: "0 26px 22px", display: "flex", gap: 8 }}>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={saveUser}>
                      {editUser ? "Save Changes" : "Add User"}
                    </button>
                    <button className="btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Password Reset Modal ── */}
            {resetPwdUser && (
              <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setResetPwdUser(null); }}>
                <div className="modal" style={{ maxWidth: 420 }}>
                  <div style={{ padding: "22px 26px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16, color: "#0D1B2A" }}>Reset Password</div>
                    <button onClick={() => setResetPwdUser(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94A3B8" }}>&#215;</button>
                  </div>
                  <div style={{ padding: "22px 26px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, background: "#F8FAFC", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#E8520A,#FF8C5A)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff"
                      }}>
                        {resetPwdUser.avatar}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2A" }}>{resetPwdUser.name}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{resetPwdUser.email}</div>
                        <span style={{
                          background: roleBg(resetPwdUser.role), color: roleColor(resetPwdUser.role),
                          borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700
                        }}>{resetPwdUser.role}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
                      A password reset link will be sent to <strong>{resetPwdUser.email}</strong>.
                      The user must click the link within 24 hours to set a new password.
                    </div>
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#991B1B", marginBottom: 16 }}>
                      ⚠ The user's current session will be invalidated immediately.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => {
                        showToast("Password reset email sent to " + resetPwdUser.email);
                        setResetPwdUser(null);
                      }}>Send Reset Link</button>
                      <button className="btn-secondary" onClick={() => setResetPwdUser(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 1: Security & Access ── */}
        {activeTab === 1 && (
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Password Policy */}
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 16 }}>Password Policy</div>
                {[
                  ["Minimum Length", "passwordMinLen", "number"],
                  ["Max Login Attempts", "maxLoginAttempts", "number"],
                  ["Lockout Duration (min)", "lockoutDuration", "number"],
                ].map(([l, k, t]) => (
                  <div key={k} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 5 }}>{l}</label>
                    <input className="inp" type={t} value={sec[k]} onChange={e => updSec(k, e.target.value)} style={{ maxWidth: 120 }} />
                  </div>
                ))}
                {[
                  ["Require Special Character", "requireSpecialChar"],
                  ["Require Uppercase Letter", "requireUppercase"],
                  ["Require Numeric Digit", "requireNumber"],
                ].map(([l, k]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <input type="checkbox" checked={sec[k]} onChange={e => updSec(k, e.target.checked)} style={{ width: 16, height: 16 }} />
                    <label style={{ fontSize: 13, color: "#475569", cursor: "pointer" }}>{l}</label>
                  </div>
                ))}
              </div>

              {/* Session & 2FA */}
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 16 }}>Session & Authentication</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 5 }}>Session Timeout (minutes)</label>
                  <input className="inp" type="number" value={sec.sessionTimeout} onChange={e => updSec("sessionTimeout", e.target.value)} style={{ maxWidth: 120 }} onKeyDown={(e) => { if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault(); }} />
                </div>
                {[
                  ["Enforce Two-Factor Auth (2FA)", "enforce2FA"],
                  ["Auto-logout on browser close", "logoutOnClose"],
                ].map(([l, k]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <input type="checkbox" checked={sec[k]} onChange={e => updSec(k, e.target.checked)} style={{ width: 16, height: 16 }} />
                    <label style={{ fontSize: 13, color: "#475569", cursor: "pointer" }}>{l}</label>
                  </div>
                ))}
                <div style={{ marginTop: 20, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>Admin Login Security</div>
                  <div style={{ fontSize: 12, color: "#7F1D1D" }}>Admin sessions require re-authentication after {sec.sessionTimeout} minutes of inactivity. Failed attempts beyond {sec.maxLoginAttempts} will lock the account for {sec.lockoutDuration} minutes.</div>
                </div>
                <div style={{ marginTop: 16, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6 }}>Audit Log</div>
                  <div style={{ fontSize: 11, color: "#166534" }}>Audit log entries will appear here as users take actions in the portal.</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn-primary" style={{ fontSize: 12 }} onClick={async () => { showToast("Security settings saved"); try { await apiFetch("/api/settings", { method: "PUT", body: JSON.stringify(sec) }); } catch (e) { } }}>Save Security Settings</button>
              <button className="btn-danger" style={{ fontSize: 12 }} onClick={() => showToast("All active sessions terminated", "error")}>Force Logout All Users</button>
            </div>
          </div>
        )}

        {/* ── Tab 2: Announcements ── */}
        {activeTab === 2 && (
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }}>
              {/* Compose */}
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 16 }}>New Announcement</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 5 }}>Title *</label>
                  <input className="inp" value={newAnn.title} onChange={e => setNewAnn(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 5 }}>Priority</label>
                  <select className="inp" value={newAnn.priority} onChange={e => setNewAnn(p => ({ ...p, priority: e.target.value }))}>
                    {["High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 5 }}>Message *</label>
                  <textarea className="inp" rows={5} value={newAnn.body}
                    onChange={e => setNewAnn(p => ({ ...p, body: e.target.value }))}
                    placeholder="Write your announcement here..."
                    style={{ resize: "vertical", fontFamily: "'DM Sans',sans-serif" }} />
                </div>
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1E40AF", marginBottom: 14 }}>
                  Will be broadcast to all {users.filter(u => u.status === "Active").length} active portal users on the next login.
                </div>
                <button className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 13 }} onClick={postAnnouncement}>
                  📢 Post Announcement
                </button>
              </div>
              {/* History */}
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 16 }}>Posted Announcements ({announcements.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {announcements.map(a => (
                    <div key={a.id} style={{
                      background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1px solid #F1F5F9",
                      borderLeft: `3px solid ${prioColor(a.priority)}`
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#0D1B2A", flex: 1 }}>{a.title}</div>
                        <span style={{ background: prioBg(a.priority), color: prioColor(a.priority), borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{a.priority}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 5, lineHeight: 1.6 }}>{a.body}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#94A3B8" }}>
                        <span>{a.author} · {a.date}</span>
                        <span>{a.read} users read</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: My Profile ── */}
        {activeTab === 3 && (
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Profile info */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, padding: "16px", background: "linear-gradient(135deg,#0D1B2A,#1E3A5F)", borderRadius: 12 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#E8520A,#FF8C5A)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0
                  }}>{profile.avatar || "S"}</div>
                  <div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16, color: "#fff" }}>{profile.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{profile.designation} · {profile.company}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{profile.email}</div>
                  </div>
                </div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 14 }}>Edit Profile</div>
                {[["Full Name", "name"], ["Phone", "phone"], ["Designation", "designation"], ["Company", "company"], ["Timezone", "timezone"]].map(([l, k]) => (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 5 }}>{l}</label>
                    <input className="inp" value={profile[k] || ""} onChange={e => {
                      const val = e.target.value;
                      setProfile(p => ({ ...p, [k]: val, ...(k === "name" ? { avatar: val ? val[0].toUpperCase() : "S" } : {}) }));
                    }} />
                  </div>
                ))}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 5 }}>Email (read-only)</label>
                  <input className="inp" value={profile.email} readOnly style={{ background: "#F8FAFC", color: "#94A3B8" }} />
                </div>
                <button className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 13 }}
                  onClick={async () => { showToast("Profile updated successfully — sidebar reflects changes"); try { await apiFetch("/api/settings/profile", { method: "PUT", body: JSON.stringify(profile) }); } catch (e) { } }}>Save Profile</button>
              </div>
              {/* Password change */}
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 14 }}>Change Password</div>
                {[["Current Password", "current"], ["New Password", "newpw"], ["Confirm New Password", "confirm"]].map(([l, k]) => (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 5 }}>{l}</label>
                    <input className="inp" type="password" value={pwForm[k]} onChange={e => setPwForm(p => ({ ...p, [k]: e.target.value }))} placeholder={l} />
                  </div>
                ))}
                <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Password Requirements:</div>
                  {["At least 8 characters", "One uppercase letter", "One number", "One special character"].map((r, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#64748B", marginBottom: 3 }}>✓ {r}</div>
                  ))}
                </div>
                <button className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 13 }}
                  onClick={() => {
                    if (!pwForm.current || !pwForm.newpw) { showToast("All password fields are required", "error"); return; }
                    if (pwForm.newpw !== pwForm.confirm) { showToast("New passwords do not match", "error"); return; }
                    setPwForm({ current: "", newpw: "", confirm: "" });
                    showToast("Password changed successfully");
                  }}>Update Password</button>

                <div style={{ marginTop: 24, borderTop: "1px solid #F1F5F9", paddingTop: 20 }}>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 14 }}>Forgot Password Flow</div>
                  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "14px 16px", fontSize: 12, color: "#166534", lineHeight: 1.8 }}>
                    <strong>How it works:</strong><br />
                    1. Click "Send Reset Link" below.<br />
                    2. An OTP + reset link is emailed to your registered email.<br />
                    3. OTP expires in 10 minutes.<br />
                    4. After verification, set a new password.<br />
                    5. All active sessions are invalidated.
                  </div>
                  <button className="btn-secondary" style={{ marginTop: 12, width: "100%", justifyContent: "center", fontSize: 12 }}
                    onClick={() => showToast("Password reset link sent to " + profile.email)}>
                    📧 Send Reset Link to My Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 4: System Config ── */}
        {activeTab === 4 && (
          <div style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { title: "OTP Configuration", icon: "&#128274;", fields: [["OTP Validity (minutes)", "10"], ["Max OTP attempts", "3"], ["Resend cooldown (seconds)", "60"]] },
                { title: "Link Expiry", icon: "&#9201;", fields: [["Review link expiry (days)", "30"], ["Reactivation window (days)", "7"], ["OTP link expiry (minutes)", "10"]] },
                { title: "Email Configuration", icon: "&#128231;", fields: [["SMTP / Service", ""], ["Sender name", ""], ["Reply-to", ""]] },
                { title: "Branding", icon: "&#127912;", fields: [["Company name", ""], ["Portal title", "EPR Portal"], ["Primary colour", "#E8520A"]] },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: "22px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <span style={{ fontSize: 20 }} dangerouslySetInnerHTML={{ __html: s.icon }} />
                    <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A" }}>{s.title}</span>
                  </div>
                  {s.fields.map(([l, v], j) => (
                    <div key={j} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 5 }}>{l}</label>
                      <input defaultValue={v} />
                    </div>
                  ))}
                  <button className="btn-primary" style={{ marginTop: 4, width: "100%", justifyContent: "center" }}
                    onClick={() => showToast(s.title + " saved", "#10B981")}>Save</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {toast && <Toast msg={toast} type={toastType} />
      )}
    </div>
  );
};

export default Settings;
