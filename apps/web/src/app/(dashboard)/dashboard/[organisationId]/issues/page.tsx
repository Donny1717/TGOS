import Link from "next/link";
import { createIssue, updateIssueState } from "@/app/actions";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";
import { issueStateLabels, severityBadgeClass, sortIssuesBySeverity } from "@/lib/issues";

type PageProps = { params: Promise<{ organisationId: string }> };

export default async function IssuesPage({ params }: PageProps) {
  const { organisationId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Issues</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--tgos-muted)]">Corrective actions sorted by severity. Demo preview.</p>
        </div>
        <div className="overflow-x-auto rounded-[10px] border border-[var(--tgos-border)] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--tgos-border)] bg-[var(--tgos-surface)] text-[var(--tgos-subtle)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Issue</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">State</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--tgos-border)]">
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${severityBadgeClass("critical")}`}>Critical</span></td>
                <td className="px-4 py-3">Public Liability Insurance shortfall</td>
                <td className="px-4 py-3">Alex Bid Lead</td>
                <td className="px-4 py-3">18 Sep 2026</td>
                <td className="px-4 py-3">Open</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${severityBadgeClass("high")}`}>High</span></td>
                <td className="px-4 py-3">Carbon Reduction Plan missing</td>
                <td className="px-4 py-3">Sam Compliance</td>
                <td className="px-4 py-3">20 Sep 2026</td>
                <td className="px-4 py-3">In progress</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  const { supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: issues }, { data: tenders }, { data: requirements }] = await Promise.all([
    supabase
      .from("issues")
      .select("id, title, why_it_matters, severity, state, owner_name, due_on, recommended_action, citation_text, tender_id, requirement_id, accepted_risk_approver_name, accepted_risk_reason, accepted_risk_at")
      .eq("organisation_id", organisationId),
    supabase.from("tenders").select("id, title").eq("organisation_id", organisationId).order("title"),
    supabase.from("requirements").select("id, title, tender_id").eq("organisation_id", organisationId),
  ]);

  const tenderTitle = new Map((tenders ?? []).map((t) => [t.id, t.title]));
  const requirementTitle = new Map((requirements ?? []).map((r) => [r.id, r.title]));
  const sorted = sortIssuesBySeverity(issues ?? []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Issues</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--tgos-muted)]">Corrective actions sorted by severity. Accepted risk requires a named approver, reason and timestamp.</p>
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-[var(--tgos-border)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--tgos-border)] bg-[var(--tgos-surface)] text-[var(--tgos-subtle)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Severity</th>
              <th className="px-4 py-3 font-semibold">Tender</th>
              <th className="px-4 py-3 font-semibold">Issue</th>
              <th className="px-4 py-3 font-semibold">Requirement</th>
              <th className="px-4 py-3 font-semibold">Citation</th>
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-4 py-3 font-semibold">Due</th>
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 font-semibold">Update</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-[var(--tgos-muted)]">No issues yet. Create one below or open a tender Final Gate and assign actions.</td>
              </tr>
            ) : (
              sorted.map((issue) => (
                <tr key={issue.id} className="border-b border-[var(--tgos-border)] align-top">
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${severityBadgeClass(issue.severity)}`}>{issue.severity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-[var(--tgos-primary)]" href={`/dashboard/${organisationId}/tenders/${issue.tender_id}/issues`}>
                      {tenderTitle.get(issue.tender_id) ?? "Tender"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--tgos-navy)]">{issue.title}</p>
                    <p className="mt-1 text-[var(--tgos-muted)]">{issue.why_it_matters}</p>
                    {issue.recommended_action ? <p className="mt-1 text-[var(--tgos-subtle)]">Action: {issue.recommended_action}</p> : null}
                    {issue.state === "accepted_risk" ? (
                      <p className="mt-1 text-xs text-[var(--tgos-muted)]">
                        Accepted by {issue.accepted_risk_approver_name} on {issue.accepted_risk_at ? new Date(issue.accepted_risk_at).toLocaleString("en-GB") : "—"}: {issue.accepted_risk_reason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{issue.requirement_id ? requirementTitle.get(issue.requirement_id) ?? "—" : "—"}</td>
                  <td className="px-4 py-3">{issue.citation_text || "—"}</td>
                  <td className="px-4 py-3">{issue.owner_name || "—"}</td>
                  <td className="px-4 py-3">{issue.due_on ? new Date(issue.due_on).toLocaleDateString("en-GB") : "—"}</td>
                  <td className="px-4 py-3">{issueStateLabels[issue.state] ?? issue.state}</td>
                  <td className="px-4 py-3">
                    <form action={updateIssueState.bind(null, organisationId, issue.tender_id)} className="space-y-2">
                      <input type="hidden" name="issueId" value={issue.id} />
                      <label className="block text-xs font-semibold text-[var(--tgos-subtle)]" htmlFor={`state-${issue.id}`}>State</label>
                      <select id={`state-${issue.id}`} name="state" defaultValue={issue.state} className="min-h-10 w-full rounded-[8px] border border-[var(--tgos-border)] px-2">
                        {Object.entries(issueStateLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <label className="block text-xs font-semibold text-[var(--tgos-subtle)]" htmlFor={`apr-${issue.id}`}>Accepted-risk approver</label>
                      <input id={`apr-${issue.id}`} name="acceptedRiskApproverName" className="min-h-10 w-full rounded-[8px] border border-[var(--tgos-border)] px-2" defaultValue={issue.accepted_risk_approver_name ?? ""} />
                      <label className="block text-xs font-semibold text-[var(--tgos-subtle)]" htmlFor={`rsn-${issue.id}`}>Accepted-risk reason</label>
                      <textarea id={`rsn-${issue.id}`} name="acceptedRiskReason" rows={2} className="w-full rounded-[8px] border border-[var(--tgos-border)] px-2 py-1" defaultValue={issue.accepted_risk_reason ?? ""} />
                      <button type="submit" className="inline-flex min-h-10 items-center rounded-[8px] border border-[var(--tgos-border-strong)] px-3 text-xs font-semibold">Save</button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Create issue</h2>
        <form action={createIssue.bind(null, organisationId)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold" htmlFor="tenderId">Tender</label>
            <select id="tenderId" name="tenderId" required className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3">
              <option value="">Select tender</option>
              {(tenders ?? []).map((tender) => (
                <option key={tender.id} value={tender.id}>{tender.title}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold" htmlFor="requirementId">Related requirement (optional)</label>
            <select id="requirementId" name="requirementId" className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3">
              <option value="">None</option>
              {(requirements ?? []).map((requirement) => (
                <option key={requirement.id} value={requirement.id}>{requirement.title} ({tenderTitle.get(requirement.tender_id) ?? "tender"})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="title">Title</label>
            <input id="title" name="title" required className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3" />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="severity">Severity</label>
            <select id="severity" name="severity" defaultValue="medium" className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold" htmlFor="whyItMatters">Why it matters</label>
            <textarea id="whyItMatters" name="whyItMatters" required rows={3} className="mt-1 w-full rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="ownerName">Owner</label>
            <input id="ownerName" name="ownerName" className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3" />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="dueOn">Due date</label>
            <input id="dueOn" name="dueOn" type="date" className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold" htmlFor="recommendedAction">Recommended action</label>
            <textarea id="recommendedAction" name="recommendedAction" rows={2} className="mt-1 w-full rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold" htmlFor="citationText">Source citation</label>
            <input id="citationText" name="citationText" className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3" placeholder="Document, page or evidence reference" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">Create issue</button>
          </div>
        </form>
      </section>
    </section>
  );
}
