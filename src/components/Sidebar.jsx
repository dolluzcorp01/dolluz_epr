import { useState, useEffect, useRef } from "react";
import { NAV_ITEMS } from "../constants";

const Sidebar = ({ active, setActive, leakageCount, reviewCount, onSignOut, profile, setProfile }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChgPwd, setShowChgPwd] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const menuRef = useRef(null);

  // profileDraft is a local edit buffer — only lives while the modal is open
  const [profileDraft, setProfileDraft] = useState(null);

  // Password state
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdErr, setPwdErr] = useState("");
  const [pwdOk, setPwdOk] = useState(false);

  // Close popover on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const openProfile = () => {
    setProfileDraft({ ...profile });
    setMenuOpen(false);
    setShowProfile(true);
  };

  const saveProfile = () => {
    setProfile({ ...profileDraft });
    setShowProfile(false);
  };

  const submitPwd = () => {
    setPwdErr("");
    if (!pwd.current) { setPwdErr("Current password is required."); return; }
    if (pwd.next.length < 8) { setPwdErr("New password must be at least 8 characters."); return; }
    if (pwd.next !== pwd.confirm) { setPwdErr("New passwords do not match."); return; }
    // In real app: API call here
    setPwdOk(true);
    setTimeout(() => { setShowChgPwd(false); setPwd({ current: "", next: "", confirm: "" }); setPwdOk(false); }, 1600);
  };

  const MENU_ITEMS = [
    { icon: "👤", label: "My Profile", action: openProfile },
    { icon: "🔒", label: "Change Password", action: () => { setMenuOpen(false); setShowChgPwd(true); } },
    { icon: "⚙️", label: "Settings", action: () => { setMenuOpen(false); setActive("settings"); } },
    { icon: "🚪", label: "Sign Out", action: () => { setMenuOpen(false); setShowSignOut(true); }, danger: true },
  ];

  // Reusable input style
  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E2E8F0",
    fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", background: "#F8FAFC", color: "#0D1B2A"
  };

  return (
    <>
      {/* ── Sidebar shell ── */}
      <div style={{
        width: 236, minHeight: "100vh", background: "#0D1B2A", display: "flex", flexDirection: "column",
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50, padding: "0 12px",
        boxShadow: "4px 0 24px rgba(0,0,0,.18)"
      }}>
        <div style={{ padding: "24px 8px 20px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: -0.5 }}>
            Dolluz<span style={{ color: "#E8520A" }}>.</span>
          </div>
          <div style={{ fontSize: 10.5, color: "#4A6FA5", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>EPR Portal</div>
        </div>
        <nav style={{ flex: 1, padding: "16px 0", display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 10, color: "#4A6FA5", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", padding: "4px 14px 8px" }}>Main Menu</div>
          {NAV_ITEMS.slice(0, 7).map(n => (
            <div key={n.id} className={`sidebar-item${active === n.id ? " active" : ""}`} onClick={() => setActive(n.id)}>
              <span style={{ fontSize: 15 }} dangerouslySetInnerHTML={{ __html: n.icon }} />
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.id === "reviews" && reviewCount > 0 && <span style={{ background: "#E8520A", color: "#fff", borderRadius: 100, fontSize: 10, fontWeight: 700, padding: "2px 7px" }}>{reviewCount}</span>}
              {n.id === "resources" && leakageCount > 0 && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 100, fontSize: 10, fontWeight: 700, padding: "2px 7px" }}>!{leakageCount}</span>}
            </div>
          ))}
          <div style={{ fontSize: 10, color: "#4A6FA5", fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", padding: "12px 14px 8px" }}>Analytics</div>
          {NAV_ITEMS.slice(7).map(n => (
            <div key={n.id} className={`sidebar-item${active === n.id ? " active" : ""}`} onClick={() => setActive(n.id)}>
              <span style={{ fontSize: 15 }} dangerouslySetInnerHTML={{ __html: n.icon }} />
              <span>{n.label}</span>
            </div>
          ))}
        </nav>

        {/* ── Profile chip ── */}
        <div style={{ padding: "12px 8px 16px", borderTop: "1px solid rgba(255,255,255,.07)", position: "relative" }} ref={menuRef}>

          {/* Popover menu — slides up above the chip */}
          {menuOpen && (
            <div className="pop" style={{
              position: "absolute", bottom: "calc(100% + 6px)", left: 8, right: 8,
              background: "#1A2E45", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,.4)",
              border: "1px solid rgba(255,255,255,.1)", overflow: "hidden", zIndex: 200
            }}>
              <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                <div style={{ fontSize: 11, color: "#4A6FA5", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>Account</div>
              </div>
              {MENU_ITEMS.map(item => (
                <div key={item.label} onClick={item.action}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                    cursor: "pointer", transition: "background .15s",
                    color: item.danger ? "#FCA5A5" : "#CBD5E1", fontSize: 13, fontWeight: 500
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = item.danger ? "rgba(239,68,68,.15)" : "rgba(255,255,255,.07)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          )}

          <div onClick={() => setMenuOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px", borderRadius: 10, cursor: "pointer",
              background: menuOpen ? "rgba(255,255,255,.1)" : "transparent", transition: "background .15s"
            }}
            onMouseEnter={e => { if (!menuOpen) e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
            onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = "transparent"; }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#E8520A,#FF8C5A)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0
            }}>
              {profile.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name}</div>
              <div style={{ fontSize: 11, color: "#4A6FA5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.designation} · {profile.company}</div>
            </div>
            <div style={{ fontSize: 14, color: menuOpen ? "#E8520A" : "#4A6FA5", transition: "color .15s", flexShrink: 0 }}>&#8942;</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MY PROFILE MODAL
      ══════════════════════════════════════════════════════ */}
      {showProfile && profileDraft && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowProfile(false); }}>
          <div className="modal" style={{ width: "min(480px, 96vw)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#0D1B2A,#1A3352)", padding: "24px 28px 20px", borderRadius: "14px 14px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#E8520A,#FF8C5A)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff"
                }}>
                  {profileDraft.avatar || (profileDraft.name ? profileDraft.name[0].toUpperCase() : "S")}
                </div>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 17, color: "#fff" }}>My Profile</div>
                  <div style={{ fontSize: 12, color: "#4A6FA5", marginTop: 2 }}>Edit your account information</div>
                </div>
                <button onClick={() => setShowProfile(false)} style={{
                  marginLeft: "auto", background: "rgba(255,255,255,.1)", border: "none",
                  color: "#fff", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center"
                }}>&#215;</button>
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .6 }}>Full Name</label>
                  <input style={inputStyle} value={profileDraft.name}
                    onChange={e => setProfileDraft(p => ({ ...p, name: e.target.value, avatar: e.target.value ? e.target.value[0].toUpperCase() : "S" }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .6 }}>Designation</label>
                  <input style={inputStyle} value={profileDraft.designation}
                    onChange={e => setProfileDraft(p => ({ ...p, designation: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .6 }}>Company</label>
                  <input style={inputStyle} value={profileDraft.company}
                    onChange={e => setProfileDraft(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .6 }}>Phone</label>
                  <input style={inputStyle} value={profileDraft.phone} placeholder="+91 98765 43210"
                    onChange={e => setProfileDraft(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .6 }}>Timezone</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={profileDraft.timezone}
                    onChange={e => setProfileDraft(p => ({ ...p, timezone: e.target.value }))}>
                    {["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York", "America/Los_Angeles", "UTC"].map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Avatar preview */}
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: "1.5px solid #E2E8F0" }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#E8520A,#FF8C5A)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff"
                }}>
                  {profileDraft.avatar || "S"}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2A" }}>{profileDraft.name || "—"}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{profileDraft.designation} · {profileDraft.company}</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 10, color: "#94A3B8", fontStyle: "italic" }}>Sidebar preview</div>
              </div>
            </div>
            <div style={{ padding: "0 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowProfile(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveProfile}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CHANGE PASSWORD MODAL
      ══════════════════════════════════════════════════════ */}
      {showChgPwd && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowChgPwd(false); setPwd({ current: "", next: "", confirm: "" }); setPwdErr(""); setPwdOk(false); } }}>
          <div className="modal" style={{ width: "min(420px, 96vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ background: "linear-gradient(135deg,#0D1B2A,#1A3352)", padding: "24px 28px 20px", borderRadius: "14px 14px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 17, color: "#fff" }}>Change Password</div>
                  <div style={{ fontSize: 12, color: "#4A6FA5", marginTop: 2 }}>Keep your account secure</div>
                </div>
                <button onClick={() => { setShowChgPwd(false); setPwd({ current: "", next: "", confirm: "" }); setPwdErr(""); setPwdOk(false); }}
                  style={{ background: "rgba(255,255,255,.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>&#215;</button>
              </div>
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
              {pwdOk ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#10B981" }}>Password changed successfully!</div>
                </div>
              ) : (
                <>
                  {[["Current Password", "current"], ["New Password", "next"], ["Confirm New Password", "confirm"]].map(([lbl, key]) => (
                    <div key={key}>
                      <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .6 }}>{lbl}</label>
                      <input type="password" style={inputStyle} value={pwd[key]}
                        onChange={e => { setPwdErr(""); setPwd(p => ({ ...p, [key]: e.target.value })); }} />
                    </div>
                  ))}
                  {pwdErr && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#B91C1C" }}>
                      {pwdErr}
                    </div>
                  )}
                  <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#64748B", lineHeight: 1.7 }}>
                    Password must be at least 8 characters and should include uppercase, numbers, and special characters.
                  </div>
                </>
              )}
            </div>
            {!pwdOk && (
              <div style={{ padding: "0 28px 24px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn-secondary" onClick={() => { setShowChgPwd(false); setPwd({ current: "", next: "", confirm: "" }); setPwdErr(""); }}>Cancel</button>
                <button className="btn-primary" onClick={submitPwd}>Update Password</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SIGN OUT CONFIRM MODAL
      ══════════════════════════════════════════════════════ */}
      {showSignOut && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSignOut(false); }}>
          <div className="modal" style={{ width: "min(400px, 96vw)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "36px 28px 24px" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🚪</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: "#0D1B2A", marginBottom: 8 }}>Sign out of EPR Portal?</div>
              <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginBottom: 24 }}>
                You'll be returned to the login screen. Any unsaved changes will be lost.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="btn-secondary" style={{ minWidth: 100 }} onClick={() => setShowSignOut(false)}>Cancel</button>
                <button className="btn-primary" style={{ background: "#EF4444", minWidth: 120 }}
                  onClick={() => { setShowSignOut(false); if (onSignOut) onSignOut(); }}>
                  Yes, Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
