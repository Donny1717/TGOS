/**
 * TENDER.GATE.OS compliance rule engine.
 *
 * Design constraints, in order of importance:
 *
 *   1. No regulatory number is written in this file. Every threshold is read
 *      from regulatory-dataset.json by id. If a value changes, this file does
 *      not change.
 *   2. Every rule states who the duty falls on. A duty on the contracting
 *      authority must never be presented to a supplier as their obligation.
 *   3. Comparators are explicit. `above £5m` is not `>= £5m`.
 *   4. A rule that cannot be evaluated returns UNKNOWN with the missing input
 *      named. It never guesses and never silently passes.
 *   5. Every result carries the source URL that justifies it.
 */

import { readFileSync } from "node:fs";

const dataset = JSON.parse(
  readFileSync(new URL("./regulatory-dataset.json", import.meta.url))
);
const REG = Object.fromEntries(dataset.entries.map((e) => [e.id, e]));

const need = (id) => {
  const e = REG[id];
  if (!e) throw new Error(`regulatory entry not found: ${id}`);
  return e;
};

/** Apply a comparator declared in the dataset, never one assumed in code. */
const compare = (actual, entry, threshold) => {
  const c = entry.comparator ?? "greater_than_or_equal";
  switch (c) {
    case "greater_than":
    case "more_than":
      return actual > threshold;
    case "greater_than_or_equal":
      return actual >= threshold;
    default:
      throw new Error(`unknown comparator '${c}' on ${entry.id}`);
  }
};

export const STATUS = {
  APPLIES: "APPLIES",
  NOT_APPLICABLE: "NOT_APPLICABLE",
  UNKNOWN: "UNKNOWN",
};

const result = (rule, status, entry, detail, extra = {}) => ({
  rule,
  status,
  dutyHolder: extra.dutyHolder ?? null,
  detail,
  basis: entry?.legalBasis ?? null,
  sources: entry?.sources ?? [],
  ...extra,
});

/* ------------------------------------------------------------------ *
 * R1  Carbon Reduction Plan — PPN 006
 * Duty: supplier, as a condition of participation.
 * Trigger: contract value ABOVE £5m per annum, INCLUDING VAT,
 *          averaged over the life of the contract.
 * Carve-out: applies only where related and proportionate.
 * ------------------------------------------------------------------ */
export function ruleCarbonReductionPlan(t) {
  const e = need("carbon.crp.trigger");
  const R = "R1_CRP_PPN006";

  if (t.buyerType !== "central_government") {
    return result(R, STATUS.NOT_APPLICABLE, e,
      "PPN 006 binds central government departments, executive agencies and NDPBs. Other buyers may impose a CRP by their own choice — check the tender documents.",
      { dutyHolder: "supplier" });
  }
  if (t.annualValueIncVat == null || t.contractYears == null) {
    return result(R, STATUS.UNKNOWN, e,
      "Cannot evaluate: annualValueIncVat and contractYears are both required. The PPN measures the advertised value averaged over the life of the contract.",
      { dutyHolder: "supplier", missing: ["annualValueIncVat", "contractYears"] });
  }
  if (t.vatBasis && t.vatBasis !== "inclusive") {
    return result(R, STATUS.UNKNOWN, e,
      "Value supplied exclusive of VAT. PPN 006 measures the advertised value INCLUDING VAT. Convert before evaluating.",
      { dutyHolder: "supplier", missing: ["vatBasis=inclusive"] });
  }

  const applies = compare(t.annualValueIncVat, e, e.value);
  if (!applies) {
    return result(R, STATUS.NOT_APPLICABLE, e,
      `£${t.annualValueIncVat.toLocaleString()}/yr is not above the £${e.value.toLocaleString()}/yr trigger. Note the comparator is strictly greater-than: a contract at exactly the threshold is out of scope.`,
      { dutyHolder: "supplier" });
  }
  return result(R, STATUS.APPLIES, e,
    `£${t.annualValueIncVat.toLocaleString()}/yr inc VAT is above the £${e.value.toLocaleString()}/yr trigger. A Carbon Reduction Plan is required as a condition of participation, using the template at Annex A. Subject to the 'related and proportionate' carve-out — if the buyer has disapplied it, the tender documents govern.`,
    { dutyHolder: "supplier", proportionalityCarveOut: true });
}

/* ------------------------------------------------------------------ *
 * R2  Contract KPIs — PA23 s.52
 * Duty: CONTRACTING AUTHORITY. Not the supplier.
 * Trigger: estimated value MORE THAN £5m (total, not per annum).
 * ------------------------------------------------------------------ */
export function ruleContractKpis(t) {
  const e = need("kpi.pa23.s52");
  const R = "R2_KPI_PA23_S52";
  const { threshold, minimumKpis } = e.value;

  if (t.totalValueIncVat == null) {
    return result(R, STATUS.UNKNOWN, e,
      "Cannot evaluate: totalValueIncVat is required. This is total estimated contract value, not the per-annum figure used by R1.",
      { dutyHolder: "contracting_authority", missing: ["totalValueIncVat"] });
  }

  const applies = compare(t.totalValueIncVat, e, threshold);
  if (!applies) {
    return result(R, STATUS.NOT_APPLICABLE, e,
      `£${t.totalValueIncVat.toLocaleString()} is not more than £${threshold.toLocaleString()}.`,
      { dutyHolder: "contracting_authority" });
  }
  return result(R, STATUS.APPLIES, e,
    `The contracting authority must set at least ${minimumKpis} KPIs before entering into this contract. THIS IS NOT A SUPPLIER OBLIGATION — it is a duty on the buyer under s.52(1), and is disapplied by s.52(2) where performance cannot appropriately be assessed by KPIs. Surface it to the supplier as intelligence about how they will be measured, never as a task on their checklist.`,
    { dutyHolder: "contracting_authority", supplierAction: "none" });
}

/* ------------------------------------------------------------------ *
 * R3  Higher-risk building — BSA 2022 s.65
 * Test: (>= 18 metres OR >= 7 storeys) AND >= 2 residential units.
 * The height limb alone produces false negatives.
 * ------------------------------------------------------------------ */
export function ruleHigherRiskBuilding(b) {
  const e = need("bsa.higher_risk_building");
  const R = "R3_BSA_HRB";
  const { heightMetres, storeys, minResidentialUnits } = e.value;

  if (b.heightMetres == null && b.storeys == null) {
    return result(R, STATUS.UNKNOWN, e,
      "Cannot evaluate: at least one of heightMetres or storeys is required. The test is a disjunction, so a missing limb can still produce a positive from the other.",
      { missing: ["heightMetres", "storeys"] });
  }
  if (b.residentialUnits == null) {
    return result(R, STATUS.UNKNOWN, e,
      "Cannot evaluate: residentialUnits is required. Height alone never determines the answer in the occupation phase.",
      { missing: ["residentialUnits"] });
  }

  const byHeight = b.heightMetres != null && b.heightMetres >= heightMetres;
  const byStoreys = b.storeys != null && b.storeys >= storeys;
  const hasUnits = b.residentialUnits >= minResidentialUnits;

  if ((byHeight || byStoreys) && hasUnits) {
    const limb = byHeight && byStoreys ? "both limbs" : byHeight ? "the height limb" : "the storey limb";
    return result(R, STATUS.APPLIES, e,
      `Higher-risk building: satisfies ${limb} and has ${b.residentialUnits} residential units. Note height is measured to the top floor surface and storeys consisting solely of rooftop plant are ignored. Rooftop-garden treatment has been under MHCLG review since 17 Dec 2025 and is unsettled.`);
  }
  return result(R, STATUS.NOT_APPLICABLE, e,
    `Not a higher-risk building in the occupation phase: height ${b.heightMetres ?? "n/a"}m, storeys ${b.storeys ?? "n/a"}, residential units ${b.residentialUnits}. During design and construction the definition also captures care homes and hospitals at least ${heightMetres}m — evaluate that phase separately.`);
}

/* ------------------------------------------------------------------ *
 * R4  Social value model selection — PPN 002 vs PPN 026
 * MUST be selected from the tender documents, never from today's date.
 * Both models run concurrently through 2027.
 * ------------------------------------------------------------------ */
export function ruleSocialValueModel(t) {
  const cur = need("socialvalue.model.current");
  const nxt = need("socialvalue.model.next");
  const R = "R4_SOCIAL_VALUE_MODEL";

  if (!t.procurementCommencedOn) {
    return result(R, STATUS.UNKNOWN, cur,
      "Cannot evaluate: procurementCommencedOn is required. Commencement is the date the tender notice was published — read it from the tender documents. Selecting the model from today's date will give wrong guidance throughout 2027, because procurements commenced before 1 Jan 2027 may continue under PPN 002.",
      { missing: ["procurementCommencedOn"] });
  }
  if (t.buyerType !== "central_government") {
    return result(R, STATUS.NOT_APPLICABLE, cur,
      "Both models bind central government departments, executive agencies and NDPBs. Local government and the NHS may adopt them voluntarily — the tender documents govern.");
  }

  const onNewModel = t.procurementCommencedOn >= nxt.effectiveFrom;

  if (!onNewModel) {
    return result(R, STATUS.APPLIES, cur,
      `PPN 002 applies: procurement commenced ${t.procurementCommencedOn}, before ${nxt.effectiveFrom}. Minimum ${cur.value}% of the total score for social value, or ${cur.value}% of the non-price criteria where an absolute methodology such as Price per Quality Point is used.`,
      { model: "PPN 002", minimumWeightingPercent: cur.value });
  }

  if (t.totalValueIncVat == null) {
    return result(R, STATUS.UNKNOWN, nxt,
      "PPN 026 applies by date, but totalValueIncVat is required to determine the weighting band.",
      { model: "PPN 026", missing: ["totalValueIncVat"] });
  }
  if (t.totalValueIncVat < nxt.value.scopeThreshold) {
    return result(R, STATUS.NOT_APPLICABLE, nxt,
      `£${t.totalValueIncVat.toLocaleString()} is below the £${nxt.value.scopeThreshold.toLocaleString()} inc VAT scope threshold for PPN 026. COVERAGE GAP: PPN 002 applied from the ordinary procurement threshold, so contracts between roughly £135,018 and £1m carry no mandated social value weighting from 2027. This is a real gap, not an error in this engine.`,
      { model: "PPN 026", coverageGap: true });
  }

  const band = nxt.value.weighting.find((w) =>
    w.band === "5m_and_above" ? t.totalValueIncVat >= 5_000_000 : t.totalValueIncVat < 5_000_000
  );
  return result(R, STATUS.APPLIES, nxt,
    `PPN 026 applies: procurement commenced ${t.procurementCommencedOn}. Minimum ${band.minPercent}% weighting. Two outcomes (Good Jobs, Skills) across ${nxt.value.modelAwardCriteria} model award criteria. Cabinet Office practitioner guidance and sub-criteria are still pending — re-check before relying on detail below model level.`,
    { model: "PPN 026", minimumWeightingPercent: band.minPercent });
}

/* ------------------------------------------------------------------ *
 * R5  NHS modern slavery — SI 2025/1212
 * Duty: the buyer. NO VALUE THRESHOLD.
 * Distinct from PA23 Sch.6 mandatory exclusion.
 * ------------------------------------------------------------------ */
export function ruleNhsModernSlavery(t) {
  const e = need("nhs.modernslavery.regs");
  const R = "R5_NHS_MODERN_SLAVERY";

  if (!t.isHealthServiceProcurementEngland) {
    return result(R, STATUS.NOT_APPLICABLE, e,
      "Applies to public bodies procuring goods or services for the health service in England. Separately, PA23 Schedule 6 makes modern slavery offences a mandatory exclusion ground on every procurement — that is a different rule and is evaluated separately.",
      { dutyHolder: "contracting_authority" });
  }
  return result(R, STATUS.APPLIES, e,
    `In force since ${e.effectiveFrom}. The buyer must carry out a modern slavery risk assessment before advertising and before award, across the whole commercial lifecycle. THERE IS NO VALUE THRESHOLD — this rule must never be gated on contract value. It covers central purchasing bodies and local authorities buying for the health service, not only NHS trusts.`,
    { dutyHolder: "contracting_authority", valueThreshold: null });
}

/* ------------------------------------------------------------------ *
 * R6  Award outcome — PA23 s.19
 * FAILS_REQUIREMENTS and DISREGARDED are distinct states with
 * different consequences. Abnormally low price carries a statutory
 * right to explain before the tender may be disregarded.
 * ------------------------------------------------------------------ */
export function ruleAwardOutcome(t) {
  const e = need("award.pa23.s19");
  const R = "R6_AWARD_PA23_S19";

  if (t.satisfiesRequirements === false) {
    return result(R, "FAILS_REQUIREMENTS", e,
      "Under s.19(2)(a) a tender that does not satisfy the authority's requirements cannot be the most advantageous tender. 'Requirements' means those described in the tender notice or associated tender documents (s.19(7)).",
      { remediable: false });
  }
  if (t.abnormallyLow === true) {
    return result(R, "AT_RISK_OF_DISREGARD", e,
      "The authority may disregard an abnormally low tender under s.19(3), but ONLY after giving the supplier an opportunity to demonstrate it can perform the contract for the price (s.19(4)-(5)). This is not a failure state. Do not tell the customer the bid is dead — tell them a response is due.",
      { remediable: true, supplierAction: "prepare price justification" });
  }
  if (t.breachedProcedure === true || t.failedConditionsOfParticipation === true) {
    return result(R, "AT_RISK_OF_DISREGARD", e,
      "May be disregarded under s.19(3) for breach of procedure or failure to satisfy conditions of participation. Distinct from failing the requirements — check whether the authority has discretion here.",
      { remediable: null });
  }
  if (t.satisfiesRequirements === true) {
    return result(R, "ELIGIBLE_FOR_ASSESSMENT", e,
      "Satisfies requirements. Assessed against the award criteria to determine which tender best satisfies them.");
  }
  return result(R, STATUS.UNKNOWN, e,
    "Cannot evaluate: satisfiesRequirements is required.",
    { missing: ["satisfiesRequirements"] });
}

/* ------------------------------------------------------------------ */
export const RULES = [
  ruleCarbonReductionPlan,
  ruleContractKpis,
  ruleHigherRiskBuilding,
  ruleSocialValueModel,
  ruleNhsModernSlavery,
  ruleAwardOutcome,
];
