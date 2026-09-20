import Link from "next/link";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

type PageProps = { params: Promise<{ organisationId: string }> };

export default async function EvidencePage({ params }: PageProps) {
  const { organisationId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Evidence</h1>
            <p className="mt-2 text-sm text-[var(--tgos-muted)]">Tender-relevant documents and validity.</p>
          </div>
          <Link href={`/dashboard/${organisationId}/tenders`} className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">Upload via tender</Link>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-[var(--tgos-border)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--tgos-surface-subtle)] text-xs text-[var(--tgos-subtle)]">
              <tr>
                <th className="px-3 py-2" scope="col">Document</th>
                <th className="px-3 py-2" scope="col">Category</th>
                <th className="px-3 py-2" scope="col">Expiry</th>
                <th className="px-3 py-2" scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[var(--tgos-border)]"><td className="px-3 py-3">PL Insurance</td><td className="px-3 py-3">Insurance</td><td className="px-3 py-3">20 Sep 2026</td><td className="px-3 py-3"><span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Insufficient cover</span></td></tr>
              <tr className="border-t border-[var(--tgos-border)]"><td className="px-3 py-3">Carbon Reduction Plan</td><td className="px-3 py-3">Policy</td><td className="px-3 py-3">—</td><td className="px-3 py-3"><span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Missing</span></td></tr>
              <tr className="border-t border-[var(--tgos-border)]"><td className="px-3 py-3">ISO 9001</td><td className="px-3 py-3">Accreditation</td><td className="px-3 py-3">Expired</td><td className="px-3 py-3"><span className="rounded-full bg-[var(--tgos-warning-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-warning)]">Needs attention</span></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  const { supabase } = await requireOrganisationMembership(organisationId);
  const { data: evidence } = await supabase
    .from("evidence_items")
    .select("id, title, evidence_type, expires_on, tenders(id, title)")
    .eq("organisation_id", organisationId)
    .order("expires_on", { nullsFirst: false })
    .limit(100);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Evidence</h1>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">Evidence locker items across tenders.</p>
        </div>
        <Link href={`/dashboard/${organisationId}/tenders`} className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">Open tenders</Link>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-[var(--tgos-border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--tgos-surface-subtle)] text-xs text-[var(--tgos-subtle)]">
            <tr>
              <th className="px-3 py-2" scope="col">Document</th>
              <th className="px-3 py-2" scope="col">Type</th>
              <th className="px-3 py-2" scope="col">Tender</th>
              <th className="px-3 py-2" scope="col">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {(evidence ?? []).map((item) => {
              const tender = item.tenders as unknown as { id: string; title: string } | null;
              return (
                <tr key={item.id} className="border-t border-[var(--tgos-border)]">
                  <td className="px-3 py-3 font-medium">{item.title}</td>
                  <td className="px-3 py-3">{item.evidence_type}</td>
                  <td className="px-3 py-3">{tender ? <Link className="font-semibold text-[var(--tgos-primary)]" href={`/dashboard/${organisationId}/tenders/${tender.id}`}>{tender.title}</Link> : "—"}</td>
                  <td className="px-3 py-3">{item.expires_on ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(item.expires_on)) : "—"}</td>
                </tr>
              );
            })}
            {(evidence ?? []).length === 0 ? (
              <tr className="border-t border-[var(--tgos-border)]"><td className="px-3 py-6 text-[var(--tgos-muted)]" colSpan={4}>No evidence items yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
