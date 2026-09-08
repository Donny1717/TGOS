/**
 * TENDER.GATE.OS — Master Suite token registry and output gate.
 *
 * The Master Suite is five connected documents. A value that appears in more
 * than one of them must render identically in all of them. This module is the
 * registry of those tokens and the gate that runs before any export.
 *
 * Design constraints:
 *   1. No unresolved token may survive generation. F1 is absolute.
 *   2. Shared identity tokens must match across every document that carries
 *      them. A tender reference that differs between the Form of Tender and
 *      the Pricing Schedule is a rejection risk, not a typo.
 *   3. A hard_fail blocks final export. It may be waived only by a named
 *      person with a recorded reason, and the waiver is an audit event.
 *   4. Money is compared in pence as integers. Never compare formatted strings.
 */

export const TOKEN_PATTERN = /\{\{[A-Z0-9_]+\}\}/g;

export const DOCUMENTS = {
  itt_response: "01_ITT_Response_PA23.docx",
  pricing_schedule: "02_Pricing_Schedule_PA23.xlsx",
  non_collusion: "03_Certificate_of_Non_Collusion_PA23.docx",
  form_of_tender: "04_Form_of_Tender_PA23.docx",
  response_checklist: "05_Response_Checklist_PA23.docx",
};

export const SEVERITY = {
  HARD_FAIL: "hard_fail",
  HIGH_RISK: "high_risk",
  WARNING: "warning",
  INFO: "info",
};

/**
 * Shared identity tokens. These carry the same value everywhere they appear.
 * Divergence between documents is the single most common cause of avoidable
 * rejection, which is why this is F2 and why it is a hard fail.
 */
export const SHARED_IDENTITY_TOKENS = [
  "TENDER_REF",
  "TENDER_TITLE",
  "COMPANY_LEGAL_NAME",
  "BUYER_ORGANISATION",
  "LOT_NUMBER",
  "SUBMISSION_DEADLINE",
];

/**
 * Universal output checks F1–F10. Every one runs before final export.
 * `automated: false` means the platform records a human attestation rather
 * than performing the check itself — the distinction matters and must be
 * visible in the UI. Claiming to verify something the software cannot see is
 * the failure this field exists to prevent.
 */
export const OUTPUT_CHECKS = [
  { id: "F1", severity: SEVERITY.HARD_FAIL, automated: true,
    rule: "No unresolved {{TOKEN}} remains after generation" },
  { id: "F2", severity: SEVERITY.HARD_FAIL, automated: true,
    rule: "Shared identity tokens render identically across all documents" },
  { id: "F3", severity: SEVERITY.HARD_FAIL, automated: true,
    rule: "Form of Tender price equals Pricing Schedule headline total" },
  { id: "F4", severity: SEVERITY.HARD_FAIL, automated: true,
    rule: "Every required signature and execution block is complete" },
  { id: "F5", severity: SEVERITY.HARD_FAIL, automated: false,
    rule: "Required portal forms and attachments uploaded before deadline" },
  { id: "F6", severity: SEVERITY.HARD_FAIL, automated: true,
    rule: "Every response is within its buyer word or page limit" },
  { id: "F7", severity: SEVERITY.HIGH_RISK, automated: false,
    rule: "Named staff, FTEs, TUPE and delivery claims match the priced solution" },
  { id: "F8", severity: SEVERITY.HIGH_RISK, automated: true,
    rule: "Social value commitments have measurable targets, owners, dates and cost treatment" },
  { id: "F9", severity: SEVERITY.HIGH_RISK, automated: true,
    rule: "Insurance and accreditation remain valid to contract start, or renewal evidence is attached" },
  { id: "F10", severity: SEVERITY.HARD_FAIL, automated: false,
    rule: "Exported files downloaded from the portal and re-opened before deadline" },
];

const finding = (check, status, message, extra = {}) => ({
  check: check.id,
  severity: check.severity,
  automated: check.automated,
  status,
  message,
  ...extra,
});

const get = (checks, id) => checks.find((c) => c.id === id);

/* ---------------------------------------------------------------- *
 * F1 — no unresolved token survives generation
 * ---------------------------------------------------------------- */
export function checkF1(renderedDocuments) {
  const c = get(OUTPUT_CHECKS, "F1");
  const offenders = [];
  for (const [doc, body] of Object.entries(renderedDocuments)) {
    const found = String(body).match(TOKEN_PATTERN);
    if (found) offenders.push({ document: doc, tokens: [...new Set(found)] });
  }
  return offenders.length
    ? finding(c, "fail",
        `Unresolved tokens remain in ${offenders.length} document(s). A token with no value must render as an empty string or N/A — it must never reach an export.`,
        { offenders })
    : finding(c, "pass", "No unresolved tokens.");
}

/* ---------------------------------------------------------------- *
 * F2 — shared identity tokens agree across documents
 * ---------------------------------------------------------------- */
export function checkF2(valuesByDocument) {
  const c = get(OUTPUT_CHECKS, "F2");
  const conflicts = [];

  for (const token of SHARED_IDENTITY_TOKENS) {
    const seen = new Map();
    for (const [doc, values] of Object.entries(valuesByDocument)) {
      if (!(token in values)) continue;
      const v = values[token];
      if (!seen.has(v)) seen.set(v, []);
      seen.get(v).push(doc);
    }
    if (seen.size > 1) {
      conflicts.push({ token, variants: [...seen].map(([value, docs]) => ({ value, documents: docs })) });
    }
  }

  return conflicts.length
    ? finding(c, "fail",
        `${conflicts.length} shared identity token(s) differ between documents. Buyers reject on this.`,
        { conflicts })
    : finding(c, "pass", "Shared identity tokens agree across all documents.");
}

/* ---------------------------------------------------------------- *
 * F3 — Form of Tender price equals Pricing Schedule total
 * Compared in pence as integers. Formatted strings are never compared.
 * ---------------------------------------------------------------- */
export function checkF3(formOfTenderPence, pricingScheduleTotalPence) {
  const c = get(OUTPUT_CHECKS, "F3");

  if (!Number.isInteger(formOfTenderPence) || !Number.isInteger(pricingScheduleTotalPence)) {
    return finding(c, "unknown",
      "Both figures must be supplied as integer pence. Comparing formatted currency strings hides rounding differences and is not permitted.",
      { missing: ["formOfTenderPence", "pricingScheduleTotalPence"] });
  }
  const delta = formOfTenderPence - pricingScheduleTotalPence;
  return delta === 0
    ? finding(c, "pass", "Form of Tender price equals the Pricing Schedule headline total.")
    : finding(c, "fail",
        `Form of Tender differs from the Pricing Schedule by ${delta} pence. Even £0.01 is a discrepancy a buyer may treat as a non-compliant tender.`,
        { formOfTenderPence, pricingScheduleTotalPence, deltaPence: delta });
}

/* ---------------------------------------------------------------- *
 * F6 — word and page limits
 * ---------------------------------------------------------------- */
export function checkF6(questions) {
  const c = get(OUTPUT_CHECKS, "F6");
  const breaches = [], unknown = [];

  for (const q of questions) {
    if (q.limit == null) { unknown.push(q.id); continue; }
    if (q.count == null) { unknown.push(q.id); continue; }
    if (q.count > q.limit) breaches.push({ id: q.id, count: q.count, limit: q.limit, over: q.count - q.limit });
  }

  if (unknown.length) {
    return finding(c, "unknown",
      `Cannot evaluate ${unknown.length} question(s): limit or count missing. An unchecked limit is not a passed limit.`,
      { unknown, breaches });
  }
  return breaches.length
    ? finding(c, "fail", `${breaches.length} response(s) exceed the published limit.`, { breaches })
    : finding(c, "pass", "All responses within their limits.");
}

/* ---------------------------------------------------------------- *
 * F9 — evidence validity to contract start
 * ---------------------------------------------------------------- */
export function checkF9(evidenceItems, contractStartDate) {
  const c = get(OUTPUT_CHECKS, "F9");
  if (!contractStartDate) {
    return finding(c, "unknown",
      "contractStartDate is required. Validity is measured to contract start, not to the submission deadline — evidence that lapses between the two is a live risk.",
      { missing: ["contractStartDate"] });
  }

  const expired = [], lapsing = [];
  for (const item of evidenceItems) {
    if (!item.expiryDate) continue;
    if (item.expiryDate < contractStartDate) {
      (item.renewalEvidenceAttached ? lapsing : expired).push(item);
    }
  }

  if (expired.length) {
    return finding(c, "fail",
      `${expired.length} item(s) expire before contract start with no renewal evidence attached.`,
      { expired, lapsingWithEvidence: lapsing });
  }
  return lapsing.length
    ? finding(c, "pass",
        `${lapsing.length} item(s) expire before contract start but carry renewal evidence. Confirm the buyer accepts renewal undertakings — some do not.`,
        { lapsingWithEvidence: lapsing })
    : finding(c, "pass", "All evidence valid to contract start.");
}

/* ---------------------------------------------------------------- *
 * Export gate
 * ---------------------------------------------------------------- */
export function evaluateExportGate(findings, waivers = []) {
  const waivedIds = new Set(waivers.map((w) => w.check));

  for (const w of waivers) {
    if (!w.waivedBy || !w.reason) {
      throw new Error(
        `Waiver for ${w.check} is invalid: a waiver requires both a named person (waivedBy) and a recorded reason. An anonymous waiver defeats the audit trail.`
      );
    }
  }

  const blocking = findings.filter(
    (f) => f.severity === SEVERITY.HARD_FAIL &&
           (f.status === "fail" || f.status === "unknown") &&
           !waivedIds.has(f.check)
  );
  const waived = findings.filter(
    (f) => f.severity === SEVERITY.HARD_FAIL &&
           (f.status === "fail" || f.status === "unknown") &&
           waivedIds.has(f.check)
  );
  const highRisk = findings.filter(
    (f) => f.severity === SEVERITY.HIGH_RISK && f.status !== "pass"
  );

  let status;
  if (blocking.length) status = "RED";
  else if (waived.length || highRisk.length) status = "AMBER";
  else status = "GREEN";

  return {
    status,
    finalExportAllowed: blocking.length === 0,
    draftExportAllowed: true,   // draft export is never gated, on any plan
    blocking,
    waived,
    highRisk,
    auditEvents: waivers.map((w) => ({
      event: "audit_finding_waived",
      check: w.check,
      waivedBy: w.waivedBy,
      reason: w.reason,
    })),
  };
}
