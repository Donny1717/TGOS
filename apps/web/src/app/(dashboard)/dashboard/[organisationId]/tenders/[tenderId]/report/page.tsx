import Link from "next/link";
import { notFound } from "next/navigation";
import { TenderSubnav } from "@/components/tender-subnav";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";
import { evaluateEvidenceValidity } from "@/lib/evidence";
import { gateDecisionLabels, issueStateLabels, severityBadgeClass, sortIssuesBySeverity } from "@/lib/issues";

type PageProps = { params: Promise<{ organisationId: string; tenderId: string }> };

export default async function TenderReadinessReportPage({ params }: PageProps) {
  const { organisationId, tenderId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <article className="space-y-6">
        <Link href={`/dashboard/${organisationId}/tenders/${tenderId}/final-gate`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Final gate</Link>
        <h1 className="text-3xl font-semibold text-[var(--tgos-navy)]">Tender Readiness Report</h1>
        <p role="note" className="rounded-[10px] bg-[var(--tgos-info-bg)] px-4 py-3 text-sm">AI-assisted analysis. Human review and approval are required before tender submission.</p>
        <p className="text-sm text-[var(--tgos-muted)]">Demo preview only. Sign in to a real organisation for a live HTML report.</p>
      </article>
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
      .select("id, title, buyer_name, reference, submission_deadline, contract_start_date, description")
      .eq("id", tenderId)
      .eq("organisation_id", organisationId)
      .maybeSingle(),
    supabase.from("requirements").select("id, title, status, source_page, source_section").eq("tender_id", tenderId),
    supabase.from("evidence_items").select("id, title, expires_on, evidence_type").eq("tender_id", tenderId),
    supabase.from("requirement_evidence_links").select("requirement_id, evidence_item_id").eq("organisation_id", organisationId),
    supabase
      .from("issues")
      .select("id, title, severity, state, why_it_matters, citation_text, owner_name, due_on, accepted_risk_approver_name, accepted_risk_reason, accepted_risk_at")
      .eq("tender_id", tenderId)
      .eq("organisation_id", organisationId),
    supabase
      .from("tender_gate_approvals")
      .select("decision, system_decision, approver_name, comment, accepted_risk_issue_ids, created_at")
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
  const sortedIssues = sortIssuesBySeverity(issues ?? []);
  const criticalHigh = sortedIssues.filter((issue) => issue.severity === "critical" || issue.severity === "high");
  const openCritical = sortedIssues.filter((issue) => issue.severity === "critical" && issue.state !== "resolved" && issue.state !== "accepted_risk");
  const acceptedRisks = sortedIssues.filter((issue) => issue.state === "accepted_risk");
  const readiness =
    missing.length || validity.status === "fail" || openCritical.length
      ? "No-Go"
      : (requirements ?? []).length === 0
        ? "In progress"
        : acceptedRisks.length
          ? "Conditional Go"
          : "Go";
  const latestApproval = (approvals ?? [])[0] ?? null;

  return (
    <article className="space-y-6">
      <div className="print:hidden">
        <Link href={`/dashboard/${organisationId}/tenders/${tenderId}/final-gate`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Final gate</Link>
        <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="report" />
      </div>

      <header className="rounded-[12px] border border-[var(--tgos-border)] bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--tgos-subtle)]">Tender Readiness Report</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--tgos-navy)]">{tender.title}</h1>
        <p className="mt-2 text-sm text-[var(--tgos-muted)]">{tender.buyer_name}{tender.reference ? ` · Ref ${tender.reference}` : ""}</p>
        <p className="mt-4 text-lg font-semibold text-[var(--tgos-navy)]">Readiness decision: {readiness}</p>
        {latestApproval ? (
          <p className="mt-1 text-sm text-[var(--tgos-muted)]">
            Latest human approval: {gateDecisionLabels[latestApproval.decision] ?? latestApproval.decision} by {latestApproval.approver_name} on {new Date(latestApproval.created_at).toLocaleString("en-GB")}
          </p>
        ) : (
          <p className="mt-1 text-sm text-[var(--tgos-muted)]">No human approval recorded yet.</p>
        )}
        <p className="mt-4 rounded-[10px] bg-[var(--tgos-info-bg)] px-4 py-3 text-sm text-[var(--tgos-primary)]" role="note">
          AI-assisted analysis. Human review and approval are required before tender submission.
        </p>
      </header>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">1. Tender summary</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-[var(--tgos-subtle)]">Buyer</dt><dd className="font-semibold">{tender.buyer_name}</dd></div>
          <div><dt className="text-[var(--tgos-subtle)]">Submission deadline</dt><dd className="font-semibold">{tender.submission_deadline ? new Date(tender.submission_deadline).toLocaleString("en-GB") : "Not set"}</dd></div>
          <div><dt className="text-[var(--tgos-subtle)]">Contract start</dt><dd className="font-semibold">{tender.contract_start_date ? new Date(tender.contract_start_date).toLocaleDateString("en-GB") : "Not set"}</dd></div>
          <div><dt className="text-[var(--tgos-subtle)]">Description</dt><dd>{tender.description || "—"}</dd></div>
        </dl>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">2. Readiness decision and disclaimer</h2>
        <p className="mt-2 text-sm">System advisory decision: <strong>{readiness}</strong>. This report does not submit the tender.</p>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">3. Deadline and submission details</h2>
        <p className="mt-2 text-sm">Deadline: {tender.submission_deadline ? new Date(tender.submission_deadline).toLocaleString("en-GB") : "Not set"}.</p>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">4. Mandatory requirements status</h2>
        <p className="mt-2 text-sm">Requirements with linked evidence: {covered} / {(requirements ?? []).length}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {(requirements ?? []).map((requirement) => {
            const hasEvidence = (linked.get(requirement.id)?.size ?? 0) > 0;
            return (
              <li key={requirement.id} className="flex justify-between gap-3">
                <span>{requirement.title} (p.{requirement.source_page}, {requirement.source_section})</span>
                <span className={hasEvidence ? "font-semibold text-[var(--tgos-primary)]" : "font-semibold text-[var(--tgos-critical)]"}>{hasEvidence ? "Evidence linked" : "Missing evidence"}</span>
              </li>
            );
          })}
          {(requirements ?? []).length === 0 ? <li className="text-[var(--tgos-muted)]">No requirements recorded.</li> : null}
        </ul>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">5. Critical and high-risk issues</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {criticalHigh.length === 0 ? (
            <li className="text-[var(--tgos-muted)]">No critical or high-risk issues.</li>
          ) : (
            criticalHigh.map((issue) => (
              <li key={issue.id}>
                <span className={`mr-2 rounded-full px-2 py-1 text-xs font-bold capitalize ${severityBadgeClass(issue.severity)}`}>{issue.severity}</span>
                <strong>{issue.title}</strong> — {issue.why_it_matters} ({issueStateLabels[issue.state]})
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">6. Evidence validity and gaps</h2>
        <p className="mt-2 text-sm capitalize">Validity check: <strong>{validity.status}</strong>{validity.message ? ` — ${validity.message}` : ""}</p>
        <ul className="mt-3 space-y-1 text-sm">
          {(evidence ?? []).map((item) => (
            <li key={item.id}>{item.title} ({item.evidence_type}){item.expires_on ? ` · expires ${new Date(item.expires_on).toLocaleDateString("en-GB")}` : ""}</li>
          ))}
          {(evidence ?? []).length === 0 ? <li className="text-[var(--tgos-muted)]">No evidence items.</li> : null}
        </ul>
        {missing.length ? (
          <p className="mt-3 text-sm text-[var(--tgos-critical)]">Gaps: {missing.map((item) => item.title).join("; ")}</p>
        ) : null}
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">7. Requirement progress</h2>
        <p className="mt-2 text-sm">{covered} of {(requirements ?? []).length} requirements have at least one evidence link.</p>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">8. Human approvals and accepted risks</h2>
        <h3 className="mt-3 text-base font-semibold">Approvals</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {(approvals ?? []).length === 0 ? (
            <li className="text-[var(--tgos-muted)]">None recorded.</li>
          ) : (
            (approvals ?? []).map((approval, index) => (
              <li key={`${approval.created_at}-${index}`}>
                {gateDecisionLabels[approval.decision] ?? approval.decision} by {approval.approver_name} on {new Date(approval.created_at).toLocaleString("en-GB")}
                {approval.comment ? ` — ${approval.comment}` : ""}
              </li>
            ))
          )}
        </ul>
        <h3 className="mt-4 text-base font-semibold">Accepted risks</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {acceptedRisks.length === 0 ? (
            <li className="text-[var(--tgos-muted)]">None recorded.</li>
          ) : (
            acceptedRisks.map((issue) => (
              <li key={issue.id}>
                {issue.title}: accepted by {issue.accepted_risk_approver_name} on {issue.accepted_risk_at ? new Date(issue.accepted_risk_at).toLocaleString("en-GB") : "—"} — {issue.accepted_risk_reason}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">9. Source citations and audit information</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(requirements ?? []).map((requirement) => (
            <li key={requirement.id}>Requirement “{requirement.title}”: page {requirement.source_page}, section {requirement.source_section}</li>
          ))}
          {sortedIssues.filter((issue) => issue.citation_text).map((issue) => (
            <li key={issue.id}>Issue “{issue.title}”: {issue.citation_text}</li>
          ))}
          {(requirements ?? []).length === 0 && sortedIssues.every((issue) => !issue.citation_text) ? (
            <li className="text-[var(--tgos-muted)]">No citations recorded yet.</li>
          ) : null}
        </ul>
        <p className="mt-3 text-xs text-[var(--tgos-subtle)]">Generated from live TGOS workspace data. Gate and issue changes are also written to organisation audit events.</p>
      </section>
    </article>
  );
}
