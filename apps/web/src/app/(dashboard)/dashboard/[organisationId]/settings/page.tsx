import Link from "next/link";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

type PageProps = { params: Promise<{ organisationId: string }> };

export default async function SettingsPage({ params }: PageProps) {
  const { organisationId } = await params;
  if (!(isLocalAuthBypassEnabled() && organisationId === "demo")) {
    await requireOrganisationMembership(organisationId);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Settings</h1>
        <p className="mt-2 text-sm text-[var(--tgos-muted)]">Organisation profile, members, security and accessibility.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href={`/dashboard/${organisationId}/passport`} className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5 hover:border-[var(--tgos-primary)]">
          <h2 className="font-semibold text-[var(--tgos-navy)]">Company Passport</h2>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">Legal, financial, policy and contact evidence held once for reuse.</p>
        </Link>
        <Link href={`/dashboard/${organisationId}/settings/accessibility`} className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5 hover:border-[var(--tgos-primary)]">
          <h2 className="font-semibold text-[var(--tgos-navy)]">Accessibility</h2>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">Statement and feedback route.</p>
        </Link>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
          <h2 className="font-semibold text-[var(--tgos-navy)]">Members and roles</h2>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">Owner, admin, member, viewer — invite UI next.</p>
        </div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
          <h2 className="font-semibold text-[var(--tgos-navy)]">Security</h2>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">Organisation isolation is enforced in the database.</p>
        </div>
      </div>
    </section>
  );
}
