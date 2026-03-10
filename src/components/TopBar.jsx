import { useState } from "react";
import { NOTIF_CFG } from "../constants";

const TopBar = ({ title, subtitle, onNewCycle, notifications = [], setPage }) => {
  const [bellOpen, setBellOpen] = useState(false);
  const [readIds, setReadIds] = useState(new Set());

  const unread = notifications.filter(n => !readIds.has(n.id)).length;
  const markAll = () => setReadIds(new Set(notifications.map(n => n.id)));
  const handleNotif = (n) => {
    setReadIds(p => new Set([...p, n.id]));
    setBellOpen(false);
    if (setPage && n.page) setPage(n.page);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
      <div>
        <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: "#0D1B2A", letterSpacing: -0.5 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>{subtitle}</p>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>

        {/* ── Bell ── */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setBellOpen(o => !o)}
            style={{ padding: "9px 13px", background: "#fff", border: `1.5px solid ${bellOpen ? "#E8520A" : "#E2E8F0"}`, borderRadius: 10, cursor: "pointer", fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center" }}>
            🔔
          </button>
          {unread > 0 && (
            <div style={{
              position: "absolute", top: -6, right: -6, background: "#EF4444", color: "#fff",
              borderRadius: "50%", minWidth: 18, height: 18, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 10, fontWeight: 800, border: "2px solid #F0F4F8", padding: "0 3px"
            }}>
              {unread > 9 ? "9+" : unread}
            </div>
          )}

          {bellOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0, width: 370, background: "#fff",
              borderRadius: 14, boxShadow: "0 12px 48px rgba(0,0,0,.18)", border: "1.5px solid #E2E8F0",
              zIndex: 300, overflow: "hidden", animation: "fadeUp .2s ease"
            }}>

              {/* Panel header */}
              <div style={{
                padding: "14px 18px", borderBottom: "1px solid #F1F5F9", background: "#FAFBFF",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A" }}>Notifications</div>
                  <div style={{ fontSize: 11, color: unread > 0 ? "#E8520A" : "#94A3B8", fontWeight: 600, marginTop: 2 }}>
                    {unread > 0 ? `${unread} unread · action required` : "All caught up"}
                  </div>
                </div>
                {unread > 0 && (
                  <button onClick={markAll} style={{
                    fontSize: 11, color: "#64748B", background: "none", border: "none",
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textDecoration: "underline"
                  }}>
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "36px 18px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <div style={{ fontSize: 13, color: "#64748B" }}>No notifications right now</div>
                  </div>
                ) : notifications.map(n => {
                  const isRead = readIds.has(n.id);
                  const cfg = NOTIF_CFG[n.type] || NOTIF_CFG.info;
                  return (
                    <div key={n.id} onClick={() => handleNotif(n)}
                      style={{
                        padding: "13px 18px", borderBottom: "1px solid #F8FAFC", cursor: "pointer",
                        background: isRead ? "#fff" : "#FAFBFF", display: "flex", gap: 12, alignItems: "flex-start",
                        transition: "background .15s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                      onMouseLeave={e => e.currentTarget.style.background = isRead ? "#fff" : "#FAFBFF"}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, background: cfg.bg,
                        border: `1.5px solid ${cfg.border}`, display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 17, flexShrink: 0
                      }}>{cfg.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: isRead ? 500 : 700, fontSize: 13, color: "#0D1B2A", marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.45 }}>{n.body}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                          <span style={{ fontSize: 10, color: "#94A3B8" }}>{n.time}</span>
                          {n.page && <span style={{
                            fontSize: 10, color: cfg.dot, fontWeight: 600,
                            background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "1px 7px", borderRadius: 100
                          }}>
                            Go to {n.page === "resources" ? "Allocation" : n.page.charAt(0).toUpperCase() + n.page.slice(1)} →
                          </span>}
                        </div>
                      </div>
                      {!isRead && <div style={{
                        width: 8, height: 8, borderRadius: "50%", background: cfg.dot,
                        flexShrink: 0, marginTop: 5
                      }} />}
                    </div>
                  );
                })}
              </div>

              {/* Panel footer */}
              <div style={{
                padding: "10px 18px", borderTop: "1px solid #F1F5F9", background: "#FAFBFF",
                display: "flex", justifyContent: "center"
              }}>
                <button onClick={() => { if (setPage) setPage("reviews"); setBellOpen(false); }}
                  style={{
                    fontSize: 12, color: "#E8520A", fontWeight: 600, background: "none",
                    border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif"
                  }}>
                  View all review activity →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── New Review Cycle ── */}
        <button className="btn-primary" onClick={onNewCycle || (() => { })}>
          + New Review Cycle
        </button>
      </div>

      {/* Overlay to close bell panel */}
      {bellOpen && (
        <div onClick={() => setBellOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 299 }} />
      )}
    </div>
  );
};

export default TopBar;
