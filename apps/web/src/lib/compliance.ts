/**
 * Server-side compliance evaluation for TGOS (document checking / PA23).
 * Does not create documents. Buyer duties never become supplier tasks.
 */

import { evaluateAllRules, STATUS } from "@tgos/rules-engine";

export type TenderComplianceInput = {
  buyerType?: "central_government" | "sub_central" | "other" | null;
  annualValueIncVat?: number | null;
  contractYears?: number | null;
  totalValueIncVat?: number | null;
  vatBasis?: "inclusive" | "exclusive" | null;
  procurementCommencedOn?: string | null;
  isHealthServiceProcurementEngland?: boolean;
  satisfiesRequirements?: boolean | null;
  abnormallyLow?: boolean | null;
  breachedProcedure?: boolean | null;
  failedConditionsOfParticipation?: boolean | null;
};

export type BuildingComplianceInput = {
  heightMetres?: number | null;
  storeys?: number | null;
  residentialUnits?: number | null;
} | null;

export type RuleResult = {
  rule: string;
  status: string;
  dutyHolder: string | null;
  detail: string;
  basis: string | null;
  sources: string[];
  missing?: string[];
  supplierAction?: string;
  remediable?: boolean | null;
  [key: string]: unknown;
};

export type ComplianceSummary = {
  results: RuleResult[];
  /** Hard block for final gate (e.g. FAILS_REQUIREMENTS). */
  hardBlocks: RuleResult[];
  /** Supplier-facing obligations indicated (APPLIES + duty supplier). */
  supplierObligations: RuleResult[];
  /** Buyer-only intelligence — never listed as supplier tasks. */
  buyerIntelligence: RuleResult[];
  /** Incomplete inputs — product must not invent values. */
  unknowns: RuleResult[];
  /** Elevated risk (e.g. abnormally low) — not automatic No-Go. */
  atRisk: RuleResult[];
};

export function summariseCompliance(
  tender: TenderComplianceInput,
  building: BuildingComplianceInput = null,
): ComplianceSummary {
  const results = evaluateAllRules(tender, building) as RuleResult[];

  const hardBlocks = results.filter((r) => r.status === "FAILS_REQUIREMENTS");
  const atRisk = results.filter((r) => r.status === "AT_RISK_OF_DISREGARD");
  const unknowns = results.filter((r) => r.status === STATUS.UNKNOWN);
  const supplierObligations = results.filter(
    (r) => r.status === STATUS.APPLIES && r.dutyHolder === "supplier",
  );
  const buyerIntelligence = results.filter(
    (r) =>
      r.status === STATUS.APPLIES &&
      (r.dutyHolder === "contracting_authority" || r.supplierAction === "none"),
  );

  return {
    results,
    hardBlocks,
    supplierObligations,
    buyerIntelligence,
    unknowns,
    atRisk,
  };
}

/** Demo / empty tender: all unknowns until values are recorded — honest, not invented. */
export function emptyTenderComplianceInput(): TenderComplianceInput {
  return {
    buyerType: null,
    annualValueIncVat: null,
    contractYears: null,
    totalValueIncVat: null,
    vatBasis: null,
    procurementCommencedOn: null,
    isHealthServiceProcurementEngland: false,
    satisfiesRequirements: null,
    abnormallyLow: null,
  };
}

/** Sample central-gov tender above CRP trigger for demo Final Gate. */
export function demoTenderComplianceInput(): TenderComplianceInput {
  return {
    buyerType: "central_government",
    annualValueIncVat: 5_000_001,
    contractYears: 3,
    totalValueIncVat: 15_000_003,
    vatBasis: "inclusive",
    procurementCommencedOn: "2026-06-01",
    isHealthServiceProcurementEngland: false,
    satisfiesRequirements: true,
    abnormallyLow: false,
  };
}

export function statusBadgeClass(status: string) {
  if (status === "FAILS_REQUIREMENTS" || status === "APPLIES") {
    return "bg-[var(--tgos-critical-bg)] text-[var(--tgos-critical)]";
  }
  if (status === "AT_RISK_OF_DISREGARD" || status === "UNKNOWN") {
    return "bg-[var(--tgos-warning-bg)] text-[var(--tgos-warning)]";
  }
  if (status === "ELIGIBLE_FOR_ASSESSMENT") {
    return "bg-[var(--tgos-info-bg)] text-[var(--tgos-primary)]";
  }
  return "bg-[var(--tgos-surface)] text-[var(--tgos-muted)]";
}

export function ruleTitle(ruleId: string) {
  const map: Record<string, string> = {
    R1_CRP_PPN006: "Carbon Reduction Plan (PPN 006)",
    R2_KPI_PA23_S52: "Contract KPIs (PA23 s.52)",
    R3_BSA_HRB: "Higher-risk building (BSA)",
    R4_SOCIAL_VALUE_MODEL: "Social value model",
    R5_NHS_MODERN_SLAVERY: "NHS modern slavery (buyer duty)",
    R6_AWARD_PA23_S19: "Award outcome (PA23 s.19)",
  };
  return map[ruleId] ?? ruleId;
}
