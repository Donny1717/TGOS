#!/usr/bin/env node
/**
 * Doccute regulatory dataset validator.
 *
 * Purpose: prove, by execution, which regulatory values are safe to ship.
 * This tool does not decide whether a value is legally correct. It decides
 * whether the evidence attached to that value is good enough to rely on.
 *
 * Exit code 0 = every entry is releasable. Non-zero = at least one blocker.
 */

import { readFileSync } from "node:fs";

const TODAY = process.env.TGOS_TODAY ?? new Date().toISOString().slice(0, 10);
const data = JSON.parse(readFileSync(new URL("./regulatory-dataset.json", import.meta.url)));

const PRIMARY_HOSTS = [
  "legislation.gov.uk",
  "gov.uk",
  "assets.publishing.service.gov.uk",
  "england.nhs.uk",
];

const daysBetween = (a, b) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

const isPrimary = (url) => {
  try {
    return PRIMARY_HOSTS.some((h) => new URL(url).hostname.endsWith(h));
  } catch {
    return false;
  }
};

const findings = [];
const add = (severity, id, code, message) =>
  findings.push({ severity, id, code, message });

for (const e of data.entries) {
  const maxAge = data.reviewPolicy.maxAgeDaysBySensitivity[e.sensitivity];

  // --- Rule 1: every entry must carry at least one source URL.
  if (!e.sources || e.sources.length === 0) {
    add("BLOCK", e.id, "NO_SOURCE", "No source URL. Value cannot be shipped.");
  }

  // --- Rule 2: a source must exist on a recognised primary-source host.
  if (e.sources?.length && !e.sources.some(isPrimary)) {
    add(
      "BLOCK",
      e.id,
      "SECONDARY_ONLY",
      "Only secondary sources attached. Primary source required."
    );
  }

  // --- Rule 3: verificationStatus must be explicit and must be 'verified'.
  if (e.verificationStatus !== "verified") {
    add(
      e.verificationStatus === "unverified" ? "BLOCK" : "WARN",
      e.id,
      "NOT_VERIFIED",
      `verificationStatus = ${e.verificationStatus}`
    );
  }

  // --- Rule 4: must have been checked, and checked recently enough.
  if (!e.lastVerified) {
    add("BLOCK", e.id, "NEVER_VERIFIED", "lastVerified is null.");
  } else {
    const age = daysBetween(e.lastVerified, TODAY);
    if (age > maxAge) {
      add(
        "BLOCK",
        e.id,
        "STALE",
        `Last verified ${age} days ago; limit for '${e.sensitivity}' is ${maxAge}.`
      );
    } else if (age > maxAge * 0.75) {
      add("WARN", e.id, "AGEING", `Re-check due in ${maxAge - age} days.`);
    }
  }

  // --- Rule 5: a value that has not yet come into force must not be served.
  if (e.effectiveFrom && e.effectiveFrom > TODAY) {
    add("WARN", e.id, "NOT_YET_IN_FORCE", `Comes into force ${e.effectiveFrom}.`);
  }

  // --- Rule 6: a value past its effectiveTo date must not be served.
  if (e.effectiveTo && e.effectiveTo < TODAY) {
    add("BLOCK", e.id, "EXPIRED", `Ceased to apply on ${e.effectiveTo}.`);
  }

  // --- Rule 7: a known future change date that has passed means the value is suspect.
  if (e.nextExpectedChange && e.nextExpectedChange <= TODAY) {
    add(
      "BLOCK",
      e.id,
      "CHANGE_DATE_PASSED",
      `A change was expected on ${e.nextExpectedChange} and has not been reconciled.`
    );
  }

  // --- Rule 8: money values compared against PA23 valuations need a VAT basis.
  if (["GBP", "GBP_per_annum"].includes(e.unit) && !e.vatBasis) {
    add(
      "BLOCK",
      e.id,
      "NO_VAT_BASIS",
      "Monetary threshold with no VAT basis. PA23 valuation is VAT-inclusive; comparisons near the boundary will be wrong."
    );
  }

  // --- Rule 9: superseding a withdrawn standard must be flagged loudly.
  if (e.supersedes?.withdrawn) {
    add(
      "WARN",
      e.id,
      "SUPERSEDES_WITHDRAWN",
      `Replaces '${e.supersedes.value}', withdrawn ${e.supersedes.withdrawn}. All product copy referencing the old value must be purged.`
    );
  }
}

// ---------- report ----------
const blockers = findings.filter((f) => f.severity === "BLOCK");
const warnings = findings.filter((f) => f.severity === "WARN");
const blockedIds = new Set(blockers.map((f) => f.id));
const releasable = data.entries.filter((e) => !blockedIds.has(e.id));

const line = "-".repeat(72);
console.log(line);
console.log(`TENDER.GATE.OS REGULATORY DATASET AUDIT   as at ${TODAY}`);
console.log(line);
console.log(`entries:      ${data.entries.length}`);
console.log(`releasable:   ${releasable.length}`);
console.log(`blocked:      ${blockedIds.size}`);
console.log(`warnings:     ${warnings.length}`);
console.log(line);

if (releasable.length) {
  console.log("\nRELEASABLE");
  for (const e of releasable) console.log(`  PASS  ${e.id}  =  ${typeof e.value === "object" ? JSON.stringify(e.value) : e.value}`);
}

if (blockers.length) {
  console.log("\nBLOCKERS");
  for (const f of blockers) console.log(`  BLOCK ${f.id}\n        [${f.code}] ${f.message}`);
}

if (warnings.length) {
  console.log("\nWARNINGS");
  for (const f of warnings) console.log(`  WARN  ${f.id}\n        [${f.code}] ${f.message}`);
}

console.log(`\n${line}`);
if (blockers.length) {
  console.log(`RESULT: FAIL — ${blockers.length} blocker(s). Dataset must not ship.`);
  process.exit(1);
}
console.log("RESULT: PASS — all entries carry sufficient evidence.");
