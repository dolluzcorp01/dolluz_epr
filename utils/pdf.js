// ─────────────────────────────────────────────────────────────────────────────
//  utils/pdf.js
//  Generates a PDF copy of a completed stakeholder review response.
//  Used by: review submission ("Send a Copy") and admin download.
// ─────────────────────────────────────────────────────────────────────────────

const PDFDocument = require("pdfkit");

// Dolluz brand colours
const NAVY   = "#0D1B2A";
const ORANGE = "#E8520A";
const SLATE  = "#64748B";
const LIGHT  = "#F8FAFC";

const RATING_LABELS = { 1: "Unsatisfactory", 2: "Satisfactory", 3: "Good", 4: "Excellent" };
const SECTION_ORDER = ["Performance", "Interpersonal", "Values", "Conduct"];

/**
 * Generate a PDF buffer for a completed review.
 *
 * @param {object} review          Review record from DB
 * @param {object[]} responses     Array of { criterion_id, criterion_label, section, rating }
 * @param {object} employee        Employee record
 * @param {object} cycle           Cycle record
 * @param {object} stakeholder     { name, email, company }
 * @returns {Promise<Buffer>}
 */
function generateReviewPdf({ review, responses, employee, cycle, stakeholder }) {
  return new Promise((resolve, reject) => {
    const buffers = [];
    const doc = new PDFDocument({ size: "A4", margin: 48, info: {
      Title   : `EPR Review — ${employee.first_name} ${employee.last_name} — ${cycle.cycle_name}`,
      Author  : "Dolluz EPR Portal",
      Subject : "Employee Performance Review",
    }});

    doc.on("data", chunk => buffers.push(chunk));
    doc.on("end",  ()    => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // ── Header ────────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 70).fill(NAVY);
    doc.fillColor("#FFFFFF")
       .font("Helvetica-Bold").fontSize(20)
       .text("Dolluz.", 48, 22, { continued: true })
       .fillColor(ORANGE).text("  EPR Portal", { continued: false });
    doc.fillColor("#AABBCC").font("Helvetica").fontSize(9)
       .text("Employee Performance Review — Confidential", 48, 46);

    doc.moveDown(2.5);

    // ── Meta card ────────────────────────────────────────────────────────────
    const meta = [
      ["Employee",      `${employee.first_name} ${employee.last_name} (${employee.employee_code})`],
      ["Designation",   employee.designation || "—"],
      ["Quarter",       cycle.cycle_name],
      ["Submitted By",  stakeholder.name],
      ["Company",       stakeholder.company || "—"],
      ["Submitted At",  new Date(review.submitted_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
    ];

    meta.forEach(([label, value]) => {
      doc.fillColor(SLATE).font("Helvetica").fontSize(9).text(label + ":", { continued: true, width: 140 });
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9).text("  " + value);
    });

    doc.moveDown(1).moveTo(48, doc.y).lineTo(doc.page.width - 48, doc.y).strokeColor("#E2E8F0").lineWidth(1).stroke();
    doc.moveDown(1);

    // ── Responses by section ─────────────────────────────────────────────────
    SECTION_ORDER.forEach(section => {
      const sectionResponses = responses.filter(r => r.section === section);
      if (!sectionResponses.length) return;

      // Section header
      doc.fillColor(ORANGE).font("Helvetica-Bold").fontSize(11).text(section.toUpperCase(), { underline: false });
      doc.moveDown(0.4);

      sectionResponses.forEach(r => {
        const ratingLabel = RATING_LABELS[r.rating] || String(r.rating);
        const ratingColor = { 1: "#EF4444", 2: "#F59E0B", 3: "#3B82F6", 4: "#10B981" }[r.rating] || SLATE;

        doc.fillColor(NAVY).font("Helvetica").fontSize(10).text(r.criterion_label, 56, doc.y, { continued: true, width: 360 });
        doc.fillColor(ratingColor).font("Helvetica-Bold").fontSize(10).text(ratingLabel, { align: "right" });
        doc.moveDown(0.35);
      });

      doc.moveDown(0.6);
    });

    // ── Overall rating ────────────────────────────────────────────────────────
    if (review.overall_rating) {
      doc.moveTo(48, doc.y).lineTo(doc.page.width - 48, doc.y).strokeColor("#E2E8F0").lineWidth(1).stroke();
      doc.moveDown(0.6);
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text("Overall Rating", { continued: true });
      doc.fillColor(ORANGE).text(`  ${review.overall_rating.toFixed(2)} / 4.00`, { align: "right" });
      doc.moveDown(0.4);
    }

    // ── Goals reviewed / Comments ─────────────────────────────────────────────
    if (review.goals_reviewed) {
      doc.moveDown(0.4);
      doc.fillColor(ORANGE).font("Helvetica-Bold").fontSize(11).text("Previous Period Goals Assessment");
      doc.moveDown(0.3);
      doc.fillColor(NAVY).font("Helvetica").fontSize(10).text(review.goals_reviewed, { width: doc.page.width - 96 });
      doc.moveDown(0.4);
    }

    if (review.comments) {
      doc.fillColor(ORANGE).font("Helvetica-Bold").fontSize(11).text("Additional Comments");
      doc.moveDown(0.3);
      doc.fillColor(NAVY).font("Helvetica").fontSize(10).text(review.comments, { width: doc.page.width - 96 });
      doc.moveDown(0.4);
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc.moveTo(48, footerY - 10).lineTo(doc.page.width - 48, footerY - 10).strokeColor("#E2E8F0").lineWidth(1).stroke();
    doc.fillColor(SLATE).font("Helvetica").fontSize(8)
       .text(`Generated by Dolluz EPR Portal on ${new Date().toLocaleDateString("en-IN")}  |  admin@dolluz.com`, 48, footerY);

    doc.end();
  });
}

module.exports = { generateReviewPdf };
