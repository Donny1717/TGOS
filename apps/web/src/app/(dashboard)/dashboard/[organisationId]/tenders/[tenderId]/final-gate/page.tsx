import Link from "next/link";
import { notFound } from "next/navigation";
import { recordGateApproval } from "@/app/actions";
import { TenderSubnav } from "@/components/tender-subnav";
import { requireOrganisationMembership } from "@/lib/auth";
import {
  demoTenderComplianceInput,
  emptyTenderComplianceInput,
  ruleTitle,
  statusBadgeClass,
  summariseCompliance,
  type ComplianceSummary,
  type TenderComplianceInput,
} from "@/lib/compliance";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";
import { evaluateEvidenceValidity } from "@/lib/evidence";
import { gateDecisionLabels, issueStateLabels, severityBadgeClass, sortIssuesBySeverity } from "@/lib/issues";

type PageProps = { params: Promise<{ organisationId: string; tenderId: string }> };

function systemDecisionKey(label: string) {
  if (label === "Go") return "go";
  if (label === "Conditional Go") return "conditional_go";
  if (label === "No-Go") return "no_go";
  return "in_progress";
}

function ComplianceRulesPanel({ summary }: { summary: ComplianceSummary }) {
  return (
    <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
      <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Procurement Act 2023 / related rules</h2>
      <p className="mt-2 text-sm text-[var(--tgos-muted)]">
        Thresholds and legal bases come from the regulated dataset only. Missing inputs return UNKNOWN — the product does not invent values.
        Buyer duties are shown as intelligence, never as supplier tasks.
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {summary.results.map((r) => (
          <li key={r.rule} className="rounded-[10px] border border-[var(--tgos-border)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[var(--tgos-navy)]">{ruleTitle(r.rule)}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusBadgeClass(r.status)}`}>{r.status}</span>
            </div>
            {r.dutyHolder ? (
              <p className="mt-1 text-xs text-[var(--tgos-subtle)]">
                Duty holder: {r.dutyHolder === "contracting_authority" ? "contracting authority (buyer)" : r.dutyHolder}
                {r.supplierAction === "none" ? " · not a supplier task" : ""}
              </p>
            ) : null}
            <p className="mt-2 text-[var(--tgos-muted)]">{r.detail}</p>
            {r.missing?.length ? (
              <p className="mt-1 text-xs font-semibold text-[var(--tgos-warning)]">Missing inputs: {r.missing.join(", ")}</p>
            ) : null}
            {r.basis ? <p className="mt-1 text-xs text-[var(--tgos-subtle)]">Basis: {r.basis}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function FinalGatePage({ params }: PageProps) {
  const { organisationId, tenderId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    const summary = summariseCompliance(demoTenderComplianceInput());
    const decision =
      summary.hardBlocks.length > 0
        ? "No-Go"
        : summary.supplierObligations.length > 0 || summary.atRisk.length > 0 || summary.unknowns.length > 0
          ? "Conditional Go"
          : "Go";

    return (
      <section className="space-y-6">
        <div>
          <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">
            ← Overview
          </Link>
          <div className="mt-4 rounded-[12px] bg-[var(--tgos-navy)] p-6 text-white">
            <h1 className="text-3xl font-semibold">Final Submission Gate</h1>
            <p className="mt-2 text-white/80">Demo Borough / Westshire tender preview</p>
            <p className="mt-4 text-lg font-bold">Overall decision: {decision}</p>
            <p className="mt-2 text-sm text-white/75">
              Demo uses sample central-government values so PA23/PPN rules can evaluate. Sign in to a real organisation for live evidence and approvals.
            </p>
          </div>
        </div>
        <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="final-gate" />
        <p className="rounded-[10px] bg-[var(--tgos-info-bg)] px-4 py-3 text-sm text-[var(--tgos-primary)]" role="note">
          Document checking only. Human review and approval are required before tender submission. TGOS does not create submission documents.
        </p>
        <ComplianceRulesPanel summary={summary} />
        <p className="text-sm text-[var(--tgos-muted)]">Sign in to a real organisation to record human approval and link live evidence.</p>
      </section>
    );
  }

  const { supabase } = await requireOrganisationMembership(organisationId);
  const [
    { data: tender },
    { data: requirements },
    { data: evidence },
    { data: evidenceLinks },
    { data: issues },
    { data: approvals },
  ] = await Promise.all([
    supabase
      .from("tenders")
      .select(
        "id, title, buyer_name, contract_start_date, submission_deadline, buyer_type, annual_value_inc_vat, contract_years, total_value_inc_vat, vat_basis, procurement_commenced_on, is_health_service_procurement_england",
      )
      .eq("id", tenderId)
      .eq("organisation_id", organisationId)
      .maybeSingle(),
    supabase.from("requirements").select("id, title, status").eq("tender_id", tenderId),
    supabase.from("evidence_items").select("id, title, expires_on").eq("tender_id", tenderId),
    supabase.from("requirement_evidence_links").select("requirement_id, evidence_item_id").eq("organisation_id", organisationId),
    supabase.from("issues").select("id, title, severity, state, why_it_matters").eq("tender_id", tenderId).eq("organisation_id", organisationId),
    supabase
      .from("tender_gate_approvals")
      .select("id, decision, system_decision, approver_name, comment, accepted_risk_issue_ids, created_at")
      .eq("tender_id", tenderId)
      .eq("organisation_id", organisationId)
      .order("created_at", { ascending: false }),
  ]);
  if (!tender) notFound();

  const linked = new Map<string, Set<string>>();
  (evidenceLinks ?? []).forEach((link) => {
    const set = linked.get(link.requirement_id) ?? new Set<string>();
    set.add(link.evidence_item_id);
    linked.set(link.requirement_id, set);
  });
  const missing = (requirements ?? []).filter((item) => (linked.get(item.id)?.size ?? 0) === 0);
  const covered = (requirements ?? []).length - missing.length;
  const validity = evaluateEvidenceValidity(evidence ?? [], tender.contract_start_date);
  const openCritical = (issues ?? []).filter(
    (issue) => issue.severity === "critical" && issue.state !== "resolved" && issue.state !== "accepted_risk",
  );
  const acceptedRiskIssues = (issues ?? []).filter((issue) => issue.state === "accepted_risk");

  const ruleInput: TenderComplianceInput = {
    buyerType: (tender as { buyer_type?: string | null }).buyer_type as TenderComplianceInput["buyerType"],
    annualValueIncVat: (tender as { annual_value_inc_vat?: number | null }).annual_value_inc_vat ?? null,
    contractYears: (tender as { contract_years?: number | null }).contract_years ?? null,
    totalValueIncVat: (tender as { total_value_inc_vat?: number | null }).total_value_inc_vat ?? null,
    vatBasis: (tender as { vat_basis?: "inclusive" | "exclusive" | null }).vat_basis ?? null,
    procurementCommencedOn: (tender as { procurement_commenced_on?: string | null }).procurement_commenced_on ?? null,
    isHealthServiceProcurementEngland: Boolean(
      (tender as { is_health_service_procurement_england?: boolean }).is_health_service_procurement_england,
    ),
    satisfiesRequirements: null,
    abnormallyLow: null,
  };

  // If migration not applied yet, columns may be absent — fall back to empty (honest UNKNOWN).
  const compliance =
    ruleInput.buyerType != null || ruleInput.totalValueIncVat != null || ruleInput.annualValueIncVat != null
      ? summariseCompliance(ruleInput)
      : summariseCompliance(emptyTenderComplianceInput());

  const decision =
    missing.length || validity.status === "fail" || openCritical.length || compliance.hardBlocks.length
      ? "No-Go"
      : missing.length === 0 &&
          (requirements ?? []).length > 0 &&
          validity.status === "pass" &&
          openCritical.length === 0 &&
          compliance.hardBlocks.length === 0
        ? acceptedRiskIssues.length || compliance.supplierObligations.length || compliance.atRisk.length
          ? "Conditional Go"
          : "Go"
        : (requirements ?? []).length === 0
          ? "In progress"
          : "Conditional Go";
  const sortedIssues = sortIssuesBySeverity(issues ?? []);

  return (
    <section className="space-y-6">
      <div>
        <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">
          ← Overview
        </Link>
        <div className="mt-4 rounded-[12px] bg-[var(--tgos-navy)] p-6 text-white">
          <h1 className="text-3xl font-semibold">Final Submission Gate</h1>
          <p className="mt-2 text-white/80">
            {tender.title} — {tender.buyer_name}
          </p>
          <p className="mt-4 text-lg font-bold">Overall decision: {decision}</p>
          <p className="mt-2 text-sm text-white/75">
            {decision === "No-Go"
              ? "Critical blockers remain (evidence gaps, issues, or hard compliance fails) and must be resolved or formally accepted by an authorised approver."
              : decision === "Go"
                ? "No known critical blockers from current evidence links, issues, and PA23 hard fails. Final human approval is still required."
                : decision === "Conditional Go"
                  ? "Non-critical, accepted-risk, or supplier obligations remain. Human decision required."
                  : "Not enough confirmed coverage for a clear Go."}
          </p>
        </div>
      </div>
      <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="final-gate" />
      <p className="rounded-[10px] bg-[var(--tgos-info-bg)] px-4 py-3 text-sm text-[var(--tgos-primary)]" role="note">
        Document checking only. Human review and approval are required before tender submission. TGOS does not create submission documents.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
          <p className="text-sm text-[var(--tgos-subtle)]">Requirements with evidence</p>
          <p className="mt-2 text-xl font-semibold">
            {covered} / {(requirements ?? []).length}
          </p>
        </div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
          <p className="text-sm text-[var(--tgos-subtle)]">Open critical issues</p>
          <p className="mt-2 text-xl font-semibold">{openCritical.length}</p>
        </div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
          <p className="text-sm text-[var(--tgos-subtle)]">Evidence validity check</p>
          <p className="mt-2 text-xl font-semibold capitalize">{validity.status}</p>
        </div>
      </div>

      <ComplianceRulesPanel summary={compliance} />

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">1. Critical blockers</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {compliance.hardBlocks.map((r) => (
            <li key={r.rule} className="flex justify-between gap-3">
              <span>
                {ruleTitle(r.rule)} — {r.detail}
              </span>
              <span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Blocked</span>
            </li>
          ))}
          {missing.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>{item.title} — no linked evidence</span>
              <span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Blocked</span>
            </li>
          ))}
          {openCritical.map((issue) => (
            <li key={issue.id} className="flex justify-between gap-3">
              <span>{issue.title}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${severityBadgeClass(issue.severity)}`}>
                {issueStateLabels[issue.state]}
              </span>
            </li>
          ))}
          {validity.status === "fail" ? (
            <li className="flex justify-between gap-3">
              <span>{validity.message}</span>
              <span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Blocked</span>
            </li>
          ) : null}
          {missing.length === 0 &&
          openCritical.length === 0 &&
          validity.status !== "fail" &&
          compliance.hardBlocks.length === 0 ? (
            <li className="text-[var(--tgos-muted)]">No critical blockers from evidence links, open critical issues, or PA23 hard fails.</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">2. High-risk and other issues</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {sortedIssues.filter(
            (issue) => issue.severity !== "critical" || issue.state === "accepted_risk" || issue.state === "resolved",
          ).length === 0 ? (
            <li className="text-[var(--tgos-muted)]">No additional issues recorded.</li>
          ) : (
            sortedIssues
              .filter((issue) => !(issue.severity === "critical" && issue.state !== "resolved" && issue.state !== "accepted_risk"))
              .map((issue) => (
                <li key={issue.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {issue.title} — {issue.why_it_matters}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${severityBadgeClass(issue.severity)}`}>
                    {issue.severity} · {issueStateLabels[issue.state]}
                  </span>
                </li>
              ))
          )}
        </ul>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Human approval</h2>
        <p className="mt-2 text-sm text-[var(--tgos-muted)]">
          Records approver identity, decision, date/time, optional comment and accepted-risk references. This does not submit to a buyer portal and does not generate documents.
        </p>
        <form action={recordGateApproval.bind(null, tenderId, organisationId)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="systemDecision" value={systemDecisionKey(decision)} />
          <div>
            <label className="text-sm font-semibold" htmlFor="approverName">
              Approver name
            </label>
            <input
              id="approverName"
              name="approverName"
              required
              className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="decision">
              Human decision
            </label>
            <select
              id="decision"
              name="decision"
              defaultValue={systemDecisionKey(decision)}
              className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3"
            >
              {Object.entries(gateDecisionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold" htmlFor="comment">
              Comment (optional)
            </label>
            <textarea id="comment" name="comment" rows={3} className="mt-1 w-full rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold">Accepted-risk references</legend>
            <div className="mt-2 space-y-2">
              {acceptedRiskIssues.length === 0 ? (
                <p className="text-sm text-[var(--tgos-muted)]">No accepted-risk issues on this tender yet.</p>
              ) : (
                acceptedRiskIssues.map((issue) => (
                  <label key={issue.id} className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="checkbox" name="acceptedRiskIssueIds" value={issue.id} defaultChecked />
                    <span>{issue.title}</span>
                  </label>
                ))
              )}
            </div>
          </fieldset>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white"
            >
              Record approval
            </button>
            <Link
              href={`/dashboard/${organisationId}/tenders/${tenderId}/issues`}
              className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border-strong)] px-4 text-sm font-semibold"
            >
              Assign actions
            </Link>
            <Link
              href={`/dashboard/${organisationId}/tenders/${tenderId}/report`}
              className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border)] px-4 text-sm font-semibold"
            >
              Download readiness report
            </Link>
          </div>
        </form>

        <div className="mt-6 border-t border-[var(--tgos-border)] pt-4">
          <h3 className="text-base font-semibold text-[var(--tgos-navy)]">Approval history</h3>
          {(approvals ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-[var(--tgos-muted)]">No human approvals recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {(approvals ?? []).map((approval) => (
                <li key={approval.id} className="rounded-[10px] border border-[var(--tgos-border)] p-3">
                  <p className="font-semibold">
                    {gateDecisionLabels[approval.decision] ?? approval.decision} by {approval.approver_name}
                  </p>
                  <p className="text-[var(--tgos-subtle)]">
                    {new Date(approval.created_at).toLocaleString("en-GB")} · system suggested{" "}
                    {approval.system_decision ? gateDecisionLabels[approval.system_decision] ?? approval.system_decision : "—"}
                  </p>
                  {approval.comment ? <p className="mt-1 text-[var(--tgos-muted)]">{approval.comment}</p> : null}
                  {(approval.accepted_risk_issue_ids?.length ?? 0) > 0 ? (
                    <p className="mt-1 text-xs text-[var(--tgos-subtle)]">Accepted-risk refs: {approval.accepted_risk_issue_ids.length}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </section>
  );
}
