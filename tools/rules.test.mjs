/**
 * Boundary fixtures for the TENDER.GATE.OS rule engine.
 *
 * Every case marked [AUG-PACK-BUG] is a scenario the 30 August 2026
 * specification would have answered incorrectly. These are the tests that
 * exist to stop the same defect returning.
 *
 * Run: node rules.test.mjs
 */

import {
  ruleCarbonReductionPlan, ruleContractKpis, ruleHigherRiskBuilding,
  ruleSocialValueModel, ruleNhsModernSlavery, ruleAwardOutcome,
} from "./rules.mjs";

let pass = 0, fail = 0;
const check = (name, actual, expected) => {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) console.log(`        expected ${expected}, got ${actual}`);
};

const CG = { buyerType: "central_government", vatBasis: "inclusive" };

console.log("\nR1  Carbon Reduction Plan — PPN 006");
check("[AUG-PACK-BUG] exactly £5,000,000/yr is OUT of scope (above, not >=)",
  ruleCarbonReductionPlan({ ...CG, annualValueIncVat: 5_000_000, contractYears: 3 }).status,
  "NOT_APPLICABLE");
check("£5,000,001/yr is in scope",
  ruleCarbonReductionPlan({ ...CG, annualValueIncVat: 5_000_001, contractYears: 3 }).status,
  "APPLIES");
check("value given ex-VAT returns UNKNOWN, not a guess",
  ruleCarbonReductionPlan({ ...CG, vatBasis: "exclusive", annualValueIncVat: 6_000_000, contractYears: 3 }).status,
  "UNKNOWN");
check("missing contractYears returns UNKNOWN (value is averaged over life)",
  ruleCarbonReductionPlan({ ...CG, annualValueIncVat: 9_000_000 }).status,
  "UNKNOWN");
check("local authority buyer is out of PPN 006 scope",
  ruleCarbonReductionPlan({ buyerType: "local_authority", vatBasis: "inclusive", annualValueIncVat: 9_000_000, contractYears: 2 }).status,
  "NOT_APPLICABLE");

console.log("\nR2  Contract KPIs — PA23 s.52");
check("[AUG-PACK-BUG] exactly £5,000,000 total is OUT of scope (more than)",
  ruleContractKpis({ totalValueIncVat: 5_000_000 }).status, "NOT_APPLICABLE");
check("£5,000,001 total is in scope",
  ruleContractKpis({ totalValueIncVat: 5_000_001 }).status, "APPLIES");
check("[AUG-PACK-BUG] duty holder is the contracting authority, not the supplier",
  ruleContractKpis({ totalValueIncVat: 8_000_000 }).dutyHolder, "contracting_authority");
check("[AUG-PACK-BUG] supplier has no action arising from s.52",
  ruleContractKpis({ totalValueIncVat: 8_000_000 }).supplierAction, "none");

console.log("\nR3  Higher-risk building — BSA 2022 s.65");
check("[AUG-PACK-BUG] 7 storeys at 17m IS a higher-risk building (height-only test misses it)",
  ruleHigherRiskBuilding({ heightMetres: 17, storeys: 7, residentialUnits: 20 }).status,
  "APPLIES");
check("18m at 5 storeys qualifies via the height limb",
  ruleHigherRiskBuilding({ heightMetres: 18, storeys: 5, residentialUnits: 12 }).status,
  "APPLIES");
check("[AUG-PACK-BUG] 20m and 8 storeys but only 1 residential unit does NOT qualify",
  ruleHigherRiskBuilding({ heightMetres: 20, storeys: 8, residentialUnits: 1 }).status,
  "NOT_APPLICABLE");
check("17m at 6 storeys with 30 units does not qualify",
  ruleHigherRiskBuilding({ heightMetres: 17, storeys: 6, residentialUnits: 30 }).status,
  "NOT_APPLICABLE");
check("missing residentialUnits returns UNKNOWN, never a pass",
  ruleHigherRiskBuilding({ heightMetres: 25, storeys: 9 }).status, "UNKNOWN");
check("storeys known but height unknown still resolves via the storey limb",
  ruleHigherRiskBuilding({ storeys: 9, residentialUnits: 40 }).status, "APPLIES");

console.log("\nR4  Social value model — PPN 002 vs PPN 026");
check("[AUG-PACK-BUG] commenced 2026-12-31 stays on PPN 002 even though 'today' is later",
  ruleSocialValueModel({ ...CG, procurementCommencedOn: "2026-12-31", totalValueIncVat: 8_000_000 }).model,
  "PPN 002");
check("commenced 2027-01-01 moves to PPN 026",
  ruleSocialValueModel({ ...CG, procurementCommencedOn: "2027-01-01", totalValueIncVat: 8_000_000 }).model,
  "PPN 026");
check("PPN 026 at £8m requires 20%",
  ruleSocialValueModel({ ...CG, procurementCommencedOn: "2027-03-01", totalValueIncVat: 8_000_000 }).minimumWeightingPercent,
  20);
check("PPN 026 at £2m requires 10%",
  ruleSocialValueModel({ ...CG, procurementCommencedOn: "2027-03-01", totalValueIncVat: 2_000_000 }).minimumWeightingPercent,
  10);
check("PPN 026 at exactly £5m falls in the 20% band",
  ruleSocialValueModel({ ...CG, procurementCommencedOn: "2027-03-01", totalValueIncVat: 5_000_000 }).minimumWeightingPercent,
  20);
check("£500k under PPN 026 is out of scope — the 2027 coverage gap",
  ruleSocialValueModel({ ...CG, procurementCommencedOn: "2027-03-01", totalValueIncVat: 500_000 }).coverageGap,
  true);
check("[AUG-PACK-BUG] no commencement date returns UNKNOWN, never date-based selection",
  ruleSocialValueModel({ ...CG, totalValueIncVat: 8_000_000 }).status, "UNKNOWN");

console.log("\nR5  NHS modern slavery — SI 2025/1212");
check("applies to a £40,000 NHS contract",
  ruleNhsModernSlavery({ isHealthServiceProcurementEngland: true, totalValueIncVat: 40_000 }).status,
  "APPLIES");
check("[AUG-PACK-BUG] no value threshold exists on this rule",
  ruleNhsModernSlavery({ isHealthServiceProcurementEngland: true, totalValueIncVat: 40_000 }).valueThreshold,
  null);
check("duty holder is the buyer",
  ruleNhsModernSlavery({ isHealthServiceProcurementEngland: true }).dutyHolder,
  "contracting_authority");

console.log("\nR6  Award outcome — PA23 s.19");
check("failing the requirements is terminal under s.19(2)(a)",
  ruleAwardOutcome({ satisfiesRequirements: false }).status, "FAILS_REQUIREMENTS");
check("[AUG-PACK-BUG] abnormally low is AT_RISK, not a failure — s.19(4)-(5) right to explain",
  ruleAwardOutcome({ satisfiesRequirements: true, abnormallyLow: true }).status,
  "AT_RISK_OF_DISREGARD");
check("[AUG-PACK-BUG] abnormally low is remediable",
  ruleAwardOutcome({ satisfiesRequirements: true, abnormallyLow: true }).remediable, true);
check("compliant tender proceeds to assessment",
  ruleAwardOutcome({ satisfiesRequirements: true }).status, "ELIGIBLE_FOR_ASSESSMENT");

console.log("\n" + "-".repeat(72));
console.log(`passed ${pass}   failed ${fail}`);
console.log("-".repeat(72));
process.exit(fail ? 1 : 0);
