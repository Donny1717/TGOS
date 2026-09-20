import Link from "next/link";
import { notFound } from "next/navigation";
import { recordGateApproval } from "@/app/actions";
import { TenderSubnav } from "@/components/tender-subnav";
import { requireOrganisationMembership } from "@/lib/auth";
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

export default async function FinalGatePage({ params }: PageProps) {
  const { organisationId, tenderId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <section className="space-y-6">
        <div>
          <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Overview</Link>
          <div className="mt-4 rounded-[12px] bg-[var(--tgos-navy)] p-6 text-white">
            <h1 className="text-3xl font-semibold">Final Submission Gate</h1>
            <p className="mt-2 text-white/80">Demo Borough / Westshire tender preview</p>
            <p className="mt-4 text-lg font-bold">Overall decision: No-Go</p>
          </div>
        </div>
        <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="final-gate" />
        <p className="rounded-[10px] bg-[var(--tgos-info-bg)] px-4 py-3 text-sm text-[var(--tgos-primary)]" role="note">AI-assisted analysis. Human review and approval are required before tender submission.</p>
        <p className="text-sm text-[var(--tgos-muted)]">Sign in to a real organisation to record human approval.</p>
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
    supabase.from("tenders").select("id, title, buyer_name, contract_start_date, submission_deadline").eq("id", tenderId).eq("organisation_id", organisationId).maybeSingle(),
    supabase.from("requirements").select("id, title, status").eq("tender_id", tenderId),
    supabase.from("evidence_items").select("id, title, expires_on").eq("tender_id", tenderId),
    supabase.from("requirement_evidence_links").select("requirement_id, evidence_item_id").eq("organisation_id", organisationId),
    supabase.from("issues").select("id, title, severity, state, why_it_matters").eq("tender_id", tenderId).eq("organisation_id", organisationId),
    supabase.from("tender_gate_approvals").select("id, decision, system_decision, approver_name, comment, accepted_risk_issue_ids, created_at").eq("tender_id", tenderId).eq("organisation_id", organisationId).order("created_at", { ascending: false }),
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
  const openCritical = (issues ?? []).filter((issue) => issue.severity === "critical" && issue.state !== "resolved" && issue.state !== "accepted_risk");
  const acceptedRiskIssues = (issues ?? []).filter((issue) => issue.state === "accepted_risk");
  const decision =
    missing.length || validity.status === "fail" || openCritical.length
      ? "No-Go"
      : missing.length === 0 && (requirements ?? []).length > 0 && validity.status === "pass" && openCritical.length === 0
        ? acceptedRiskIssues.length
          ? "Conditional Go"
          : "Go"
        : (requirements ?? []).length === 0
          ? "In progress"
          : "Conditional Go";
  const sortedIssues = sortIssuesBySeverity(issues ?? []);

  return (
    <section className="space-y-6">
      <div>
        <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Overview</Link>
        <div className="mt-4 rounded-[12px] bg-[var(--tgos-navy)] p-6 text-white">
          <h1 className="text-3xl font-semibold">Final Submission Gate</h1>
          <p className="mt-2 text-white/80">{tender.title} — {tender.buyer_name}</p>
          <p className="mt-4 text-lg font-bold">Overall decision: {decision}</p>
          <p className="mt-2 text-sm text-white/75">
            {decision === "No-Go"
              ? "Critical blockers remain and must be resolved or formally accepted by an authorised approver."
              : decision === "Go"
                ? "No known critical blockers from current evidence links and issues. Final human approval is still required."
                : decision === "Conditional Go"
                  ? "Non-critical or accepted-risk items remain. Human decision required."
                  : "Not enough confirmed coverage for a clear Go."}
          </p>
        </div>
      </div>
      <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="final-gate" />
      <p className="rounded-[10px] bg-[var(--tgos-info-bg)] px-4 py-3 text-sm text-[var(--tgos-primary)]" role="note">AI-assisted analysis. Human review and approval are required before tender submission.</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4"><p className="text-sm text-[var(--tgos-subtle)]">Requirements with evidence</p><p className="mt-2 text-xl font-semibold">{covered} / {(requirements ?? []).length}</p></div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4"><p className="text-sm text-[var(--tgos-subtle)]">Open critical issues</p><p className="mt-2 text-xl font-semibold">{openCritical.length}</p></div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4"><p className="text-sm text-[var(--tgos-subtle)]">Evidence validity check</p><p className="mt-2 text-xl font-semibold capitalize">{validity.status}</p></div>
      </div>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">1. Critical blockers</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {missing.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>{item.title} — no linked evidence</span>
              <span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Blocked</span>
            </li>
          ))}
          {openCritical.map((issue) => (
            <li key={issue.id} className="flex justify-between gap-3">
              <span>{issue.title}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${severityBadgeClass(issue.severity)}`}>{issueStateLabels[issue.state]}</span>
            </li>
          ))}
          {validity.status === "fail" ? (
            <li className="flex justify-between gap-3">
              <span>{validity.message}</span>
              <span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Blocked</span>
            </li>
          ) : null}
          {missing.length === 0 && openCritical.length === 0 && validity.status !== "fail" ? (
            <li className="text-[var(--tgos-muted)]">No critical blockers from current requirement/evidence links and open critical issues.</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">2. High-risk and other issues</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {sortedIssues.filter((issue) => issue.severity !== "critical" || issue.state === "accepted_risk" || issue.state === "resolved").length === 0 ? (
            <li className="text-[var(--tgos-muted)]">No additional issues recorded.</li>
          ) : (
            sortedIssues
              .filter((issue) => !(issue.severity === "critical" && issue.state !== "resolved" && issue.state !== "accepted_risk"))
              .map((issue) => (
                <li key={issue.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>{issue.title} — {issue.why_it_matters}</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${severityBadgeClass(issue.severity)}`}>{issue.severity} · {issueStateLabels[issue.state]}</span>
                </li>
              ))
          )}
        </ul>
      </section>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Human approval</h2>
        <p className="mt-2 text-sm text-[var(--tgos-muted)]">Records approver identity, decision, date/time, optional comment and accepted-risk references. This does not submit to a buyer portal.</p>
        <form action={recordGateApproval.bind(null, tenderId, organisationId)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="systemDecision" value={systemDecisionKey(decision)} />
          <div>
            <label className="text-sm font-semibold" htmlFor="approverName">Approver name</label>
            <input id="approverName" name="approverName" required className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3" />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="decision">Human decision</label>
            <select id="decision" name="decision" defaultValue={systemDecisionKey(decision)} className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3">
              {Object.entries(gateDecisionLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold" htmlFor="comment">Comment (optional)</label>
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
            <button type="submit" className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">Record approval</button>
            <Link href={`/dashboard/${organisationId}/tenders/${tenderId}/issues`} className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border-strong)] px-4 text-sm font-semibold">Assign actions</Link>
            <Link href={`/dashboard/${organisationId}/tenders/${tenderId}/report`} className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border)] px-4 text-sm font-semibold">Download readiness report</Link>
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
                  <p className="font-semibold">{gateDecisionLabels[approval.decision] ?? approval.decision} by {approval.approver_name}</p>
                  <p className="text-[var(--tgos-subtle)]">{new Date(approval.created_at).toLocaleString("en-GB")} · system suggested {approval.system_decision ? gateDecisionLabels[approval.system_decision] ?? approval.system_decision : "—"}</p>
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
