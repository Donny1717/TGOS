import Link from "next/link";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

type PageProps = { params: Promise<{ organisationId: string }> };

export default async function ReportsPage({ params }: PageProps) {
  const { organisationId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Reports</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--tgos-muted)]">Tender Readiness Reports for directors and reviewers.</p>
        </div>
        <p className="rounded-[10px] bg-[var(--tgos-info-bg)] px-4 py-3 text-sm text-[var(--tgos-primary)]" role="note">AI-assisted analysis. Human review and approval are required before tender submission.</p>
        <p className="text-sm text-[var(--tgos-muted)]">Demo mode: open a real organisation to list live tender reports.</p>
      </section>
    );
  }

  const { supabase } = await requireOrganisationMembership(organisationId);
  const { data: tenders } = await supabase
    .from("tenders")
    .select("id, title, buyer_name, submission_deadline, status")
    .eq("organisation_id", organisationId)
    .order("submission_deadline", { ascending: true });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Reports</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--tgos-muted)]">HTML Tender Readiness Reports for directors and reviewers.</p>
      </div>
      <p className="rounded-[10px] bg-[var(--tgos-info-bg)] px-4 py-3 text-sm text-[var(--tgos-primary)]" role="note">AI-assisted analysis. Human review and approval are required before tender submission.</p>
      <div className="overflow-x-auto rounded-[10px] border border-[var(--tgos-border)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--tgos-border)] bg-[var(--tgos-surface)] text-[var(--tgos-subtle)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Tender</th>
              <th className="px-4 py-3 font-semibold">Buyer</th>
              <th className="px-4 py-3 font-semibold">Deadline</th>
              <th className="px-4 py-3 font-semibold">Report</th>
            </tr>
          </thead>
          <tbody>
            {(tenders ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-[var(--tgos-muted)]">No tenders yet.</td></tr>
            ) : (
              (tenders ?? []).map((tender) => (
                <tr key={tender.id} className="border-b border-[var(--tgos-border)]">
                  <td className="px-4 py-3 font-semibold text-[var(--tgos-navy)]">{tender.title}</td>
                  <td className="px-4 py-3">{tender.buyer_name}</td>
                  <td className="px-4 py-3">{tender.submission_deadline ? new Date(tender.submission_deadline).toLocaleString("en-GB") : "—"}</td>
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-[var(--tgos-primary)]" href={`/dashboard/${organisationId}/tenders/${tender.id}/report`}>Open HTML report</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
