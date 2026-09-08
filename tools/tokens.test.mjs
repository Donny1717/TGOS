/**
 * TENDER.GATE.OS — Master Suite output gate fixtures.
 *
 * These cover the failure modes that cost real bids: a token that survived
 * generation, a tender reference that drifted between documents, a price that
 * differs by a penny, an evidence certificate that lapses between submission
 * and contract start.
 *
 * Run: node tokens.test.mjs
 */

import {
  checkF1, checkF2, checkF3, checkF6, checkF9,
  evaluateExportGate, SEVERITY, OUTPUT_CHECKS, SHARED_IDENTITY_TOKENS,
} from "./tokens.mjs";

let pass = 0, fail = 0;
const check = (name, actual, expected) => {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};

console.log("\nRegistry integrity");
check("10 universal output checks defined", OUTPUT_CHECKS.length, 10);
check("6 shared identity tokens", SHARED_IDENTITY_TOKENS.length, 6);
check("F5, F7 and F10 are declared non-automated attestations",
  OUTPUT_CHECKS.filter((c) => !c.automated).map((c) => c.id).join(","), "F5,F7,F10");

console.log("\nF1  Unresolved tokens");
check("clean documents pass",
  checkF1({ itt: "Bidder: Acme Ltd", form: "Price: £1,000" }).status, "pass");
check("a surviving token fails",
  checkF1({ itt: "Bidder: {{COMPANY_LEGAL_NAME}}" }).status, "fail");
check("the offending token is named for the user",
  checkF1({ itt: "Ref {{TENDER_REF}} and {{LOT_NUMBER}}" }).offenders[0].tokens.length, 2);
check("lowercase braces are not tokens and do not false-positive",
  checkF1({ itt: "see {{note}} in appendix" }).status, "pass");

console.log("\nF2  Shared identity across documents");
const agreed = {
  itt_response:     { TENDER_REF: "LB-2026-114", COMPANY_LEGAL_NAME: "Acme Ltd" },
  form_of_tender:   { TENDER_REF: "LB-2026-114", COMPANY_LEGAL_NAME: "Acme Ltd" },
  pricing_schedule: { TENDER_REF: "LB-2026-114" },
};
check("matching references pass", checkF2(agreed).status, "pass");

const drifted = {
  itt_response:     { TENDER_REF: "LB-2026-114" },
  form_of_tender:   { TENDER_REF: "LB-2026-14" },   // one digit lost
  pricing_schedule: { TENDER_REF: "LB-2026-114" },
};
check("a single dropped digit is caught", checkF2(drifted).status, "fail");
check("both variants are reported so the user can see which is wrong",
  checkF2(drifted).conflicts[0].variants.length, 2);

const nameDrift = {
  itt_response:   { COMPANY_LEGAL_NAME: "Acme Ltd" },
  form_of_tender: { COMPANY_LEGAL_NAME: "Acme Limited" },
};
check("Ltd versus Limited is a conflict, not a synonym",
  checkF2(nameDrift).status, "fail");

check("a token absent from a document is not a conflict",
  checkF2({ a: { TENDER_REF: "X" }, b: {} }).status, "pass");

console.log("\nF3  Price agreement, compared in pence");
check("equal totals pass", checkF3(125_000_00, 125_000_00).status, "pass");
check("a one-penny difference fails", checkF3(125_000_01, 125_000_00).status, "fail");
check("the delta is reported in pence", checkF3(125_000_01, 125_000_00).deltaPence, 1);
check("a formatted string returns unknown rather than a false pass",
  checkF3("£125,000.00", 125_000_00).status, "unknown");
check("a float returns unknown — pence must be integers",
  checkF3(125000.005, 125_000_00).status, "unknown");

console.log("\nF6  Word and page limits");
check("all within limit passes",
  checkF6([{ id: "Q1", count: 480, limit: 500 }]).status, "pass");
check("exactly at the limit passes — the limit is inclusive",
  checkF6([{ id: "Q1", count: 500, limit: 500 }]).status, "pass");
check("one word over fails",
  checkF6([{ id: "Q1", count: 501, limit: 500 }]).status, "fail");
check("the overage is quantified",
  checkF6([{ id: "Q1", count: 530, limit: 500 }]).breaches[0].over, 30);
check("a missing limit returns unknown, never a pass",
  checkF6([{ id: "Q1", count: 480 }]).status, "unknown");
check("a missing count returns unknown",
  checkF6([{ id: "Q1", limit: 500 }]).status, "unknown");

console.log("\nF9  Evidence validity to contract start");
const start = "2026-11-01";
check("evidence valid past contract start passes",
  checkF9([{ id: "EL", expiryDate: "2027-03-01" }], start).status, "pass");
check("evidence lapsing before contract start with no renewal fails",
  checkF9([{ id: "EL", expiryDate: "2026-10-01" }], start).status, "fail");
check("lapsing with renewal evidence attached passes with a caveat",
  checkF9([{ id: "EL", expiryDate: "2026-10-01", renewalEvidenceAttached: true }], start).status, "pass");
check("missing contract start returns unknown — validity is measured to start, not deadline",
  checkF9([{ id: "EL", expiryDate: "2026-10-01" }], null).status, "unknown");
check("evidence with no expiry date is not flagged",
  checkF9([{ id: "POLICY" }], start).status, "pass");

console.log("\nExport gate");
const clean = [checkF1({ a: "ok" }), checkF3(100, 100)];
check("a clean run is GREEN", evaluateExportGate(clean).status, "GREEN");
check("a clean run allows final export", evaluateExportGate(clean).finalExportAllowed, true);

const broken = [checkF1({ a: "{{TENDER_REF}}" })];
check("an unresolved hard fail is RED", evaluateExportGate(broken).status, "RED");
check("RED blocks final export", evaluateExportGate(broken).finalExportAllowed, false);
check("RED still allows draft export on every plan",
  evaluateExportGate(broken).draftExportAllowed, true);

const waived = evaluateExportGate(broken, [
  { check: "F1", waivedBy: "D. Founder", reason: "Buyer confirmed placeholder acceptable in Annex C" },
]);
check("a properly waived hard fail becomes AMBER, not GREEN", waived.status, "AMBER");
check("a waiver unblocks final export", waived.finalExportAllowed, true);
check("a waiver writes an audit event", waived.auditEvents[0].event, "audit_finding_waived");
check("the audit event records who waived it", waived.auditEvents[0].waivedBy, "D. Founder");

let threw = false;
try {
  evaluateExportGate(broken, [{ check: "F1", waivedBy: "D. Founder" }]);
} catch { threw = true; }
check("a waiver without a reason is rejected outright", threw, true);

threw = false;
try {
  evaluateExportGate(broken, [{ check: "F1", reason: "looked fine" }]);
} catch { threw = true; }
check("an anonymous waiver is rejected outright", threw, true);

const unknownF3 = [checkF3("£100", 100)];
check("an unknown hard-fail check is treated as blocking, not passing",
  evaluateExportGate(unknownF3).status, "RED");

const highRiskOnly = [checkF1({ a: "ok" }), checkF9([{ id: "EL", expiryDate: "2026-10-01" }], null)];
check("an unresolved high-risk check is AMBER, not RED",
  evaluateExportGate(highRiskOnly).status, "AMBER");
check("AMBER from high risk alone still allows final export",
  evaluateExportGate(highRiskOnly).finalExportAllowed, true);

console.log("\n" + "-".repeat(72));
console.log(`passed ${pass}   failed ${fail}`);
console.log("-".repeat(72));
process.exit(fail ? 1 : 0);
