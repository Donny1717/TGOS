import Link from "next/link";
import { notFound } from "next/navigation";
import { createIssue, updateIssueState } from "@/app/actions";
import { TenderSubnav } from "@/components/tender-subnav";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";
import { issueStateLabels, severityBadgeClass, sortIssuesBySeverity } from "@/lib/issues";

type PageProps = { params: Promise<{ organisationId: string; tenderId: string }> };

export default async function TenderIssuesPage({ params }: PageProps) {
  const { organisationId, tenderId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <section className="space-y-6">
        <div>
          <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Overview</Link>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--tgos-navy)]">Issues</h1>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">Demo Borough / Westshire tender preview</p>
        </div>
        <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="issues" />
        <p className="text-sm text-[var(--tgos-muted)]">Demo issues mirror the Final Gate blockers.</p>
      </section>
    );
  }

  const { supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: tender }, { data: issues }, { data: requirements }] = await Promise.all([
    supabase.from("tenders").select("id, title, buyer_name").eq("id", tenderId).eq("organisation_id", organisationId).maybeSingle(),
    supabase
      .from("issues")
      .select("id, title, why_it_matters, severity, state, owner_name, due_on, recommended_action, citation_text, requirement_id, accepted_risk_approver_name, accepted_risk_reason, accepted_risk_at")
      .eq("organisation_id", organisationId)
      .eq("tender_id", tenderId),
    supabase.from("requirements").select("id, title").eq("tender_id", tenderId).eq("organisation_id", organisationId),
  ]);
  if (!tender) notFound();

  const requirementTitle = new Map((requirements ?? []).map((r) => [r.id, r.title]));
  const sorted = sortIssuesBySeverity(issues ?? []);

  return (
    <section className="space-y-6">
      <div>
        <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Overview</Link>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--tgos-navy)]">Issues</h1>
        <p className="mt-2 text-sm text-[var(--tgos-muted)]">{tender.title} — {tender.buyer_name}</p>
      </div>
      <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="issues" />

      <div className="overflow-x-auto rounded-[10px] border border-[var(--tgos-border)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--tgos-border)] bg-[var(--tgos-surface)] text-[var(--tgos-subtle)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Severity</th>
              <th className="px-4 py-3 font-semibold">Issue</th>
              <th className="px-4 py-3 font-semibold">Requirement</th>
              <th className="px-4 py-3 font-semibold">Owner / due</th>
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 font-semibold">Update</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-[var(--tgos-muted)]">No issues for this tender yet.</td></tr>
            ) : sorted.map((issue) => (
              <tr key={issue.id} className="border-b border-[var(--tgos-border)] align-top">
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${severityBadgeClass(issue.severity)}`}>{issue.severity}</span></td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{issue.title}</p>
                  <p className="mt-1 text-[var(--tgos-muted)]">{issue.why_it_matters}</p>
                  {issue.citation_text ? <p className="mt-1 text-xs text-[var(--tgos-subtle)]">Citation: {issue.citation_text}</p> : null}
                </td>
                <td className="px-4 py-3">{issue.requirement_id ? requirementTitle.get(issue.requirement_id) ?? "—" : "—"}</td>
                <td className="px-4 py-3">
                  <p>{issue.owner_name || "—"}</p>
                  <p className="text-[var(--tgos-subtle)]">{issue.due_on ? new Date(issue.due_on).toLocaleDateString("en-GB") : "No due date"}</p>
                </td>
                <td className="px-4 py-3">{issueStateLabels[issue.state] ?? issue.state}</td>
                <td className="px-4 py-3">
                  <form action={updateIssueState.bind(null, organisationId, tenderId)} className="space-y-2">
                    <input type="hidden" name="issueId" value={issue.id} />
                    <select name="state" defaultValue={issue.state} className="min-h-10 w-full rounded-[8px] border border-[var(--tgos-border)] px-2" aria-label={`State for ${issue.title}`}>
                      {Object.entries(issueStateLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <input name="acceptedRiskApproverName" placeholder="Accepted-risk approver" defaultValue={issue.accepted_risk_approver_name ?? ""} className="min-h-10 w-full rounded-[8px] border border-[var(--tgos-border)] px-2" />
                    <textarea name="acceptedRiskReason" rows={2} placeholder="Accepted-risk reason" defaultValue={issue.accepted_risk_reason ?? ""} className="w-full rounded-[8px] border border-[var(--tgos-border)] px-2 py-1" />
                    <button type="submit" className="inline-flex min-h-10 items-center rounded-[8px] border border-[var(--tgos-border-strong)] px-3 text-xs font-semibold">Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Create issue for this tender</h2>
        <form action={createIssue.bind(null, organisationId)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="tenderId" value={tenderId} />
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold" htmlFor="requirementId">Related requirement</label>
            <select id="requirementId" name="requirementId" className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3">
              <option value="">None</option>
              {(requirements ?? []).map((requirement) => (
                <option key={requirement.id} value={requirement.id}>{requirement.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="title">Title</label>
            <input id="title" name="title" required className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3" />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="severity">Severity</label>
            <select id="severity" name="severity" defaultValue="high" className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3">
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
            <input id="citationText" name="citationText" className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--tgos-border)] px-3" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">Create issue</button>
          </div>
        </form>
      </section>
    </section>
  );
}
