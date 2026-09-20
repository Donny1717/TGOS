import Link from "next/link";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

type PageProps = { params: Promise<{ organisationId: string }> };

export default async function RequirementsPage({ params }: PageProps) {
  const { organisationId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Requirements</h1>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">Organisation-wide requirement register. Open a tender for source-cited detail.</p>
        </div>
        <div className="overflow-hidden rounded-[10px] border border-[var(--tgos-border)] bg-white">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Demo requirements</caption>
            <thead className="bg-[var(--tgos-surface-subtle)] text-xs text-[var(--tgos-subtle)]">
              <tr>
                <th className="px-3 py-2 font-semibold" scope="col">ID</th>
                <th className="px-3 py-2 font-semibold" scope="col">Requirement</th>
                <th className="px-3 py-2 font-semibold" scope="col">Tender</th>
                <th className="px-3 py-2 font-semibold" scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[var(--tgos-border)]">
                <td className="px-3 py-3">M-01</td>
                <td className="px-3 py-3">Public Liability Insurance ≥ £10m</td>
                <td className="px-3 py-3"><Link className="font-semibold text-[var(--tgos-primary)]" href={`/dashboard/${organisationId}/tenders/westshire-fm`}>Westshire FM Contract</Link></td>
                <td className="px-3 py-3"><span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Blocked</span></td>
              </tr>
              <tr className="border-t border-[var(--tgos-border)]">
                <td className="px-3 py-3">M-02</td>
                <td className="px-3 py-3">Carbon Reduction Plan attachment</td>
                <td className="px-3 py-3"><Link className="font-semibold text-[var(--tgos-primary)]" href={`/dashboard/${organisationId}/tenders/westshire-fm`}>Westshire FM Contract</Link></td>
                <td className="px-3 py-3"><span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Blocked</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  const { supabase } = await requireOrganisationMembership(organisationId);
  const { data: requirements } = await supabase
    .from("requirements")
    .select("id, title, status, classification, tenders(id, title)")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Requirements</h1>
        <p className="mt-2 text-sm text-[var(--tgos-muted)]">All requirements across tender workspaces.</p>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-[var(--tgos-border)] bg-white">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Organisation requirements</caption>
          <thead className="bg-[var(--tgos-surface-subtle)] text-xs text-[var(--tgos-subtle)]">
            <tr>
              <th className="px-3 py-2 font-semibold" scope="col">Title</th>
              <th className="px-3 py-2 font-semibold" scope="col">Classification</th>
              <th className="px-3 py-2 font-semibold" scope="col">Tender</th>
              <th className="px-3 py-2 font-semibold" scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {(requirements ?? []).map((requirement) => {
              const tender = requirement.tenders as unknown as { id: string; title: string } | null;
              return (
                <tr key={requirement.id} className="border-t border-[var(--tgos-border)]">
                  <td className="px-3 py-3 font-medium">{requirement.title}</td>
                  <td className="px-3 py-3 capitalize">{requirement.classification}</td>
                  <td className="px-3 py-3">
                    {tender ? (
                      <Link className="font-semibold text-[var(--tgos-primary)]" href={`/dashboard/${organisationId}/tenders/${tender.id}`}>
                        {tender.title}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3 capitalize">{String(requirement.status).replaceAll("_", " ")}</td>
                </tr>
              );
            })}
            {(requirements ?? []).length === 0 ? (
              <tr className="border-t border-[var(--tgos-border)]">
                <td className="px-3 py-6 text-[var(--tgos-muted)]" colSpan={4}>No requirements yet. Add source-cited requirements inside a tender workspace.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
