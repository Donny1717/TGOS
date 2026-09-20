import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

type PageProps = { params: Promise<{ organisationId: string }> };

export default async function AccessibilitySettingsPage({ params }: PageProps) {
  const { organisationId } = await params;
  if (!(isLocalAuthBypassEnabled() && organisationId === "demo")) {
    await requireOrganisationMembership(organisationId);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Accessibility</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--tgos-muted)]">
          TGOS is being designed and tested toward WCAG 2.2 Level AA.
        </p>
      </div>
      <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5 text-sm text-[var(--tgos-muted)]">
        <p><strong className="text-[var(--tgos-text)]">Current honest status:</strong> core journeys are being refactored for keyboard access, visible focus, text status labels and semantic tables. Do not claim full WCAG 2.2 AA conformance until testing evidence supports it.</p>
      </div>
    </section>
  );
}
