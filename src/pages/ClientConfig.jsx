import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import FieldRow from "../components/FieldRow";
import Toast from "../components/Toast";
import { uid, CLIENT_COLORS } from "../constants";
import { apiFetch } from "../utils/api";

const SHTable = ({ rows, onUpdate, onDelete, onToggle, activeEmails = [], primaryStakeholderId, onSetPrimary }) => {
  if (!rows.length) return null;
  const isClientLevel = rows.length > 0 && rows[0].level === "client";
  return (
    <div style={{ border: "1.5px solid #F1F5F9", borderRadius: 10, overflow: "hidden" }}>
      <table>
        <thead>
          <tr>
            {["Full Name", "Email", "Designation", "Active", isClientLevel ? "Primary" : "", ""].map((h, i) => (
              <th key={i} style={{ padding: "8px 12px", fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            const isPrimary = primaryStakeholderId ? s.id === primaryStakeholderId : i === 0;
            return (
              <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#FAFBFF", opacity: s.active ? 1 : 0.55 }}>
                <td style={{ padding: "9px 12px", minWidth: 180 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <input className="inp" value={s.name} onChange={e => onUpdate(s.id, "name", e.target.value)} style={{ fontSize: 12, padding: "6px 9px", width: "100%" }} />
                    {activeEmails.includes(s.email) && (
                      <span style={{ background: "#D1FAE5", color: "#065F46", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100, whiteSpace: "nowrap", alignSelf: "flex-start" }}>Active Review</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "9px 12px" }}><input className="inp" value={s.email} onChange={e => onUpdate(s.id, "email", e.target.value)} style={{ fontSize: 12, padding: "6px 9px" }} /></td>
                <td style={{ padding: "9px 12px" }}><input className="inp" value={s.designation} onChange={e => onUpdate(s.id, "designation", e.target.value)} style={{ fontSize: 12, padding: "6px 9px" }} /></td>
                <td style={{ padding: "9px 12px" }}>
                  <button onClick={() => onToggle(s.id)} style={{ width: 40, height: 22, borderRadius: 100, border: "none", cursor: "pointer", background: s.active ? "#10B981" : "#E2E8F0", position: "relative" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: s.active ? 21 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                  </button>
                </td>
                {isClientLevel && (
                  <td style={{ padding: "9px 12px" }}>
                    {isPrimary ? (
                      <span style={{
                        fontSize: 10, fontWeight: 700, background: "#FFF5F0", color: "#E8520A",
                        border: "1px solid #FDBA74", padding: "3px 10px", borderRadius: 100, whiteSpace: "nowrap"
                      }}>
                        &#9733; Primary
                      </span>
                    ) : (
                      <button onClick={() => onSetPrimary && onSetPrimary(s.id)} style={{
                        fontSize: 10, fontWeight: 600, background: "#F8FAFC", color: "#64748B",
                        border: "1.5px dashed #CBD5E1", padding: "3px 10px", borderRadius: 100,
                        cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s"
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#E8520A"; e.currentTarget.style.color = "#E8520A"; e.currentTarget.style.background = "#FFF5F0"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.color = "#64748B"; e.currentTarget.style.background = "#F8FAFC"; }}>
                        Set Primary
                      </button>
                    )}
                  </td>
                )}
                <td style={{ padding: "9px 12px" }}><button className="btn-danger" onClick={() => onDelete(s.id)}>Remove</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const AddClientModal = ({ onAdd, onClose, visible }) => {
  const [tab, setTab] = useState(0);
  const TABS = ["Company Info", "Communication", "Contacts", "Setup"];
  const TAB_COLORS = ["#E8520A", "#3B82F6", "#8B5CF6", "#10B981"];

  const [f, setF] = useState({
    code: "CL00" + Math.floor(Math.random() * 90 + 10),
    status: "onboarding", name: "", legalName: "", industry: "Healthcare",
    companyType: "Private Limited", regNumber: "", domain: "", website: "",
    linkedin: "", founded: "", empRange: "", revenueRange: "",
    landline: "", landlineExtn: "", landline2: "", landline2Extn: "",
    fax: "", fax2: "",
    receptionEmail: "", financeEmail: "", hrEmail: "", supportEmail: "",
    addr1: "", addr2: "", city: "", state: "", pin: "", country: "India",
    billingSame: true,
    bAddr1: "", bAddr2: "", bCity: "", bState: "", bPin: "", bCountry: "India",
    pcName: "", pcDesig: "", pcDept: "", pcEmail: "", pcPhone: "", pcMobile: "",
    firstDept: ""
  });
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));

  const [extraContacts, setExtraContacts] = useState([]);
  const addContact = () => setExtraContacts(p => [...p, { id: uid(), name: "", designation: "", department: "", email: "", phone: "", mobile: "", type: "Operations" }]);
  const updContact = (id, fld, v) => setExtraContacts(p => p.map(c => c.id === id ? { ...c, [fld]: v } : c));
  const remContact = id => setExtraContacts(p => p.filter(c => c.id !== id));

  const valid = f.name.trim() && f.domain.trim() && f.pcName.trim() && f.pcEmail.trim();

  const submit = () => {
    if (!valid) return;
    const newClient = {
      id: "CL" + uid(),
      code: f.code,
      name: f.name, legalName: f.legalName, industry: f.industry,
      companyType: f.companyType, regNumber: f.regNumber,
      domain: f.domain, domains: f.domain ? [{ id: "tmp_1", domain: f.domain }] : [], status: f.status,
      website: f.website, linkedin: f.linkedin,
      founded: f.founded, empRange: f.empRange, revenueRange: f.revenueRange,
      communication: {
        landline: f.landline, landlineExtn: f.landlineExtn,
        landline2: f.landline2, landline2Extn: f.landline2Extn,
        fax: f.fax, fax2: f.fax2,
        receptionEmail: f.receptionEmail, financeEmail: f.financeEmail,
        hrEmail: f.hrEmail, supportEmail: f.supportEmail,
      },
      address: { line1: f.addr1, line2: f.addr2, city: f.city, state: f.state, pin: f.pin, country: f.country },
      billingAddress: f.billingSame
        ? { line1: f.addr1, line2: f.addr2, city: f.city, state: f.state, pin: f.pin, country: f.country }
        : { line1: f.bAddr1, line2: f.bAddr2, city: f.bCity, state: f.bState, pin: f.bPin, country: f.bCountry },
      primaryContact: { name: f.pcName, designation: f.pcDesig, department: f.pcDept, email: f.pcEmail, phone: f.pcPhone, mobile: f.pcMobile },
      additionalContacts: extraContacts,
      departments: f.firstDept ? [{ id: "D" + uid(), name: f.firstDept }] : [],
      stakeholders: []
    };
    onAdd(newClient);
  };

  const secStyle = (color) => ({ background: "#FAFBFF", border: `1.5px solid ${color}22`, borderRadius: 10, padding: "18px 20px", marginBottom: 0 });
  const secHead = (color, label) => (
    <div style={{ fontSize: 11, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 3, height: 14, background: color, borderRadius: 2 }} />{label}
    </div>
  );
  const G2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
  const G3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };

  if (!visible) return null;
  return (
    <div className="modal-overlay" style={{ left: 236 }}>
      <div className="modal" style={{ maxWidth: 680, width: "min(680px, calc(100% - 32px))" }}>

        {/* Header */}
        <div style={{ padding: "22px 28px 0", background: "linear-gradient(135deg,#0D1B2A,#1E3A5F)", borderRadius: "18px 18px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>Add New Client</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>Complete client profile — all sections optional except name, domain and primary contact</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>&#215;</button>
          </div>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0 }}>
            {TABS.map((t, i) => (
              <button key={i} onClick={() => setTab(i)} style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: tab === i ? "#fff" : "transparent",
                color: tab === i ? TAB_COLORS[i] : "#94A3B8",
                borderRadius: tab === i ? "8px 8px 0 0" : 0,
                transition: "all .2s"
              }}>
                <span style={{ marginRight: 6 }}>{["🏢", "📞", "👥", "⚙️"][i]}</span>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", maxHeight: "60vh" }}>

          {/* ── TAB 0: Company Info ── */}
          {tab === 0 && (
            <>
              <div style={secStyle("#E8520A")}>
                {secHead("#E8520A", "Client Identity")}
                <div style={G2}>
                  <FieldRow label="Client Code"><input className="inp" value={f.code} onChange={e => upd("code", e.target.value)} placeholder="e.g. CL005" /></FieldRow>
                  <FieldRow label="Onboarding Status">
                    <select className="inp" value={f.status} onChange={e => upd("status", e.target.value)}>
                      <option value="onboarding">Onboarding</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </FieldRow>
                </div>
                <div style={{ marginTop: 12 }}>
                  <FieldRow label="Trading / Brand Name *"><input className="inp" value={f.name} onChange={e => upd("name", e.target.value)} placeholder="e.g. Infosys BPM" /></FieldRow>
                </div>
                <div style={{ marginTop: 12 }}>
                  <FieldRow label="Registered Legal Name"><input className="inp" value={f.legalName} onChange={e => upd("legalName", e.target.value)} placeholder="e.g. Infosys BPM Limited" /></FieldRow>
                </div>
                <div style={{ ...G3, marginTop: 12 }}>
                  <FieldRow label="Industry">
                    <select className="inp" value={f.industry} onChange={e => upd("industry", e.target.value)}>
                      {["Healthcare", "Telecom", "Banking", "Automobile", "IT Services", "Finance", "Insurance", "Retail", "Manufacturing", "Pharma", "Education", "Other"].map(i => <option key={i}>{i}</option>)}
                    </select>
                  </FieldRow>
                  <FieldRow label="Company Type">
                    <select className="inp" value={f.companyType} onChange={e => upd("companyType", e.target.value)}>
                      {["Private Limited", "Public Limited", "LLP", "Partnership", "Sole Proprietorship", "Government", "NGO", "Other"].map(i => <option key={i}>{i}</option>)}
                    </select>
                  </FieldRow>
                  <FieldRow label="Registration No."><input className="inp" value={f.regNumber} onChange={e => upd("regNumber", e.target.value)} placeholder="e.g. U72200MH2006" /></FieldRow>
                </div>
                <div style={{ ...G2, marginTop: 12 }}>
                  <FieldRow label="Primary Domain *"><input className="inp" value={f.domain} onChange={e => upd("domain", e.target.value)} placeholder="e.g. infosys.com" /></FieldRow>
                  <FieldRow label="Website"><input className="inp" value={f.website} onChange={e => upd("website", e.target.value)} placeholder="https://www.infosys.com" /></FieldRow>
                </div>
                <div style={{ ...G3, marginTop: 12 }}>
                  <FieldRow label="LinkedIn URL"><input className="inp" value={f.linkedin} onChange={e => upd("linkedin", e.target.value)} placeholder="linkedin.com/company/..." /></FieldRow>
                  <FieldRow label="Founded Year"><input className="inp" type="number" value={f.founded} onChange={e => upd("founded", e.target.value)} placeholder="e.g. 1998" onKeyDown={(e) => { if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault(); }} /></FieldRow>
                  <FieldRow label="Employee Strength">
                    <select className="inp" value={f.empRange} onChange={e => upd("empRange", e.target.value)}>
                      <option value="">Select range</option>
                      {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000-5000", "5000+"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </FieldRow>
                </div>
                <div style={{ marginTop: 12 }}>
                  <FieldRow label="Annual Revenue Range (USD)">
                    <select className="inp" value={f.revenueRange} onChange={e => upd("revenueRange", e.target.value)}>
                      <option value="">Select range</option>
                      {["Under $1M", "$1M–$10M", "$10M–$50M", "$50M–$200M", "$200M–$1B", "Above $1B"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </FieldRow>
                </div>
              </div>
            </>
          )}

          {/* ── TAB 1: Communication ── */}
          {tab === 1 && (
            <>
              <div style={secStyle("#3B82F6")}>
                {secHead("#3B82F6", "Telephone & Fax")}
                <div style={G3}>
                  <FieldRow label="Landline 1"><input className="inp" value={f.landline} onChange={e => upd("landline", e.target.value)} placeholder="+91 44 2222 0000" /></FieldRow>
                  <FieldRow label="Extn. (Landline 1)"><input className="inp" value={f.landlineExtn} onChange={e => upd("landlineExtn", e.target.value)} placeholder="e.g. 101" /></FieldRow>
                  <FieldRow label="Fax 1"><input className="inp" value={f.fax} onChange={e => upd("fax", e.target.value)} placeholder="+91 44 2222 0001" /></FieldRow>
                </div>
                <div style={{ ...G3, marginTop: 12 }}>
                  <FieldRow label="Landline 2"><input className="inp" value={f.landline2} onChange={e => upd("landline2", e.target.value)} placeholder="+91 44 3333 0000" /></FieldRow>
                  <FieldRow label="Extn. (Landline 2)"><input className="inp" value={f.landline2Extn} onChange={e => upd("landline2Extn", e.target.value)} placeholder="e.g. 202" /></FieldRow>
                  <FieldRow label="Fax 2"><input className="inp" value={f.fax2} onChange={e => upd("fax2", e.target.value)} placeholder="+91 44 3333 0001" /></FieldRow>
                </div>
              </div>

              <div style={secStyle("#6366F1")}>
                {secHead("#6366F1", "Common / Shared Email IDs")}
                <div style={G2}>
                  <FieldRow label="Reception / General"><input className="inp" value={f.receptionEmail} onChange={e => upd("receptionEmail", e.target.value)} placeholder="info@client.com" /></FieldRow>
                  <FieldRow label="Finance / Accounts"><input className="inp" value={f.financeEmail} onChange={e => upd("financeEmail", e.target.value)} placeholder="accounts@client.com" /></FieldRow>
                </div>
                <div style={{ ...G2, marginTop: 12 }}>
                  <FieldRow label="HR / People"><input className="inp" value={f.hrEmail} onChange={e => upd("hrEmail", e.target.value)} placeholder="hr@client.com" /></FieldRow>
                  <FieldRow label="Support / Helpdesk"><input className="inp" value={f.supportEmail} onChange={e => upd("supportEmail", e.target.value)} placeholder="support@client.com" /></FieldRow>
                </div>
              </div>

              <div style={secStyle("#F59E0B")}>
                {secHead("#F59E0B", "Registered Office Address")}
                <div style={{ marginBottom: 12 }}>
                  <FieldRow label="Address Line 1"><input className="inp" value={f.addr1} onChange={e => upd("addr1", e.target.value)} placeholder="Building name, floor, street" /></FieldRow>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <FieldRow label="Address Line 2"><input className="inp" value={f.addr2} onChange={e => upd("addr2", e.target.value)} placeholder="Area, landmark" /></FieldRow>
                </div>
                <div style={G3}>
                  <FieldRow label="City"><input className="inp" value={f.city} onChange={e => upd("city", e.target.value)} placeholder="e.g. Chennai" /></FieldRow>
                  <FieldRow label="State"><input className="inp" value={f.state} onChange={e => upd("state", e.target.value)} placeholder="e.g. Tamil Nadu" /></FieldRow>
                  <FieldRow label="PIN / ZIP"><input className="inp" value={f.pin} onChange={e => upd("pin", e.target.value)} placeholder="600001" /></FieldRow>
                </div>
                <div style={{ marginTop: 12 }}>
                  <FieldRow label="Country">
                    <select className="inp" value={f.country} onChange={e => upd("country", e.target.value)}>
                      {["India", "USA", "UK", "Australia", "Singapore", "UAE", "Canada", "Germany", "Other"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </FieldRow>
                </div>
              </div>

              <div style={secStyle("#10B981")}>
                {secHead("#10B981", "Billing Address")}
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", fontWeight: 500, cursor: "pointer", marginBottom: 14 }}>
                  <input type="checkbox" checked={f.billingSame} onChange={e => upd("billingSame", e.target.checked)} style={{ width: "auto", accentColor: "#E8520A" }} />
                  Same as Registered Office Address
                </label>
                {!f.billingSame && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <FieldRow label="Address Line 1"><input className="inp" value={f.bAddr1} onChange={e => upd("bAddr1", e.target.value)} placeholder="Building name, floor, street" /></FieldRow>
                    <FieldRow label="Address Line 2"><input className="inp" value={f.bAddr2} onChange={e => upd("bAddr2", e.target.value)} placeholder="Area, landmark" /></FieldRow>
                    <div style={G3}>
                      <FieldRow label="City"><input className="inp" value={f.bCity} onChange={e => upd("bCity", e.target.value)} placeholder="City" /></FieldRow>
                      <FieldRow label="State"><input className="inp" value={f.bState} onChange={e => upd("bState", e.target.value)} placeholder="State" /></FieldRow>
                      <FieldRow label="PIN / ZIP"><input className="inp" value={f.bPin} onChange={e => upd("bPin", e.target.value)} placeholder="PIN" /></FieldRow>
                    </div>
                    <FieldRow label="Country">
                      <select className="inp" value={f.bCountry} onChange={e => upd("bCountry", e.target.value)}>
                        {["India", "USA", "UK", "Australia", "Singapore", "UAE", "Canada", "Germany", "Other"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </FieldRow>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── TAB 2: Contacts ── */}
          {tab === 2 && (
            <>
              <div style={secStyle("#3B82F6")}>
                {secHead("#3B82F6", "Primary Contact *")}
                <div style={G2}>
                  <FieldRow label="Full Name *"><input className="inp" value={f.pcName} onChange={e => upd("pcName", e.target.value)} placeholder="e.g. Sanjay Mehta" /></FieldRow>
                  <FieldRow label="Designation"><input className="inp" value={f.pcDesig} onChange={e => upd("pcDesig", e.target.value)} placeholder="e.g. VP Operations" /></FieldRow>
                </div>
                <div style={{ marginTop: 12 }}>
                  <FieldRow label="Department"><input className="inp" value={f.pcDept} onChange={e => upd("pcDept", e.target.value)} placeholder="e.g. Operations" /></FieldRow>
                </div>
                <div style={{ ...G3, marginTop: 12 }}>
                  <FieldRow label="Work Email *"><input className="inp" value={f.pcEmail} onChange={e => upd("pcEmail", e.target.value)} placeholder="sanjay@client.com" /></FieldRow>
                  <FieldRow label="Direct Phone"><input className="inp" value={f.pcPhone} onChange={e => upd("pcPhone", e.target.value)} placeholder="+91 44 2222 0101" /></FieldRow>
                  <FieldRow label="Mobile"><input className="inp" value={f.pcMobile} onChange={e => upd("pcMobile", e.target.value)} placeholder="+91 98765 00000" /></FieldRow>
                </div>
              </div>

              <div style={secStyle("#8B5CF6")}>
                {secHead("#8B5CF6", "Additional Contacts")}
                {extraContacts.length === 0 && (
                  <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic", marginBottom: 12 }}>No additional contacts yet. Add Finance, Legal, Operations, Technical or other POCs.</div>
                )}
                {extraContacts.map((c, idx) => (
                  <div key={c.id} style={{ background: "#fff", border: "1.5px solid #EDE9FE", borderLeft: "4px solid #8B5CF6", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#6D28D9" }}>Contact #{idx + 1}</div>
                      <button className="btn-danger" onClick={() => remContact(c.id)} style={{ padding: "3px 8px", fontSize: 11 }}>Remove</button>
                    </div>
                    <div style={G2}>
                      <FieldRow label="Full Name"><input className="inp" value={c.name} onChange={e => updContact(c.id, "name", e.target.value)} placeholder="Full name" /></FieldRow>
                      <FieldRow label="Type / Function">
                        <select className="inp" value={c.type} onChange={e => updContact(c.id, "type", e.target.value)}>
                          {["Operations", "Finance / Accounts", "Legal / Compliance", "HR / Talent", "IT / Technical", "Procurement", "Executive", "Other"].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </FieldRow>
                    </div>
                    <div style={{ ...G2, marginTop: 10 }}>
                      <FieldRow label="Designation"><input className="inp" value={c.designation} onChange={e => updContact(c.id, "designation", e.target.value)} placeholder="e.g. Finance Manager" /></FieldRow>
                      <FieldRow label="Department"><input className="inp" value={c.department} onChange={e => updContact(c.id, "department", e.target.value)} placeholder="e.g. Finance" /></FieldRow>
                    </div>
                    <div style={{ ...G3, marginTop: 10 }}>
                      <FieldRow label="Email"><input className="inp" value={c.email} onChange={e => updContact(c.id, "email", e.target.value)} placeholder="email@client.com" /></FieldRow>
                      <FieldRow label="Direct Phone"><input className="inp" value={c.phone} onChange={e => updContact(c.id, "phone", e.target.value)} placeholder="+91 44 xxxx xxxx" /></FieldRow>
                      <FieldRow label="Mobile"><input className="inp" value={c.mobile} onChange={e => updContact(c.id, "mobile", e.target.value)} placeholder="+91 9xxxx xxxxx" /></FieldRow>
                    </div>
                  </div>
                ))}
                <button className="btn-secondary" style={{ fontSize: 12, width: "100%", justifyContent: "center" }} onClick={addContact}>+ Add Another Contact</button>
              </div>
            </>
          )}

          {/* ── TAB 3: Setup ── */}
          {tab === 3 && (
            <>
              <div style={secStyle("#10B981")}>
                {secHead("#10B981", "Initial Department")}
                <FieldRow label="First Department Name">
                  <input className="inp" value={f.firstDept} onChange={e => upd("firstDept", e.target.value)} placeholder="e.g. Medical Coding" />
                </FieldRow>
                <div style={{ marginTop: 10, fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>More departments, stakeholders, and authorised domains can be added after creation.</div>
              </div>

              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: "#166534", marginBottom: 10 }}>Summary Preview</div>
                {[
                  ["Client Name", f.name || "—"],
                  ["Legal Name", f.legalName || "—"],
                  ["Industry", f.industry],
                  ["Company Type", f.companyType],
                  ["Domain", f.domain || "—"],
                  ["Website", f.website || "—"],
                  ["Primary Contact", f.pcName ? `${f.pcName} (${f.pcEmail || "no email"})` : "—"],
                  ["Phone / Mobile", [f.pcPhone, f.pcMobile].filter(Boolean).join(" · ") || "—"],
                  ["Landline", f.landline ? `${f.landline}${f.landlineExtn ? " extn " + f.landlineExtn : ""}` : "—"],
                  ["City", f.city || "—"],
                  ["Additional Contacts", extraContacts.length > 0 ? extraContacts.length + " added" : "None"],
                  ["Status", f.status],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", gap: 10, fontSize: 12, marginBottom: 5, borderBottom: "1px solid #DCFCE7", paddingBottom: 5 }}>
                    <span style={{ color: "#64748B", width: 150, flexShrink: 0 }}>{l}</span>
                    <span style={{ fontWeight: 600, color: "#1E293B" }}>{v}</span>
                  </div>
                ))}
              </div>

              {!valid && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#991B1B" }}>
                  Please complete required fields before creating: <strong>Client Name</strong>, <strong>Primary Domain</strong>, <strong>Primary Contact Name</strong> and <strong>Email</strong> (in Company Info and Contacts tabs).
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10, alignItems: "center", background: "#FAFBFF", borderRadius: "0 0 18px 18px" }}>
          {tab > 0 && <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setTab(t => t - 1)}>&#8592; Back</button>}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 5 }}>
              {TABS.map((_, i) => (
                <div key={i} style={{ height: 4, flex: 1, borderRadius: 100, background: i <= tab ? TAB_COLORS[tab] : "#E2E8F0", transition: "background .3s" }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Step {tab + 1} of {TABS.length} — {TABS[tab]}</div>
          </div>
          {tab < TABS.length - 1
            ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setTab(t => t + 1)}>Next &#8594;</button>
            : <button className="btn-primary" style={{ fontSize: 14, padding: "10px 24px" }} disabled={!valid} onClick={submit}>Create Client</button>
          }
        </div>
      </div>
    </div>
  );
};

const ClientConfig = ({ clients, setClients, employees, allReviews, topBarProps }) => {
  const [selId, setSelId] = useState(() => {
    const saved = localStorage.getItem("epr_selected_client");
    if (saved && clients.find(c => c.id === saved)) return saved;
    return clients[0]?.id || "";
  });
  const setSelIdPersist = (id) => { setSelId(id); localStorage.setItem("epr_selected_client", id); };
  const [editMode, setEditMode] = useState(false);
  const [pcEditMode, setPcEditMode] = useState(false);
  const [toast, setToast] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newDept, setNewDept] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [confirmDelDept, setConfirmDelDept] = useState(null); // { id, name }
  const [confirmDelDomain, setConfirmDelDomain] = useState(null); // { id, domain }
  const [newSHIds, setNewSHIds] = useState(new Set());
  const [toastType, setToastType] = useState("");
  const showToast = (msg, type = "") => { setToast(msg); setToastType(type); setTimeout(() => { setToast(""); setToastType(""); }, 2400); };

  // Reset edit modes when switching client
  useEffect(() => { setEditMode(false); setPcEditMode(false); }, [selId]); // eslint-disable-line

  // Fetch full client details (stakeholders, departments, domains) when selId changes
  useEffect(() => {
    if (!selId) return;
    apiFetch(`/api/clients/${selId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setClients(cs => cs.map(c => c.id === selId ? {
            ...c,
            domain: d.data.primary_domain || c.domain || "",
            stakeholders: (d.data.stakeholders || []).map(s => ({ ...s, deptId: s.dept_id ?? s.deptId ?? null, active: Boolean(s.active) })),
            departments: d.data.departments || [],
            domains: (d.data.domains || []).map(x => typeof x === "string" ? { id: x, domain: x } : x),
            primaryStakeholderId: d.data.primary_stakeholder_id ?? c.primaryStakeholderId,
            primaryContact: { name: d.data.pc_name || "", email: d.data.pc_email || "", phone: d.data.pc_phone || "" },
          } : c));
        }
      })
      .catch(() => { });
    setNewSHIds(new Set()); // clear pending new stakeholders on client switch
  }, [selId]); // eslint-disable-line

  // Sync selId when clients list first loads
  useEffect(() => {
    if (clients.length > 0 && !clients.find(c => c.id === selId)) {
      setSelIdPersist(clients[0].id);
    }
  }, [clients]); // eslint-disable-line

  const client = clients.find(c => c.id === selId) || clients[0] || null;
  const activeDeptIds = new Set((client?.departments || []).map(d => d.id));
  // Orphaned dept stakeholders (dept deleted) fall back to client-level display
  const clientSH = (client?.stakeholders || []).filter(s => s.level === "client" || (s.level === "dept" && !activeDeptIds.has(s.deptId)));
  const deptSH = did => (client?.stakeholders || []).filter(s => s.level === "dept" && s.deptId === did);
  const empCount = cid => employees.filter(e => (e.allocations || []).some(a => a.clientId === cid)).length;
  const activeEmails = (allReviews || [])
    .filter(r => (r.client || "").includes((client?.name || "").split(" ")[0]) && ["Email Sent", "In Progress", "Submitted"].includes(r.status))
    .map(r => r.stakeholderEmail || r.stakeholder_email || "");

  // ── Stakeholders ─────────────────────────────────────────────────────────────
  const addSH = (level, deptId = null) => {
    const tempId = "new_" + uid();
    setNewSHIds(s => new Set([...s, tempId]));
    setClients(cs => cs.map(c => c.id === selId
      ? { ...c, stakeholders: [...(c.stakeholders || []), { id: tempId, name: "", email: "", designation: "", level, deptId, active: true }] }
      : c));
  };
  const updateSH = (sid, fld, v) => setClients(cs => cs.map(c => c.id === selId
    ? { ...c, stakeholders: (c.stakeholders || []).map(s => s.id === sid ? { ...s, [fld]: v } : s) }
    : c));
  const deleteSH = async (sid) => {
    setClients(cs => cs.map(c => c.id === selId
      ? { ...c, stakeholders: (c.stakeholders || []).filter(s => s.id !== sid) }
      : c));
    setNewSHIds(prev => { const n = new Set(prev); n.delete(sid); return n; });
    if (!newSHIds.has(sid)) {
      try { await apiFetch(`/api/clients/${selId}/stakeholders/${sid}`, { method: "DELETE" }); } catch (e) { }
    }
  };
  const toggleSH = sid => setClients(cs => cs.map(c => c.id === selId
    ? { ...c, stakeholders: (c.stakeholders || []).map(s => s.id === sid ? { ...s, active: !s.active } : s) }
    : c));
  const setPrimary = async (sid) => {
    setClients(cs => cs.map(c => c.id === selId ? { ...c, primaryStakeholderId: sid } : c));
    try { await apiFetch(`/api/clients/${selId}/primary-stakeholder`, { method: "PUT", body: JSON.stringify({ stakeholder_id: sid }) }); } catch (e) { }
  };
  const saveStakeholders = async () => {
    const shs = client.stakeholders || [];
    if (!shs.length) { showToast("No stakeholders to save"); return; }
    let failed = 0;
    await Promise.all(shs.map(async s => {
      try {
        if (newSHIds.has(s.id)) {
          if (!s.name.trim() || !s.email.trim()) return; // skip blank rows
          const res = await apiFetch(`/api/clients/${selId}/stakeholders`, {
            method: "POST",
            body: JSON.stringify({ name: s.name, email: s.email, designation: s.designation || "", level: s.level, dept_id: s.deptId || null }),
          });
          const d = await res.json();
          if (d.success) {
            const realId = String(d.id);
            setClients(cs => cs.map(c => c.id === selId
              ? { ...c, stakeholders: (c.stakeholders || []).map(sh => sh.id === s.id ? { ...sh, id: realId } : sh) }
              : c));
            setNewSHIds(prev => { const n = new Set(prev); n.delete(s.id); return n; });
          } else { failed++; }
        } else {
          const res = await apiFetch(`/api/clients/${selId}/stakeholders/${s.id}`, {
            method: "PUT",
            body: JSON.stringify({ name: s.name, email: s.email, designation: s.designation || "", level: s.level, dept_id: s.deptId || null, active: s.active ? 1 : 0 }),
          });
          const d = await res.json();
          if (!d.success) failed++;
        }
      } catch (e) { failed++; }
    }));
    showToast(failed ? `${failed} stakeholder(s) failed to save` : "Stakeholders saved", failed ? "error" : "");
  };

  // ── Client fields ─────────────────────────────────────────────────────────────
  const updateStat = v => setClients(cs => cs.map(c => c.id === selId ? { ...c, status: v } : c));
  const updatePC = (fld, v) => setClients(cs => cs.map(c => c.id === selId ? { ...c, primaryContact: { ...(c.primaryContact || {}), [fld]: v } } : c));
  const updateField = (fld, v) => setClients(cs => cs.map(c => c.id === selId ? { ...c, [fld]: v } : c));

  const saveClient = async () => {
    try {
      const res = await apiFetch(`/api/clients/${selId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: client.name,
          industry: client.industry || "",
          status: client.status || "active",
          primary_domain: client.domain || "",
          pc_name: client.primaryContact?.name || "",
          pc_email: client.primaryContact?.email || "",
          pc_phone: client.primaryContact?.phone || "",
          notes: client.notes || "",
        }),
      });
      const d = await res.json();
      if (d.success) { setEditMode(false); showToast("Client saved"); }
      else showToast("Error: " + (d.message || "Save failed"));
    } catch (e) { showToast("Network error — could not save client", "error"); }
  };

  // ── Domains ───────────────────────────────────────────────────────────────────
  const addDomain = async () => {
    if (!newDomain.trim()) return;
    const val = newDomain.trim();
    setNewDomain("");
    try {
      const res = await apiFetch(`/api/clients/${selId}/domains`, { method: "POST", body: JSON.stringify({ domain: val }) });
      const d = await res.json();
      if (d.success) {
        setClients(cs => cs.map(c => c.id === selId ? { ...c, domains: [...(c.domains || []), { id: d.id, domain: d.domain }] } : c));
        showToast("Domain added");
      } else { showToast("Error: " + (d.message || "Failed to add domain")); }
    } catch (e) { showToast("Network error", "error"); }
  };
  const remDomain = async (domainId) => {
    const found = (client.domains || []).find(d => (d.id || d) === domainId);
    setConfirmDelDomain({ id: domainId, domain: found?.domain || domainId });
  };
  const doRemDomain = async (domainId) => {
    setConfirmDelDomain(null);
    setClients(cs => cs.map(c => c.id === selId ? { ...c, domains: (c.domains || []).filter(x => (x.id || x) !== domainId) } : c));
    try { await apiFetch(`/api/clients/${selId}/domains/${domainId}`, { method: "DELETE" }); } catch (e) { showToast("Failed to remove domain", "error"); }
  };

  // ── Departments ───────────────────────────────────────────────────────────────
  const addDept = async () => {
    if (!newDept.trim()) return;
    const val = newDept.trim();
    setNewDept("");
    try {
      const res = await apiFetch(`/api/clients/${selId}/departments`, { method: "POST", body: JSON.stringify({ name: val }) });
      const d = await res.json();
      if (d.success) {
        setClients(cs => cs.map(c => c.id === selId ? { ...c, departments: [...(c.departments || []), { id: d.id, name: d.name }] } : c));
        showToast("Department added");
      } else { showToast("Error: " + (d.message || "Failed to add department")); }
    } catch (e) { showToast("Network error", "error"); }
  };
  const remDept = async (deptId) => {
    setClients(cs => cs.map(c => c.id === selId ? { ...c, departments: (c.departments || []).filter(d => d.id !== deptId) } : c));
    try { await apiFetch(`/api/clients/${selId}/departments/${deptId}`, { method: "DELETE" }); } catch (e) { showToast("Failed to remove department", "error"); }
  };
  const deleteClient = async () => {
    const deletedName = client.name;
    setConfirmDel(false);
    try {
      const res = await apiFetch(`/api/clients/${selId}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        const rem = clients.filter(c => c.id !== selId);
        setClients(rem);
        setSelIdPersist(rem[0] ? rem[0].id : "");
        showToast(`"${deletedName}" removed successfully`);
      } else {
        showToast("Cannot delete: " + (d.message || "Server error"), "error");
      }
    } catch (e) {
      showToast("Network error — client not deleted", "error");
    }
  };
  const addClient = async (nc) => {
    try {
      const res = await apiFetch("/api/clients", {
        method: "POST",
        body: JSON.stringify({
          code: nc.code,
          name: nc.name,
          industry: nc.industry || "",
          status: nc.status || "onboarding",
          color_hex: nc.color || "#E8520A",
          pc_name: nc.primaryContact?.name || "",
          pc_email: nc.primaryContact?.email || "",
          pc_phone: nc.primaryContact?.phone || nc.primaryContact?.mobile || "",
          notes: nc.notes || "",
        }),
      });
      const d = await res.json();
      if (d.success) {
        const clientId = d.data?.id || d.id || nc.code;
        // Save domain to DB
        let savedDomains = [];
        if (nc.domain) {
          try {
            const dr = await apiFetch(`/api/clients/${clientId}/domains`, { method: "POST", body: JSON.stringify({ domain: nc.domain }) });
            const dd = await dr.json();
            if (dd.success) savedDomains = [{ id: dd.id, domain: dd.domain }];
          } catch (e) { }
        }
        // Save first department to DB
        let savedDepts = [];
        if (nc.departments && nc.departments[0]?.name) {
          try {
            const dr = await apiFetch(`/api/clients/${clientId}/departments`, { method: "POST", body: JSON.stringify({ name: nc.departments[0].name }) });
            const dd = await dr.json();
            if (dd.success) savedDepts = [{ id: dd.id, name: dd.name }];
          } catch (e) { }
        }
        const saved = { ...nc, id: clientId, code: nc.code, domains: savedDomains, departments: savedDepts, stakeholders: [] };
        setClients(p => [...p, saved]);
        setSelIdPersist(clientId);
        setShowAdd(false);
        showToast("Client created");
      } else {
        showToast("Error: " + (d.message || "Failed to save client"));
      }
    } catch (e) {
      showToast("Network error — could not save client", "error");
    }
  };

  if (!client) return (
    <div className="fade-in">
      <TopBar title="Client Configuration" subtitle="Manage clients, departments, authorised domains and stakeholder assignments" {...topBarProps} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#94A3B8", fontSize: 14 }}>No clients found.</div>
    </div>
  );

  return (
    <div className="fade-in">
      <TopBar title="Client Configuration" subtitle="Manage clients, departments, authorised domains and stakeholder assignments" {...topBarProps} />
      <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 16, alignItems: "start" }}>

        <div className="card" style={{ padding: "6px 8px" }}>
          <div style={{ padding: "10px 10px 6px", fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Clients</div>
          {clients.map(c => (
            <div key={c.id} onClick={() => setSelIdPersist(c.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 9, cursor: "pointer", marginBottom: 2,
                background: selId === c.id ? "#FFF5F0" : "transparent",
                borderLeft: selId === c.id ? "3px solid #E8520A" : "3px solid transparent", transition: "all .18s"
              }}>
              <Avatar name={c.name} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: selId === c.id ? "#E8520A" : "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name.split(" ")[0]}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1, display: "flex", gap: 6 }}>
                  <span>{(c.stakeholders || []).filter(s => s.active).length} SH</span>
                  <span>·</span>
                  <span style={{ color: empCount(c.id) > 0 ? "#10B981" : "#EF4444", fontWeight: 600 }}>{empCount(c.id)} emp</span>
                </div>
              </div>
              <Badge status={c.status} />
            </div>
          ))}
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8, fontSize: 12, padding: "8px 0" }} onClick={() => setShowAdd(true)}>+ Add Client</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: "22px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <Avatar name={client.name} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 18, color: "#0D1B2A", letterSpacing: -0.3 }}>{client.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                  {editMode ? (
                    <select value={client.status} onChange={e => updateStat(e.target.value)}
                      style={{ width: "auto", padding: "3px 10px", fontSize: 11, fontWeight: 700, borderRadius: 100, border: "1.5px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer" }}>
                      <option value="active">active</option>
                      <option value="onboarding">onboarding</option>
                      <option value="inactive">inactive</option>
                    </select>
                  ) : (
                    <span style={{
                      padding: "3px 10px", fontSize: 11, fontWeight: 700, borderRadius: 100, border: "1.5px solid #E2E8F0", background: "#F8FAFC",
                      color: client.status === "active" ? "#10B981" : client.status === "inactive" ? "#EF4444" : "#F59E0B"
                    }}>
                      {client.status}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{client.code}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6366F1", background: "#EEF2FF", padding: "2px 8px", borderRadius: 6 }}>@{client.domain}</span>
                  <span style={{ fontSize: 11, color: "#10B981", background: "#F0FDF4", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{empCount(client.id)} employees</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-secondary" onClick={() => setEditMode(!editMode)} style={{ fontSize: 12 }}>{editMode ? "Cancel" : "Edit"}</button>
                {editMode && <button className="btn-primary" style={{ fontSize: 12 }} onClick={saveClient}>Save</button>}
                <button className="btn-danger" onClick={() => setConfirmDel(true)} style={{ padding: "7px 12px" }}>Delete</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6 }}>Industry</label>
                {editMode
                  ? <input className="inp" value={client.industry || ""} onChange={e => updateField("industry", e.target.value)} />
                  : <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{client.industry}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6 }}>Primary Domain</label>
                {editMode
                  ? <input className="inp" value={client.domain || ""} onChange={e => updateField("domain", e.target.value)} />
                  : <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{client.domain}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6 }}>Employees</label>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{empCount(client.id)} allocated</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A" }}>Primary Contact</div>
              {pcEditMode ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setPcEditMode(false)}>Cancel</button>
                  <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => { saveClient(); setPcEditMode(false); }}>Save Contact</button>
                </div>
              ) : (
                <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setPcEditMode(true)}>Edit</button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FieldRow label="Full Name">
                {pcEditMode
                  ? <input className="inp" value={client.primaryContact && client.primaryContact.name ? client.primaryContact.name : ""} onChange={e => updatePC("name", e.target.value)} placeholder="Contact name" />
                  : <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{(client.primaryContact && client.primaryContact.name) || "—"}</div>}
              </FieldRow>
              <FieldRow label="Email">
                {pcEditMode
                  ? <input className="inp" value={client.primaryContact && client.primaryContact.email ? client.primaryContact.email : ""} onChange={e => updatePC("email", e.target.value)} placeholder="contact@client.com" />
                  : <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{(client.primaryContact && client.primaryContact.email) || "—"}</div>}
              </FieldRow>
              <FieldRow label="Phone">
                {pcEditMode
                  ? <input className="inp" value={client.primaryContact && client.primaryContact.phone ? client.primaryContact.phone : ""} onChange={e => updatePC("phone", e.target.value)} placeholder="+91 98xxx xxxxx" />
                  : <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{(client.primaryContact && client.primaryContact.phone) || "—"}</div>}
              </FieldRow>
            </div>
          </div>

          <div className="card" style={{ padding: "20px 24px" }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 4 }}>Authorised Email Domains</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 14 }}>Stakeholders must use these domains for OTP authentication</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {(client.domains || []).map(d => (
                <div key={d.id || d} style={{ display: "flex", alignItems: "center", gap: 6, background: "#EEF2FF", border: "1.5px solid #C7D2FE", borderRadius: 8, padding: "6px 12px" }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#4338CA", fontWeight: 600 }}>@{d.domain || d}</span>
                  <button onClick={() => remDomain(d.id || d)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A5B4FC", fontSize: 16 }}>&#215;</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="inp" placeholder="new-domain.com" value={newDomain} onChange={e => setNewDomain(e.target.value)} onKeyDown={e => e.key === "Enter" && addDomain()} style={{ maxWidth: 240 }} />
              <button className="btn-secondary" onClick={addDomain} style={{ fontSize: 12 }}>+ Add Domain</button>
            </div>
          </div>

          <div className="card" style={{ padding: "20px 24px" }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: "#0D1B2A", marginBottom: 4 }}>Departments</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 14 }}>Resources are allocated at department level</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {(client.departments || []).map(d => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "7px 13px" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>{d.name}</span>
                  <button onClick={() => setConfirmDelDept({ id: d.id, name: d.name })} className="btn-ghost" style={{ padding: "0 0 0 4px", color: "#CBD5E1", fontSize: 16 }}>&#215;</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="inp" placeholder="New department name" value={newDept} onChange={e => setNewDept(e.target.value)} onKeyDown={e => e.key === "Enter" && addDept()} style={{ maxWidth: 260 }} />
              <button className="btn-secondary" onClick={addDept} style={{ fontSize: 12 }}>+ Add Dept</button>
            </div>
          </div>

          <div className="card" style={{ padding: "20px 24px" }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, color: "#0D1B2A", marginBottom: 4 }}>Stakeholders</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
              <span style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "2px 8px", borderRadius: 100, fontWeight: 600, fontSize: 11, marginRight: 6 }}>Client-level</span>
              applies to all departments unless overridden by a
              <span style={{ background: "#EDE9FE", color: "#6D28D9", padding: "2px 8px", borderRadius: 100, fontWeight: 600, fontSize: 11, margin: "0 6px" }}>Dept-level</span>
              assignment.
              <span style={{ background: "#D1FAE5", color: "#065F46", padding: "2px 6px", borderRadius: 100, fontWeight: 600, fontSize: 10, marginLeft: 8 }}>Active Review</span>
              = linked to an open review.
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ background: "#DBEAFE", color: "#1D4ED8", padding: "3px 10px", borderRadius: 100, fontWeight: 700, fontSize: 11 }}>Client-Level Default</span>
                <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => addSH("client")}>+ Add</button>
              </div>
              <SHTable rows={clientSH} onUpdate={updateSH} onDelete={deleteSH} onToggle={toggleSH} activeEmails={activeEmails} primaryStakeholderId={client.primaryStakeholderId} onSetPrimary={setPrimary} />
            </div>

            {(client.departments || []).map(dept => (
              <div key={dept.id} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: "#EDE9FE", color: "#6D28D9", padding: "3px 10px", borderRadius: 100, fontWeight: 700, fontSize: 11 }}>Dept Override</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1E293B" }}>{dept.name}</span>
                    {deptSH(dept.id).length === 0 && <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>using client-level default</span>}
                  </div>
                  <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => addSH("dept", dept.id)}>+ Override</button>
                </div>
                {deptSH(dept.id).length > 0 && <SHTable rows={deptSH(dept.id)} onUpdate={updateSH} onDelete={deleteSH} onToggle={toggleSH} activeEmails={activeEmails} />}
              </div>
            ))}

            {(client.stakeholders || []).length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 10, borderTop: "1px solid #F1F5F9", marginTop: 8 }}>
                <button className="btn-primary" style={{ fontSize: 12 }} onClick={saveStakeholders}>Save Stakeholder Changes</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmDel && (() => {
        const deptCount = (client.departments || []).length;
        const shCount = (client.stakeholders || []).length;
        const domainCount = (client.domains || []).length;
        return (
          <div className="modal-overlay" style={{ left: 236 }} onClick={() => setConfirmDel(false)}>
            <div className="modal" style={{ maxWidth: 460, width: "min(460px, calc(100% - 32px))" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "28px 32px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>&#128465;</div>
                  <div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 17, color: "#0D1B2A" }}>Remove {client.name}?</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{client.code} &middot; {client.industry}</div>
                  </div>
                </div>

                {/* What will be affected */}
                <div style={{ background: "#FFF5F0", border: "1.5px solid #FDBA74", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>The following will be deactivated</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { icon: "🏢", label: "Departments", count: deptCount },
                      { icon: "👥", label: "Stakeholders", count: shCount },
                      { icon: "🌐", label: "Domains", count: domainCount },
                    ].map(({ icon, label, count }) => (
                      <div key={label} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", textAlign: "center", border: "1px solid #FED7AA" }}>
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? "#DC2626" : "#94A3B8" }}>{count}</div>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#64748B", marginBottom: 22, lineHeight: 1.6 }}>
                  <strong>Note:</strong> Employee allocations linked to this client must be updated separately. This action can be reversed by an admin from the database.
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>Cancel — Keep Client</button>
                  <button style={{ flex: 1, background: "#DC2626", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }} onClick={deleteClient}>
                    Yes, Remove Client
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmDelDept && (() => {
        const shCount = (client.stakeholders || []).filter(s => s.deptId === confirmDelDept.id).length;
        return (
          <div className="modal-overlay" style={{ left: 236 }} onClick={() => setConfirmDelDept(null)}>
            <div className="modal" style={{ maxWidth: 420, width: "min(420px, calc(100% - 32px))" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "26px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>&#128465;</div>
                  <div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: "#0D1B2A" }}>Remove "{confirmDelDept.name}"?</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Department of {client.name}</div>
                  </div>
                </div>

                <div style={{ background: "#FFF5F0", border: "1.5px solid #FDBA74", borderRadius: 9, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>What will be affected</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1, background: "#fff", borderRadius: 7, padding: "10px", textAlign: "center", border: "1px solid #FED7AA" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: shCount > 0 ? "#DC2626" : "#94A3B8" }}>{shCount}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Dept Stakeholders</div>
                    </div>
                    <div style={{ flex: 1, background: "#fff", borderRadius: 7, padding: "10px", textAlign: "center", border: "1px solid #FED7AA" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#DC2626" }}>1</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Department</div>
                    </div>
                  </div>
                </div>

                {shCount > 0 && (
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#991B1B", marginBottom: 16 }}>
                    <strong>{shCount} stakeholder{shCount > 1 ? "s" : ""}</strong> assigned to this department will also be removed. Employee allocations to this department must be reassigned manually.
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelDept(null)}>Cancel</button>
                  <button style={{ flex: 1, background: "#DC2626", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                    onClick={() => { remDept(confirmDelDept.id); setConfirmDelDept(null); }}>
                    Yes, Remove Department
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmDelDomain && (
        <div className="modal-overlay" style={{ left: 236 }} onClick={() => setConfirmDelDomain(null)}>
          <div className="modal" style={{ maxWidth: 400, width: "min(400px, calc(100% - 32px))" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "26px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>&#127758;</div>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: "#0D1B2A" }}>Remove Domain?</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#4338CA", marginTop: 3, fontWeight: 700 }}>@{confirmDelDomain.domain}</div>
                </div>
              </div>
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "11px 14px", fontSize: 12, color: "#991B1B", marginBottom: 20, lineHeight: 1.6 }}>
                Stakeholders using <strong>@{confirmDelDomain.domain}</strong> will no longer be able to authenticate via OTP for <strong>{client.name}</strong>. This cannot be undone.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelDomain(null)}>Cancel</button>
                <button style={{ flex: 1, background: "#DC2626", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  onClick={() => doRemDomain(confirmDelDomain.id)}>
                  Yes, Remove Domain
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddClientModal onAdd={addClient} onClose={() => setShowAdd(false)} visible={showAdd} />
      {toast && <Toast msg={toast} type={toastType} />}
    </div>
  );
};

export default ClientConfig;
