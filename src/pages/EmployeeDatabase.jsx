import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import FieldRow from "../components/FieldRow";
import Toast from "../components/Toast";
import { EMP_DB_INIT, uid } from "../constants";
import { apiFetch } from "../utils/api";

const AddEmployeeModal = ({ onSave, onClose, existing }) => {
  const isEdit = !!existing;
  const blank = {
    code: "", name: "", dob: "", gender: "", bloodGroup: "", nationality: "Indian",
    aadhaar: "", pan: "", passport: { no: "", expiry: "", country: "" },
    primaryPhone: "", secondaryPhone: "", officialEmail: "", personalEmail: "",
    currentAddr: { line1: "", line2: "", city: "", state: "", pin: "" },
    permanentAddr: { line1: "", line2: "", city: "", state: "", pin: "" },
    emergency: { name: "", relation: "", phone: "", email: "" },
    designation: "", department: "", joinDate: "", status: "Active", reportingManager: "",
    education: [{ degree: "", institution: "", year: "", grade: "", specialization: "" }],
    workHistory: [],
    skills: [], skillInput: "",
    resumeFile: "", notes: "", ctc: ""
  };
  const [tab, setTab] = useState(0);
  const [f, setF] = useState(isEdit ? { ...blank, ...existing, passport: { ...blank.passport, ...(existing.passport || {}) }, emergency: { ...blank.emergency, ...(existing.emergency || {}) }, skills: existing.skills || [], skillInput: "" } : blank);
  const [touched, setTouched] = useState(false);
  const [sameAddr, setSameAddr] = useState(false);
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
  const updNested = (obj, key, v) => setF(p => ({ ...p, [obj]: { ...p[obj], [key]: v } }));

  const TABS = ["Personal & ID", "Contact & Address", "Professional", "Education & History", "Notes & Resume"];
  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const DEPARTMENTS = ["Healthcare", "Engineering", "Analytics", "Finance", "HR", "Operations"];
  const STATUSES = ["Active", "On Leave", "Probation", "Notice Period", "Inactive"];

  // Education handlers
  const addEdu = () => setF(p => ({ ...p, education: [...p.education, { degree: "", institution: "", year: "", grade: "", specialization: "" }] }));
  const updEdu = (i, k, v) => setF(p => ({ ...p, education: p.education.map((e, j) => j === i ? { ...e, [k]: v } : e) }));
  const delEdu = i => setF(p => ({ ...p, education: p.education.filter((_, j) => j !== i) }));

  // Work history handlers
  const addWork = () => setF(p => ({ ...p, workHistory: [...p.workHistory, { company: "", role: "", from: "", to: "", reason: "", ctc: "" }] }));
  const updWork = (i, k, v) => setF(p => ({ ...p, workHistory: p.workHistory.map((w, j) => j === i ? { ...w, [k]: v } : w) }));
  const delWork = i => setF(p => ({ ...p, workHistory: p.workHistory.filter((_, j) => j !== i) }));

  // Skills
  const addSkill = () => { const s = f.skillInput.trim(); if (!s || f.skills.includes(s)) return; setF(p => ({ ...p, skills: [...p.skills, s], skillInput: "" })); };
  const delSkill = s => setF(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  // Copy current to permanent
  const syncAddr = (v) => { setSameAddr(v); if (v) setF(p => ({ ...p, permanentAddr: { ...p.currentAddr } })); };

  const required = f.name && f.code && f.primaryPhone && f.officialEmail && f.designation && f.joinDate;

  const submit = () => {
    setTouched(true);
    if (!required) { setTab(tab > 1 ? 0 : tab); return; }
    const emp = { ...f, id: isEdit ? f.id : "E" + uid(), skillInput: undefined };
    delete emp.skillInput;
    onSave(emp);
  };

  const inp = (v, onChange, ph, type = "text", req = false) => (
    <input className="inp" type={type} value={v} onChange={e => onChange(e.target.value)}
      placeholder={ph} style={{ borderColor: touched && req && !v ? "#EF4444" : "" }} />
  );
  const lbl = (text, req) => (
    <label style={{ fontSize: 11, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
      {text}{req && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
    </label>
  );
  const frow = (label, children, req) => (
    <div style={{ marginBottom: 14 }}>{lbl(label, req)}{children}</div>
  );
  const G2 = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
  const G3 = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>{children}</div>;

  const tabContent = [
    // Tab 0 — Personal & ID
    <div key={0}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Personal Information</div>
      <G2>
        {frow("Full Name", inp(f.name, v => upd("name", v), "Firstname Lastname", "text", true), true)}
        {frow("Employee Code", inp(f.code, v => upd("code", v), "DZIND###", "text", true), true)}
      </G2>
      <G3>
        {frow("Date of Birth", inp(f.dob, v => upd("dob", v), "", "date"))}
        {frow("Gender", <select className="inp" value={f.gender} onChange={e => upd("gender", e.target.value)}>
          <option value="">Select</option>
          {["Male", "Female", "Non-binary", "Prefer not to say"].map(g => <option key={g}>{g}</option>)}
        </select>)}
        {frow("Blood Group", <select className="inp" value={f.bloodGroup} onChange={e => upd("bloodGroup", e.target.value)}>
          <option value="">Select</option>
          {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
        </select>)}
      </G3>
      {frow("Nationality", inp(f.nationality, v => upd("nationality", v), "Indian"))}
      <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0" }} />
      <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Identity Documents</div>
      <G2>
        {frow("Aadhaar Number", inp(f.aadhaar, v => upd("aadhaar", v), "XXXX XXXX XXXX"))}
        {frow("PAN Number", inp(f.pan, v => upd("pan", v), "ABCDE1234F"))}
      </G2>
      <G3>
        {frow("Passport No.", inp(f.passport.no, v => updNested("passport", "no", v), "P#######"))}
        {frow("Passport Expiry", inp(f.passport.expiry, v => updNested("passport", "expiry", v), "", "date"))}
        {frow("Issuing Country", inp(f.passport.country, v => updNested("passport", "country", v), "India"))}
      </G3>
    </div>,

    // Tab 1 — Contact & Address
    <div key={1}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Contact Details</div>
      <G2>
        {frow("Primary Phone", inp(f.primaryPhone, v => upd("primaryPhone", v), "10-digit mobile", "tel", true), true)}
        {frow("Secondary Phone", inp(f.secondaryPhone, v => upd("secondaryPhone", v), "Alternate / landline"))}
      </G2>
      <G2>
        {frow("Official Email", inp(f.officialEmail, v => upd("officialEmail", v), "name@dolluz.com", "email", true), true)}
        {frow("Personal Email", inp(f.personalEmail, v => upd("personalEmail", v), "name@gmail.com", "email"))}
      </G2>
      <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0" }} />
      <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Current Address</div>
      {frow("Street / Flat", inp(f.currentAddr.line1, v => updNested("currentAddr", "line1", v), "House/Flat, Street"))}
      {frow("Landmark / Area", inp(f.currentAddr.line2, v => updNested("currentAddr", "line2", v), "Area, Landmark (optional)"))}
      <G3>
        {frow("City", inp(f.currentAddr.city, v => updNested("currentAddr", "city", v), "City"))}
        {frow("State", inp(f.currentAddr.state, v => updNested("currentAddr", "state", v), "State"))}
        {frow("PIN Code", inp(f.currentAddr.pin, v => updNested("currentAddr", "pin", v), "6-digit PIN"))}
      </G3>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 14px" }}>
        <input type="checkbox" id="sameAddr" checked={sameAddr} onChange={e => syncAddr(e.target.checked)} style={{ width: 16, height: 16 }} />
        <label htmlFor="sameAddr" style={{ fontSize: 12, color: "#475569", cursor: "pointer" }}>Permanent address is same as current address</label>
      </div>
      {!sameAddr && <>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Permanent Address</div>
        {frow("Street / Flat", inp(f.permanentAddr.line1, v => updNested("permanentAddr", "line1", v), "House/Flat, Street"))}
        {frow("Landmark / Area", inp(f.permanentAddr.line2, v => updNested("permanentAddr", "line2", v), "Area, Landmark (optional)"))}
        <G3>
          {frow("City", inp(f.permanentAddr.city, v => updNested("permanentAddr", "city", v), "City"))}
          {frow("State", inp(f.permanentAddr.state, v => updNested("permanentAddr", "state", v), "State"))}
          {frow("PIN Code", inp(f.permanentAddr.pin, v => updNested("permanentAddr", "pin", v), "6-digit PIN"))}
        </G3>
      </>}
      <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0" }} />
      <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Emergency Contact</div>
      <G2>
        {frow("Contact Name", inp(f.emergency.name, v => updNested("emergency", "name", v), "Full name"))}
        {frow("Relationship", inp(f.emergency.relation, v => updNested("emergency", "relation", v), "Spouse, Parent, Sibling…"))}
      </G2>
      <G2>
        {frow("Phone Number", inp(f.emergency.phone, v => updNested("emergency", "phone", v), "Mobile number"))}
        {frow("Email (optional)", inp(f.emergency.email, v => updNested("emergency", "email", v), "email@example.com", "email"))}
      </G2>
    </div>,

    // Tab 2 — Professional
    <div key={2}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Employment Details</div>
      <G2>
        {frow("Designation", inp(f.designation, v => upd("designation", v), "Job title", "text", true), true)}
        {frow("Department", <select className="inp" value={f.department} onChange={e => upd("department", e.target.value)}>
          <option value="">Select department</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>)}
      </G2>
      <G3>
        {frow("Date of Joining", inp(f.joinDate, v => upd("joinDate", v), "", "date", true), true)}
        {frow("Employment Status", <select className="inp" value={f.status} onChange={e => upd("status", e.target.value)}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>)}
        {frow("CTC (USD/month)", inp(String(f.ctc), v => upd("ctc", v), "0.00", "number"))}
      </G3>
      {frow("Reporting Manager", inp(f.reportingManager, v => upd("reportingManager", v), "Manager name"))}
      <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0" }} />
      <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Skills</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input className="inp" value={f.skillInput} onChange={e => upd("skillInput", e.target.value)}
          placeholder="Type a skill and press Add" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
          style={{ flex: 1 }} />
        <button className="btn-secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }} onClick={addSkill}>+ Add Skill</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {f.skills.map(s => (
          <span key={s} style={{
            background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#1E40AF",
            display: "flex", alignItems: "center", gap: 5
          }}>
            {s}
            <span style={{ cursor: "pointer", color: "#6B7280", fontWeight: 700 }} onClick={() => delSkill(s)}>&#215;</span>
          </span>
        ))}
      </div>
    </div>,

    // Tab 3 — Education & Work History
    <div key={3}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", textTransform: "uppercase", letterSpacing: 0.5 }}>Educational Background</div>
        <button className="btn-secondary" style={{ fontSize: 11 }} onClick={addEdu}>+ Add Qualification</button>
      </div>
      {f.education.map((edu, i) => (
        <div key={i} style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", marginBottom: 12, border: "1px solid #F1F5F9", position: "relative" }}>
          <button onClick={() => delEdu(i)} style={{
            position: "absolute", top: 10, right: 10, background: "none", border: "none",
            cursor: "pointer", color: "#EF4444", fontSize: 14, fontWeight: 700
          }}>&#215;</button>
          <G2>
            {frow("Degree / Certificate", inp(edu.degree, v => updEdu(i, "degree", v), "B.Tech, MBA, etc."))}
            {frow("Institution / University", inp(edu.institution, v => updEdu(i, "institution", v), "College or university name"))}
          </G2>
          <G3>
            {frow("Year of Passing", inp(edu.year, v => updEdu(i, "year", v), "YYYY"))}
            {frow("Grade / %", inp(edu.grade, v => updEdu(i, "grade", v), "e.g. 78% or 8.5 CGPA"))}
            {frow("Specialization", inp(edu.specialization, v => updEdu(i, "specialization", v), "Subject / stream"))}
          </G3>
        </div>
      ))}
      <div style={{ borderTop: "1px solid #F1F5F9", margin: "16px 0" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", textTransform: "uppercase", letterSpacing: 0.5 }}>Work History</div>
        <button className="btn-secondary" style={{ fontSize: 11 }} onClick={addWork}>+ Add Employer</button>
      </div>
      {f.workHistory.length === 0 && (
        <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 12, padding: "16px 0" }}>No previous work history added. Click "+ Add Employer" to add.</div>
      )}
      {f.workHistory.map((w, i) => (
        <div key={i} style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", marginBottom: 12, border: "1px solid #F1F5F9", position: "relative" }}>
          <button onClick={() => delWork(i)} style={{
            position: "absolute", top: 10, right: 10, background: "none", border: "none",
            cursor: "pointer", color: "#EF4444", fontSize: 14, fontWeight: 700
          }}>&#215;</button>
          <G2>
            {frow("Company", inp(w.company, v => updWork(i, "company", v), "Employer name"))}
            {frow("Role / Designation", inp(w.role, v => updWork(i, "role", v), "Job title"))}
          </G2>
          <G3>
            {frow("From (YYYY-MM)", inp(w.from, v => updWork(i, "from", v), "2018-06"))}
            {frow("To (YYYY-MM)", inp(w.to, v => updWork(i, "to", v), "2023-01 or Present"))}
            {frow("Last CTC (USD)", inp(w.ctc, v => updWork(i, "ctc", v), "0"))}
          </G3>
          {frow("Reason for Leaving", inp(w.reason, v => updWork(i, "reason", v), "Career growth, relocation, etc."))}
        </div>
      ))}
    </div>,

    // Tab 4 — Notes & Resume
    <div key={4}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Resume</div>
      <div style={{ border: "2px dashed #E2E8F0", borderRadius: 12, padding: "24px", textAlign: "center", background: "#F8FAFC", marginBottom: 20 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
        {f.resumeFile ? (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1B2A", marginBottom: 6 }}>{f.resumeFile}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => upd("resumeFile", "")}>Remove</button>
              <button className="btn-secondary" style={{ fontSize: 12 }}>Replace File</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 10 }}>Drag and drop resume file, or click to browse</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>PDF, DOC, DOCX — max 5MB</div>
            <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => upd("resumeFile", "Resume_Upload_Simulated.pdf")}>Browse File</button>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#E8520A", marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Internal Notes</div>
      <textarea className="inp" rows={5} value={f.notes} onChange={e => upd("notes", e.target.value)}
        placeholder="Internal notes about this employee — performance observations, special arrangements, etc."
        style={{ resize: "vertical", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6 }} />
      <div style={{ marginTop: 16, background: "#FFF5F0", border: "1px solid #FED7AA", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400E" }}>
        Notes are internal only and not visible to the employee or stakeholders.
      </div>
    </div>
  ];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 700, width: "96vw" }}>
        {/* Header */}
        <div style={{
          padding: "22px 28px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "linear-gradient(135deg,#0D1B2A 0%,#1E3A5F 100%)", borderRadius: "14px 14px 0 0"
        }}>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 17, color: "#fff" }}>
              {isEdit ? "Edit Employee" : "Add New Employee"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 }}>
              {isEdit ? f.name + " · " + f.code : "Complete all mandatory fields marked with *"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff",
            padding: "6px 12px", fontSize: 18, cursor: "pointer"
          }}>&#215;</button>
        </div>

        {/* Progress tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", overflowX: "auto" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              flex: 1, minWidth: 120, padding: "12px 10px", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: tab === i ? 700 : 500,
              background: tab === i ? "#FFF5F0" : "#fff",
              color: tab === i ? "#E8520A" : "#64748B",
              borderBottom: tab === i ? "2.5px solid #E8520A" : "2.5px solid transparent",
              whiteSpace: "nowrap"
            }}>
              {i + 1}. {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "22px 28px", maxHeight: "58vh", overflowY: "auto" }}>
          {tabContent[tab]}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 28px 20px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {tab > 0 && <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setTab(t => t - 1)}>&#8592; Previous</button>}
            {tab < TABS.length - 1 && <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => setTab(t => t + 1)}>Next &#8594;</button>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {touched && !required && (
              <span style={{ fontSize: 11, color: "#EF4444" }}>Name, Code, Phone, Email, Designation, Joining Date are required.</span>
            )}
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={submit}>{isEdit ? "Save Changes" : "Create Employee"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Normalize full employee detail from API (DB snake_case → UI camelCase) ───
function normalizeEmployeeDetail(d) {
  return {
    ...d,
    bloodGroup:       d.blood_group       || d.bloodGroup       || "",
    aadhaar:          d.aadhaar_number    || d.aadhaar          || "",
    pan:              d.pan_number        || d.pan              || "",
    officialEmail:    d.official_email    || d.officialEmail    || "",
    personalEmail:    d.personal_email    || d.personalEmail    || "",
    primaryPhone:     d.primary_phone     || d.primaryPhone     || "",
    secondaryPhone:   d.secondary_phone   || d.secondaryPhone   || "",
    joinDate:         d.joining_date
      ? String(d.joining_date).split("T")[0]
      : (d.joinDate || ""),
    notes:            d.internal_notes    || d.notes            || "",
    reportingManager: d.reporting_manager || d.reportingManager || "",
    passport: {
      no:      d.passport_number || (d.passport || {}).no      || "",
      expiry:  d.passport_expiry
        ? String(d.passport_expiry).split("T")[0]
        : ((d.passport || {}).expiry || ""),
      country: (d.passport || {}).country || "",
    },
    emergency: d.ec_name ? {
      name:     d.ec_name     || "",
      relation: d.ec_relation || "",
      phone:    d.ec_phone    || "",
      email:    d.ec_email    || "",
    } : (d.emergency || { name: "", relation: "", phone: "", email: "" }),
    currentAddr:   d.currentAddr   || { line1: "", line2: "", city: "", state: "", pin: "" },
    permanentAddr: d.permanentAddr || { line1: "", line2: "", city: "", state: "", pin: "" },
    skills: Array.isArray(d.skills)
      ? d.skills.map(s => (typeof s === "string" ? s : (s.skill_name || s.name || "")))
      : [],
    education:   Array.isArray(d.education)   ? d.education   : [],
    workHistory: Array.isArray(d.workHistory) ? d.workHistory : [],
  };
}

// ─── Employee Database Component ──────────────────────────────────────────────

const EmployeeDatabase = ({ topBarProps, empList: empListProp, setEmpList: setEmpListProp, openAddModal, onAddModalClosed, onNewEmployee }) => {
  const [empList, setEmpListLocal] = useState(empListProp || EMP_DB_INIT);

  // Sync when parent loads real API data
  useEffect(() => {
    if (empListProp && empListProp.length > 0) setEmpListLocal(empListProp);
  }, [empListProp]);
  const [search, setSearch] = useState("");
  const [statusFilt, setStatusFilt] = useState("All");
  const [deptFilt, setDeptFilt] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [viewEmp, setViewEmp] = useState(null);
  const [viewTab, setViewTab] = useState(0);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  // Sync helper — keeps local + lifted state in step
  const setEmpList = updater => {
    setEmpListLocal(updater);
    if (setEmpListProp) setEmpListProp(updater);
  };

  // When AllocationPage's "+ New Employee" button navigates here, auto-open modal
  useEffect(() => {
    if (openAddModal) {
      setShowAdd(true);
      if (onAddModalClosed) onAddModalClosed();
    }
  }, [openAddModal]);

  const depts = ["All", ...new Set(empList.map(e => e.department))];
  const statuses = ["All", "Active", "On Leave", "Probation", "Notice Period", "Inactive"];

  const filtered = empList
    .filter(e => statusFilt === "All" || e.status === statusFilt)
    .filter(e => deptFilt === "All" || e.department === deptFilt)
    .filter(e => !search || (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.designation || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.officialEmail || "").toLowerCase().includes(search.toLowerCase()));

  const saveEmp = async emp => {
    const isNew = !empList.find(e => e.id === emp.id);
    if (!isNew) {
      setEmpList(p => p.map(e => e.id === emp.id ? emp : e));
      showToast(emp.name + " updated successfully");
      try { await apiFetch(`/api/employees/${emp.id}`, { method: "PUT", body: JSON.stringify(emp) }); } catch (e) {}
    } else {
      setEmpList(p => [...p, emp]);
      // Bridge new employee to AllocationPage state as unallocated resource
      if (onNewEmployee) onNewEmployee(emp);
      showToast(emp.name + " added — visible in Allocation & Leakage as Unallocated");
      try { await apiFetch("/api/employees", { method: "POST", body: JSON.stringify(emp) }); } catch (e) {}
    }
    setShowAdd(false); setEditEmp(null);
  };
  const deleteEmp = async id => {
    const e = empList.find(x => x.id === id);
    setEmpList(p => p.filter(x => x.id !== id));
    setConfirmDel(null);
    setViewEmp(null);
    showToast((e ? e.name : "Employee") + " removed from database");
    try { await apiFetch(`/api/employees/${id}`, { method: "DELETE" }); } catch (e) {}
  };

  const statColor = s => ({ Active: "#10B981", "On Leave": "#F59E0B", Probation: "#3B82F6", "Notice Period": "#EF4444", Inactive: "#94A3B8" }[s] || "#94A3B8");
  const statBg = s => ({ Active: "#F0FDF4", "On Leave": "#FFFBEB", Probation: "#EFF6FF", "Notice Period": "#FEF2F2", Inactive: "#F8FAFC" }[s] || "#F8FAFC");

  const VIEW_TABS = ["Overview", "Contact & Address", "Professional", "Education & History", "Documents"];

  // Template download simulation
  const downloadTemplate = () => showToast("Employee Import Template.xlsx — download would begin in production (headers: Code, Name, DOB, Gender, Blood Group, Phone, Email, Designation, Department, Join Date)");

  const bloodStats = () => {
    const bg = {};
    empList.forEach(e => { if (e.bloodGroup) bg[e.bloodGroup] = (bg[e.bloodGroup] || 0) + 1; });
    return bg;
  };

  return (
    <div className="fade-in">
      <TopBar title="Employee Database" subtitle="Full HR records — add, edit, export and manage all employees" {...topBarProps} />

      {/* ── Stats bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Total Employees", value: empList.length, color: "#0D1B2A", bg: "#F8FAFC" },
          { label: "Active", value: empList.filter(e => e.status === "Active").length, color: "#10B981", bg: "#F0FDF4" },
          { label: "Departments", value: new Set(empList.map(e => e.department)).size, color: "#3B82F6", bg: "#EFF6FF" },
          { label: "With Resume", value: empList.filter(e => e.resumeFile).length, color: "#8B5CF6", bg: "#F5F3FF" },
          { label: "Unallocated", value: empList.filter(e => !e.allocations || e.allocations.length === 0).length, color: "#EF4444", bg: "#FEF2F2" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "12px 16px", border: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="card" style={{ padding: "14px 20px", marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, code, email, designation..." style={{ maxWidth: 280, flex: 1 }} />
        <select className="inp" value={deptFilt} onChange={e => setDeptFilt(e.target.value)} style={{ maxWidth: 160 }}>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="inp" value={statusFilt} onChange={e => setStatusFilt(e.target.value)} style={{ maxWidth: 140 }}>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={downloadTemplate} title="Download import template">📋 Template</button>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Excel import — upload .xlsx file in production")} title="Bulk import from Excel">📤 Import XLS</button>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Exporting " + filtered.length + " employees to Excel...")} >📊 Export XLS</button>
          <button className="btn-ghost" style={{ fontSize: 12, color: "#EF4444" }} onClick={() => showToast("Exporting " + filtered.length + " employees to PDF...")}>📄 Export PDF</button>
          <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => setShowAdd(true)}>+ Add Employee</button>
        </div>
      </div>

      {/* ── Blood Group Mini Chart ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {Object.entries(bloodStats()).map(([bg, cnt]) => (
          <div key={bg} style={{
            background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 12px",
            display: "flex", alignItems: "center", gap: 6, fontSize: 12
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", flexShrink: 0 }} />
            <strong>{bg}</strong> <span style={{ color: "#94A3B8" }}>({cnt})</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#94A3B8", alignSelf: "center" }}>
          Blood group distribution · {empList.length} employees
        </div>
      </div>

      {/* ── Employee Table ── */}
      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} style={{ cursor: "pointer" }} onClick={() => {
                  setViewTab(0);
                  // Fetch full employee data (includes passport, emergency, education, skills)
                  apiFetch(`/api/employees/${e.id}`)
                    .then(r => r.json())
                    .then(d => setViewEmp(d.success && d.data ? normalizeEmployeeDetail(d.data) : e))
                    .catch(() => setViewEmp(e));
                }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={e.name} size={34} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{e.bloodGroup && <span style={{ color: "#EF4444", fontWeight: 600 }}>{e.bloodGroup} · </span>}{e.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#475569" }}>{e.code}</td>
                  <td style={{ fontSize: 12, color: "#475569" }}>{e.designation}</td>
                  <td><span style={{ background: "#F1F5F9", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#475569", fontWeight: 500 }}>{e.department}</span></td>
                  <td>
                    <div style={{ fontSize: 12, color: "#475569" }}>{e.primaryPhone}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{e.officialEmail}</div>
                  </td>
                  <td style={{ fontSize: 12, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{e.joinDate}</td>
                  <td>
                    <span style={{ background: statBg(e.status), color: statColor(e.status), borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                      {e.status}
                    </span>
                  </td>
                  <td onClick={ev => ev.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { setEditEmp(e); }}>Edit</button>
                      <button className="btn-ghost" style={{ fontSize: 11, color: "#EF4444" }} onClick={() => setConfirmDel(e.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8", fontSize: 13 }}>
              No employees match your filters.
            </div>
          )}
        </div>
      </div>

      {/* ── View Employee Profile Modal ── */}
      {viewEmp && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewEmp(null); }}>
          <div className="modal" style={{ maxWidth: 680, width: "96vw" }}>
            {/* Header */}
            <div style={{
              padding: "22px 28px", background: "linear-gradient(135deg,#0D1B2A,#1E3A5F)", borderRadius: "14px 14px 0 0",
              display: "flex", alignItems: "center", gap: 16
            }}>
              <Avatar name={viewEmp.name} size={52} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>{viewEmp.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 2 }}>{viewEmp.designation} · {viewEmp.department}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <span style={{ background: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{viewEmp.code}</span>
                  <span style={{ background: statBg(viewEmp.status), color: statColor(viewEmp.status), borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{viewEmp.status}</span>
                  {viewEmp.bloodGroup && <span style={{ background: "rgba(239,68,68,.2)", color: "#FCA5A5", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{viewEmp.bloodGroup}</span>}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => { setViewEmp(null); setEditEmp(viewEmp); }}>Edit Profile</button>
                <button onClick={() => setViewEmp(null)} style={{
                  background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8,
                  color: "#fff", padding: "6px 14px", fontSize: 12, cursor: "pointer"
                }}>Close</button>
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", overflowX: "auto" }}>
              {VIEW_TABS.map((t, i) => (
                <button key={i} onClick={() => setViewTab(i)} style={{
                  flex: 1, minWidth: 110, padding: "11px 8px", border: "none",
                  cursor: "pointer", fontSize: 11, fontWeight: viewTab === i ? 700 : 500,
                  background: viewTab === i ? "#FFF5F0" : "#fff", color: viewTab === i ? "#E8520A" : "#64748B",
                  borderBottom: viewTab === i ? "2.5px solid #E8520A" : "2.5px solid transparent", whiteSpace: "nowrap"
                }}>{t}</button>
              ))}
            </div>
            <div style={{ padding: "20px 28px", maxHeight: "55vh", overflowY: "auto" }}>
              {viewTab === 0 && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      ["Date of Birth", viewEmp.dob || "—"],
                      ["Gender", viewEmp.gender || "—"],
                      ["Nationality", viewEmp.nationality || "—"],
                      ["Aadhaar", viewEmp.aadhaar || "—"],
                      ["PAN", viewEmp.pan || "—"],
                      ["Passport No.", (viewEmp.passport || {}).no || "—"],
                      ["Passport Expiry", (viewEmp.passport || {}).expiry || "—"],
                      ["Joined", viewEmp.joinDate || "—"],
                      ["Reporting Manager", viewEmp.reportingManager || "—"],
                      ["CTC", viewEmp.ctc ? "$" + viewEmp.ctc + "/mo" : "—"],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#0D1B2A" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {(viewEmp.skills || []).length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 8 }}>SKILLS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(viewEmp.skills || []).map(s => <span key={s} style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#1E40AF" }}>{s}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {viewTab === 1 && (
                <div>
                  {[
                    ["Primary Phone", viewEmp.primaryPhone],
                    ["Secondary Phone", viewEmp.secondaryPhone || "—"],
                    ["Official Email", viewEmp.officialEmail],
                    ["Personal Email", viewEmp.personalEmail || "—"],
                    ["Emergency Contact", viewEmp.emergency ? (viewEmp.emergency.name + " (" + viewEmp.emergency.relation + ") · " + viewEmp.emergency.phone) : "—"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F8FAFC" }}>
                      <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>{l}</span>
                      <span style={{ fontSize: 13, color: "#0D1B2A", fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Current Address</div>
                    <div style={{ fontSize: 13, color: "#0D1B2A", lineHeight: 1.8 }}>
                      {[(viewEmp.currentAddr || {}).line1, (viewEmp.currentAddr || {}).line2, (viewEmp.currentAddr || {}).city, (viewEmp.currentAddr || {}).state, (viewEmp.currentAddr || {}).pin].filter(Boolean).join(", ")}
                    </div>
                  </div>
                </div>
              )}
              {viewTab === 2 && (
                <div>
                  {[
                    ["Designation", viewEmp.designation],
                    ["Department", viewEmp.department],
                    ["Date of Joining", viewEmp.joinDate],
                    ["Status", viewEmp.status],
                    ["CTC", viewEmp.ctc ? "$" + viewEmp.ctc + "/month" : "—"],
                    ["Reporting Manager", viewEmp.reportingManager || "—"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F8FAFC" }}>
                      <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>{l}</span>
                      <span style={{ fontSize: 13, color: "#0D1B2A", fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                  {viewEmp.notes && (
                    <div style={{ marginTop: 16, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: "#92400E", fontWeight: 700, marginBottom: 4 }}>INTERNAL NOTES</div>
                      <div style={{ fontSize: 13, color: "#78350F" }}>{viewEmp.notes}</div>
                    </div>
                  )}
                </div>
              )}
              {viewTab === 3 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10 }}>Education</div>
                  {(viewEmp.education || []).map((ed, i) => (
                    <div key={i} style={{ background: "#F8FAFC", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0D1B2A" }}>{ed.degree} — {ed.institution}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{ed.specialization} · {ed.year} · {ed.grade}</div>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10, marginTop: 16 }}>Work History</div>
                  {(viewEmp.workHistory || []).length === 0 && <div style={{ fontSize: 12, color: "#94A3B8" }}>No previous employment on record.</div>}
                  {(viewEmp.workHistory || []).map((w, i) => (
                    <div key={i} style={{ background: "#F8FAFC", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0D1B2A" }}>{w.company} — {w.role}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{w.from} to {w.to} · CTC: ${w.ctc}</div>
                      {w.reason && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Reason: {w.reason}</div>}
                    </div>
                  ))}
                </div>
              )}
              {viewTab === 4 && (
                <div>
                  <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "20px", textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0D1B2A", marginBottom: 4 }}>{viewEmp.resumeFile || "No resume uploaded"}</div>
                    {viewEmp.resumeFile && (
                      <button className="btn-secondary" style={{ fontSize: 12, marginTop: 8 }} onClick={() => showToast("Resume download would begin in production")}>
                        Download Resume
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Exporting " + viewEmp.name + "'s profile to PDF...")}>📄 Export Profile PDF</button>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => showToast("Exporting " + viewEmp.name + "'s data to Excel...")}>📊 Export to Excel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {confirmDel && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setConfirmDel(null); }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ padding: "28px" }}>
              <div style={{ fontSize: 28, textAlign: "center", marginBottom: 12 }}>⚠️</div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16, color: "#0D1B2A", textAlign: "center", marginBottom: 8 }}>
                Delete Employee?
              </div>
              <div style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 24 }}>
                This will permanently remove <strong>{empList.find(e => e.id === confirmDel).name}</strong> and all associated records. This cannot be undone.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setConfirmDel(null)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: "center", background: "#EF4444" }} onClick={() => deleteEmp(confirmDel)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showAdd || editEmp) && (
        <AddEmployeeModal
          onSave={saveEmp}
          onClose={() => { setShowAdd(false); setEditEmp(null); }}
          existing={editEmp || null}
        />
      )}
      {toast && <Toast msg={toast} />}
    </div>
  );
};

export default EmployeeDatabase;
