// ─────────────────────────────────────────────────────────────────────────────
//  utils/emailSender.js
//  Merge-field engine + HTML email templates for all 7 Dolluz EPR templates.
//  Each template matches the design in DolluzEmailTemplates.jsx.
//
//  Usage:
//    await sendEmail("review_request", "stakeholder@client.com", { ... });
// ─────────────────────────────────────────────────────────────────────────────

// const transporter = require("../config/email"); // EMAIL DISABLED
const logger      = require("./logger");

const FROM = `"${process.env.EMAIL_FROM_NAME || "Dolluz EPR Portal"}" <${process.env.EMAIL_FROM_ADDRESS || "noreply@dolluz.com"}>`;
const ADMIN_EMAIL = process.env.EMAIL_ADMIN_ADDRESS || "admin@dolluz.com";

// ── Shared HTML shell ─────────────────────────────────────────────────────────
function shell(preheader, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dolluz EPR Portal</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'DM Sans', Arial, sans-serif; background:#F0F4F8; color:#0D1B2A; }
    .wrapper { max-width:600px; margin:0 auto; }
    .header { background:#0D1B2A; padding:20px 32px; }
    .header .brand { font-size:22px; font-weight:800; color:#fff; letter-spacing:-0.5px; }
    .header .brand span { color:#E8520A; }
    .content { background:#fff; padding:32px; }
    .footer { background:#F8FAFC; border-top:1px solid #E2E8F0; padding:18px 32px; text-align:center; font-size:11px; color:#94A3B8; }
    .hero { padding:28px 24px; border-radius:10px; margin-bottom:24px; text-align:center; }
    .hero .icon { font-size:36px; margin-bottom:12px; }
    .hero h1 { font-size:20px; font-weight:700; margin-bottom:8px; }
    .hero p { font-size:14px; opacity:0.85; line-height:1.5; }
    p { font-size:14px; line-height:1.7; margin-bottom:14px; color:#374151; }
    .info-card { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:18px 22px; margin-bottom:20px; }
    .info-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #F1F5F9; font-size:13px; }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:#64748B; }
    .info-value { font-weight:600; color:#0D1B2A; }
    .cta-btn { display:block; width:fit-content; margin:20px auto; padding:14px 32px; background:#E8520A; color:#fff; text-decoration:none; border-radius:8px; font-weight:700; font-size:14px; }
    .divider { height:1px; background:#F1F5F9; margin:20px 0; }
    .small-note { background:#F8FAFC; border-radius:8px; padding:12px 16px; font-size:12px; color:#64748B; line-height:1.6; }
    .warn-box { background:#FFFBEB; border:1.5px solid #FDE68A; border-radius:10px; padding:14px 18px; margin-bottom:18px; }
    .warn-text { font-size:13px; color:#92400E; font-weight:700; margin-bottom:4px; }
    .warn-sub { font-size:12px; color:#B45309; }
    .creds-table { width:100%; border-collapse:collapse; margin-bottom:16px; }
    .creds-table td { padding:10px 0; font-size:13px; border-bottom:1px solid #F1F5F9; }
    .creds-table .lbl { color:#64748B; width:35%; }
    .creds-table .val { font-family:monospace; font-weight:700; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">Dolluz<span>.</span></div>
    </div>
    <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</span>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Dolluz Corp. All rights reserved.<br>
      Questions? <a href="mailto:admin@dolluz.com" style="color:#E8520A;">admin@dolluz.com</a>
    </div>
  </div>
</body>
</html>`;
}

function hero(icon, title, subtitle, color = "#E8520A") {
  return `<div class="hero" style="background:${color}18; border:1.5px solid ${color}30;">
    <div class="icon">${icon}</div>
    <h1 style="color:${color};">${title}</h1>
    <p>${subtitle}</p>
  </div>`;
}

function infoCard(rows, color = "#E8520A") {
  const rowsHtml = rows.map(([label, value]) =>
    `<div class="info-row"><span class="info-label">${label}</span><span class="info-value" style="color:${color};">${value}</span></div>`
  ).join("");
  return `<div class="info-card">${rowsHtml}</div>`;
}

function ctaButton(text, href, color = "#E8520A") {
  return `<a href="${href}" class="cta-btn" style="background:${color};">${text}</a>`;
}

// ── Template builders ─────────────────────────────────────────────────────────

function buildReviewRequest(d) {
  const resources = d.resources || [{ name: d.EmployeeName, link: d.ReviewLink }];
  const rows = resources.map((r, i) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:#374151;">${i + 1}. ${r.name}</td>
     <td style="padding:10px 0;border-bottom:1px solid #F1F5F9;text-align:right;">
       <a href="${r.link}" style="background:#E8520A;color:#fff;padding:6px 14px;border-radius:6px;font-size:11px;font-weight:700;text-decoration:none;">Open Review &rarr;</a>
     </td></tr>`
  ).join("");

  return shell(
    `Your ${d.Quarter} performance reviews are ready. ${d.ResourceCount} resource(s) pending your input.`,
    `${hero("📋", `${d.Quarter} Performance Review`, `You have ${d.ResourceCount} resource(s) to review for ${d.ClientName}.`)}
     <p>Dear <strong>${d.StakeholderName}</strong>,</p>
     <p>The <strong>${d.Quarter} ${d.Year}</strong> EPR cycle is now open. Please complete the performance review for each resource below by <strong>${d.Deadline}</strong>.</p>
     <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rows}</table>
     <div class="small-note">Reviews take approximately 5–7 minutes per resource. Your progress is auto-saved. Submissions are final unless the Dolluz admin team re-opens the review.</div>`
  );
}

function buildReminder(d) {
  return shell(
    `⏰ Reminder ${d.ReminderNumber} of ${d.TotalReminders} — ${d.EmployeeName}'s review is still pending.`,
    `${hero("⏰", "Friendly Reminder — Review Pending", `The review for ${d.EmployeeName} has not yet been submitted. Deadline: ${d.Deadline}.`, "#F59E0B")}
     <p>Dear <strong>${d.StakeholderName}</strong>,</p>
     <p>We noticed the performance review for <strong>${d.EmployeeName}</strong> (${d.Quarter}) is still pending. Please submit before <strong>${d.Deadline}</strong>.</p>
     <div class="warn-box">
       <div class="warn-text">&#9888; Action Required Before ${d.Deadline}</div>
       <div class="warn-sub">Your review link is still active and any progress has been saved.</div>
     </div>
     ${infoCard([["Employee", d.EmployeeName], ["Quarter", d.Quarter], ["Client", d.ClientName], ["Deadline", d.Deadline]], "#F59E0B")}
     ${ctaButton("Complete Review Now", d.ReviewLink, "#F59E0B")}
     <div class="divider"></div>
     <div class="small-note">This is reminder ${d.ReminderNumber} of ${d.TotalReminders}. If not submitted by ${d.Deadline}, the Dolluz admin team will follow up directly.</div>`
  );
}

function buildReactivation(d) {
  return shell(
    `Your review for ${d.EmployeeName} has been re-opened for amendments. Please re-submit at your earliest.`,
    `${hero("🔄", "Review Re-opened for Amendment", `The ${d.Quarter} review for ${d.EmployeeName} has been unlocked by the Dolluz admin team.`, "#6366F1")}
     <p>Dear <strong>${d.StakeholderName}</strong>,</p>
     <p>Your previously submitted review for <strong>${d.EmployeeName}</strong> (${d.Quarter}) has been re-opened. Please review, make the necessary changes, and re-submit.</p>
     ${d.AdminNote ? `<div class="warn-box"><div class="warn-text">&#128221; Admin Note</div><div class="warn-sub">${d.AdminNote}</div></div>` : ""}
     ${infoCard([["Employee", d.EmployeeName], ["Quarter", d.Quarter], ["Client", d.ClientName], ["Deadline", d.Deadline]], "#6366F1")}
     ${ctaButton("Open Review to Amend", d.ReviewLink, "#6366F1")}
     <div class="small-note">Amendment requests are subject to admin approval. If you did not request this, please contact admin@dolluz.com immediately.</div>`
  );
}

function buildConfirmation(d) {
  return shell(
    `We received your ${d.Quarter} review for ${d.EmployeeName}. Thank you.`,
    `${hero("✅", "Review Submitted Successfully", `Your ${d.Quarter} review for ${d.EmployeeName} has been received.`)}
     <p>Dear <strong>${d.StakeholderName}</strong>,</p>
     <p>Thank you for completing the performance review. Your submission has been recorded and shared with the Dolluz admin team.</p>
     ${infoCard([["Employee", d.EmployeeName], ["Quarter", d.Quarter], ["Client", d.ClientName], ["Submitted At", d.SubmittedAt]])}
     <p style="font-size:13px;color:#64748B;">If you need to make any amendments, please reach out to the Dolluz admin team at <a href="mailto:admin@dolluz.com" style="color:#E8520A;">admin@dolluz.com</a>. Amendment requests are subject to admin approval.</p>`
  );
}

function buildAdminNotify(d) {
  return shell(
    `[Internal] Review submitted — ${d.EmployeeName} by ${d.StakeholderName}`,
    `${hero("🔔", "Review Submitted — Admin Alert", `${d.StakeholderName} submitted the ${d.Quarter} review for ${d.EmployeeName}.`, "#E8520A")}
     ${infoCard([
       ["Employee",      d.EmployeeName],
       ["Quarter",       d.Quarter],
       ["Client",        d.ClientName],
       ["Submitted By",  d.StakeholderName],
       ["Submitted At",  d.SubmittedAt],
       ["Submitter Email", d.SubmitterEmail],
     ])}
     ${ctaButton("View in Portal", d.PortalLink)}
     <div class="small-note">This is an automated internal notification. You can manage this review from the Reviews section of the EPR Portal.</div>`
  );
}

function buildPdfCopy(d) {
  return shell(
    `Your copy of the ${d.Quarter} EPR review response for ${d.EmployeeName}.`,
    `${hero("📎", "Review Response Copy", `Attached is a PDF copy of the completed review for ${d.EmployeeName}.`, "#8B5CF6")}
     <p>Dear <strong>${d.RecipientName}</strong>,</p>
     <p>As requested, please find attached a copy of the performance review response for <strong>${d.EmployeeName}</strong> for the <strong>${d.Quarter} ${d.Year}</strong> cycle.</p>
     ${infoCard([["Employee", d.EmployeeName], ["Quarter", `${d.Quarter} ${d.Year}`], ["Submitted By", d.StakeholderName], ["Submitted At", d.SubmittedAt]], "#8B5CF6")}
     <div class="small-note">This copy was generated as part of the Dolluz EPR Portal review process. If you received this in error, please contact admin@dolluz.com.</div>`
  );
}

function buildWelcomeUser(d) {
  return shell(
    `Welcome to the Dolluz EPR Portal, ${d.UserName}. Your ${d.UserRole} access is ready.`,
    `${hero("🎉", "Welcome to the EPR Portal", `Your ${d.UserRole} account has been created. Here are your login credentials.`, "#0D1B2A")}
     <p>Hi <strong>${d.UserName}</strong>,</p>
     <p>You have been granted <strong>${d.UserRole}</strong> access to the Dolluz Employee Performance Review (EPR) Portal.</p>
     <div class="info-card">
       <div style="font-size:11px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Your Login Credentials</div>
       <table class="creds-table">
         <tr><td class="lbl">Portal URL</td><td class="val" style="color:#3B82F6;">${d.PortalURL}</td></tr>
         <tr><td class="lbl">Email</td><td class="val" style="color:#0D1B2A;">${d.UserEmail}</td></tr>
         <tr><td class="lbl">Password</td><td class="val" style="color:#E8520A;">${d.TempPassword}</td></tr>
         <tr><td class="lbl">Your Role</td><td class="val" style="color:#8B5CF6;">${d.UserRole}</td></tr>
       </table>
     </div>
     <div style="background:#FEF2F2;border:1.5px solid #FECACA;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
       <div style="font-size:12px;font-weight:700;color:#991B1B;margin-bottom:4px;">&#128274; Action Required on First Login</div>
       <div style="font-size:12px;color:#B91C1C;line-height:1.6;">You will be prompted to change your temporary password immediately after signing in.</div>
     </div>
     ${ctaButton("Sign In to EPR Portal", d.PortalURL, "#0D1B2A")}
     <p style="font-size:13px;color:#64748B;">If you did not expect this email, please contact <a href="mailto:admin@dolluz.com" style="color:#E8520A;">admin@dolluz.com</a> immediately.</p>`
  );
}

// ── Template registry ─────────────────────────────────────────────────────────
const TEMPLATE_MAP = {
  review_request : buildReviewRequest,
  reminder       : buildReminder,
  reactivation   : buildReactivation,
  confirmation   : buildConfirmation,
  admin_notify   : buildAdminNotify,
  pdf_copy       : buildPdfCopy,
  welcome_user   : buildWelcomeUser,
};

// ── Subject line builder ──────────────────────────────────────────────────────
function buildSubject(templateKey, d) {
  const subjects = {
    review_request : `[Dolluz] ${d.Quarter} Performance Review — Your Team (${d.ResourceCount} Resources)`,
    reminder       : `[Reminder] [Dolluz] ${d.Quarter} Review Pending — Please Complete Before ${d.Deadline}`,
    reactivation   : `[Dolluz] Review Re-opened — ${d.Quarter} ${d.EmployeeName} — Please Amend`,
    confirmation   : `[Dolluz] Review Received — ${d.Quarter} ${d.EmployeeName}`,
    admin_notify   : `[EPR Portal] Review Submitted — ${d.EmployeeName} by ${d.StakeholderName} — ${d.Quarter}`,
    pdf_copy       : `[Dolluz] Review Response Copy — ${d.EmployeeName} | ${d.Quarter} ${d.Year}`,
    welcome_user   : `[Dolluz EPR] Welcome — Your Portal Access is Ready`,
  };
  return subjects[templateKey] || "Dolluz EPR Portal";
}

// ── Main send function ────────────────────────────────────────────────────────
/**
 * Send a Dolluz EPR email.
 *
 * @param {string} templateKey     One of the TEMPLATE_MAP keys
 * @param {string|string[]} to     Recipient email(s)
 * @param {object} data            Merge data object
 * @param {object} [options]       Optional: { cc, bcc, attachments }
 */
async function sendEmail(templateKey, to, data = {}, options = {}) {
  const builder = TEMPLATE_MAP[templateKey];
  if (!builder) throw new Error(`Unknown email template: ${templateKey}`);

  const html    = builder(data);
  const subject = buildSubject(templateKey, data);

  const mailOptions = {
    from        : FROM,
    to          : Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    cc          : options.cc,
    bcc         : options.bcc,
    attachments : options.attachments || [],
  };

  // ── MAIL SEND DISABLED (no SMTP configured) ──────────────────────────────
  // Uncomment the try/catch below and remove the mock block when a real API key is available.
  //
  // try {
  //   const info = await transporter.sendMail(mailOptions);
  //   logger.info(`Email sent [${templateKey}] to ${mailOptions.to} — MessageId: ${info.messageId}`);
  //   return info;
  // } catch (err) {
  //   logger.error(`Email FAILED [${templateKey}] to ${mailOptions.to}: ${err.message}`);
  //   throw err;
  // }

  // Mock response so callers treat the send as successful
  const mockInfo = { messageId: `mock-${Date.now()}@dolluz.dev` };
  logger.info(`[MOCK EMAIL] [${templateKey}] to ${mailOptions.to} | subject: "${subject}"`);
  return mockInfo;
}

module.exports = { sendEmail };
