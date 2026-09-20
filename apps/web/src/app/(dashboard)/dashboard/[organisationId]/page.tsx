import Link from "next/link";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

type DashboardPageProps = {
  params: Promise<{ organisationId: string }>;
};

export default async function OrganisationDashboardPage({ params }: DashboardPageProps) {
  const { organisationId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <section className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Good morning</h1>
            <p className="mt-2 text-sm text-[var(--tgos-muted)]">You have 2 tenders requiring attention.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/${organisationId}/tenders`} className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">+ New tender</Link>
            <Link href={`/dashboard/${organisationId}/tenders`} className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border-strong)] bg-white px-4 text-sm font-semibold">Upload tender pack</Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["2", "Tenders requiring attention"],
            ["3", "Critical issues"],
            ["4", "Mandatory requirements at risk"],
            ["30 Sep 2026", "Nearest submission deadline"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
              <p className="text-sm text-[var(--tgos-subtle)]">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
            <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Priority actions</h2>
            <ul className="mt-4 divide-y divide-[var(--tgos-border)]">
              <li className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">Blocked — Carbon Reduction Plan missing</p>
                  <p className="text-xs text-[var(--tgos-subtle)]">Westshire FM Contract · Critical</p>
                </div>
                <span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Critical</span>
              </li>
              <li className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">Blocked — Public Liability Insurance below £10m</p>
                  <p className="text-xs text-[var(--tgos-subtle)]">£5m on file · Insurance.pdf p.2</p>
                </div>
                <span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Critical</span>
              </li>
              <li className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">Needs attention — ISO 9001 expired</p>
                  <p className="text-xs text-[var(--tgos-subtle)]">Replace certificate before final gate</p>
                </div>
                <span className="rounded-full bg-[var(--tgos-warning-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-warning)]">High</span>
              </li>
            </ul>
          </section>

          <div className="space-y-4">
            <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
              <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Active tenders</h2>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/dashboard/${organisationId}/tenders/westshire-fm`} className="font-semibold text-[var(--tgos-primary)]">Westshire FM Contract</Link>
                    <p className="text-xs text-[var(--tgos-subtle)]">Westshire County Council · 18 Sep 2026</p>
                  </div>
                  <span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">No-Go risk</span>
                </li>
                <li className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/dashboard/${organisationId}/tenders/nhs-data-platform`} className="font-semibold text-[var(--tgos-primary)]">NHS Data Platform</Link>
                    <p className="text-xs text-[var(--tgos-subtle)]">North Midlands NHS Trust · 22 Sep 2026</p>
                  </div>
                  <span className="rounded-full bg-[var(--tgos-warning-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-warning)]">Needs attention</span>
                </li>
              </ul>
            </section>
            <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
              <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Evidence alerts</h2>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex justify-between gap-3"><span>Public Liability Insurance</span><span className="rounded-full bg-[var(--tgos-warning-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-warning)]">Expiring soon</span></li>
                <li className="flex justify-between gap-3"><span>Carbon Reduction Plan</span><span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Missing</span></li>
              </ul>
            </section>
          </div>
        </div>

        <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Recent activity</h2>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">Requirement extraction reviewed · Westshire FM · today</p>
          <p className="mt-1 text-sm text-[var(--tgos-muted)]">Issue noted: CRP missing · today</p>
        </section>
      </section>
    );
  }

  const { supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: organisation }, { data: passport }, { data: tenders }, { count: requirementCount }, { count: evidenceCount }] = await Promise.all([
    supabase.from("organisations").select("id, name, slug").eq("id", organisationId).single(),
    supabase.from("company_passports").select("id, legal_name, updated_at").eq("organisation_id", organisationId).maybeSingle(),
    supabase
      .from("tenders")
      .select("id, title, buyer_name, status, submission_deadline")
      .eq("organisation_id", organisationId)
      .order("submission_deadline", { ascending: true, nullsFirst: false })
      .limit(8),
    supabase.from("requirements").select("id", { count: "exact", head: true }).eq("organisation_id", organisationId),
    supabase.from("evidence_items").select("id", { count: "exact", head: true }).eq("organisation_id", organisationId),
  ]);

  const openTenders = (tenders ?? []).filter((tender) => !["submitted", "awarded", "lost", "archived"].includes(tender.status));
  const nearest = openTenders.find((tender) => tender.submission_deadline)?.submission_deadline;

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">{organisation?.name}</h1>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">
            You have {openTenders.length} tender{openTenders.length === 1 ? "" : "s"} in progress. This platform assists compliance work and does not certify submissions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/${organisationId}/tenders`} className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">+ New tender</Link>
          <Link href={`/dashboard/${organisationId}/tenders`} className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border-strong)] bg-white px-4 text-sm font-semibold">Upload tender pack</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
          <p className="text-sm text-[var(--tgos-subtle)]">Tenders requiring attention</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">{openTenders.length}</p>
        </div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
          <p className="text-sm text-[var(--tgos-subtle)]">Requirements on file</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">{requirementCount ?? 0}</p>
        </div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
          <p className="text-sm text-[var(--tgos-subtle)]">Evidence items</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">{evidenceCount ?? 0}</p>
        </div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
          <p className="text-sm text-[var(--tgos-subtle)]">Nearest submission deadline</p>
          <p className="mt-2 text-lg font-semibold text-[var(--tgos-navy)]">
            {nearest ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(nearest)) : "Not set"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Active tenders</h2>
            <Link href={`/dashboard/${organisationId}/tenders`} className="text-sm font-semibold text-[var(--tgos-primary)]">View all</Link>
          </div>
          <ul className="mt-4 divide-y divide-[var(--tgos-border)]">
            {(tenders ?? []).map((tender) => (
              <li key={tender.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <Link href={`/dashboard/${organisationId}/tenders/${tender.id}`} className="font-semibold text-[var(--tgos-primary)]">{tender.title}</Link>
                  <p className="text-xs text-[var(--tgos-subtle)]">{tender.buyer_name}</p>
                </div>
                <span className="rounded-full bg-[var(--tgos-surface-subtle)] px-2 py-1 text-xs font-semibold capitalize text-[var(--tgos-muted)]">{tender.status.replaceAll("_", " ")}</span>
              </li>
            ))}
            {(tenders ?? []).length === 0 ? <li className="py-4 text-sm text-[var(--tgos-muted)]">No tenders yet. Create a tender workspace to begin.</li> : null}
          </ul>
        </section>

        <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Priority next steps</h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--tgos-muted)]">
            <li>1. Keep Company Passport current{passport ? ` (updated ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(passport.updated_at))})` : " (not created yet)"}.</li>
            <li>2. Upload the tender pack and add source-cited requirements.</li>
            <li>3. Link evidence, then run Final Gate when Sprint 3 lands.</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/dashboard/${organisationId}/passport`} className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border-strong)] px-4 text-sm font-semibold">Company Passport</Link>
            <Link href={`/dashboard/${organisationId}/issues`} className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border-strong)] px-4 text-sm font-semibold">Issues</Link>
          </div>
        </section>
      </div>
    </section>
  );
}
