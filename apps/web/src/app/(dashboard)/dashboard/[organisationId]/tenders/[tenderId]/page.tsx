import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTenderStatus } from "@/app/actions";
import { TenderSubnav } from "@/components/tender-subnav";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";
import { evaluateEvidenceValidity } from "@/lib/evidence";

type TenderPageProps = {
  params: Promise<{ organisationId: string; tenderId: string }>;
};

function daysRemaining(deadline: string | null) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default async function TenderOverviewPage({ params }: TenderPageProps) {
  const { organisationId, tenderId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    const tender =
      tenderId === "westshire-fm"
        ? { title: "Westshire FM Contract", buyer: "Westshire County Council", reference: "WCC-FM-118", deadline: "18 September 2026 · 12:00", days: 5 }
        : tenderId === "nhs-data-platform"
          ? { title: "NHS Data Platform", buyer: "North Midlands NHS Trust", reference: "NMDP-26-09", deadline: "22 September 2026 · 17:00", days: 9 }
          : { title: "Civic Digital Services Framework", buyer: "Civic Services Authority", reference: "CDS-2026-04", deadline: "12 September 2026 · 17:00", days: -1 };

    return (
      <section className="space-y-6">
        <div>
          <Link href={`/dashboard/${organisationId}/tenders`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Tenders</Link>
          <p className="mt-3 text-sm text-[var(--tgos-muted)]">{tender.buyer} · {tender.reference}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">{tender.title}</h1>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">Submission deadline: {tender.deadline} · <strong>{tender.days >= 0 ? `${tender.days} days remaining` : "Deadline passed"}</strong></p>
          <p className="mt-3"><span className="rounded-full bg-[var(--tgos-critical-bg)] px-3 py-1 text-xs font-bold text-[var(--tgos-critical)]">Overall status: No-Go</span></p>
        </div>
        <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="overview" />
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/${organisationId}/tenders/${tenderId}/final-gate`} className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">Run final gate</Link>
          <Link href={`/dashboard/${organisationId}/tenders/${tenderId}/documents`} className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border-strong)] bg-white px-4 text-sm font-semibold">Upload document</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4"><p className="text-sm text-[var(--tgos-subtle)]">Overall readiness</p><p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">42%</p><p className="mt-1 text-xs text-[var(--tgos-muted)]">Critical blockers remain</p></div>
          <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4"><p className="text-sm text-[var(--tgos-subtle)]">Mandatory completion</p><p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">2 / 4</p></div>
          <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4"><p className="text-sm text-[var(--tgos-subtle)]">Critical / high issues</p><p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">3 / 2</p></div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
            <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Top priority actions</h2>
            <ul className="mt-3 divide-y divide-[var(--tgos-border)] text-sm">
              <li className="flex justify-between gap-3 py-3"><span>Obtain Carbon Reduction Plan</span><span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Blocked</span></li>
              <li className="flex justify-between gap-3 py-3"><span>Increase PL cover to ≥ £10m</span><span className="rounded-full bg-[var(--tgos-critical-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-critical)]">Blocked</span></li>
              <li className="flex justify-between gap-3 py-3"><span>Replace expired ISO 9001</span><span className="rounded-full bg-[var(--tgos-warning-bg)] px-2 py-1 text-xs font-bold text-[var(--tgos-warning)]">Needs attention</span></li>
            </ul>
          </section>
          <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
            <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Snapshot</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--tgos-muted)]">
              <li className="flex justify-between"><span>Missing documents / evidence</span><strong className="text-[var(--tgos-text)]">3</strong></li>
              <li className="flex justify-between"><span>Questions ready for review</span><strong className="text-[var(--tgos-text)]">1</strong></li>
              <li className="flex justify-between"><span>Human review required</span><strong className="text-[var(--tgos-text)]">2</strong></li>
            </ul>
            <p className="mt-4 text-xs text-[var(--tgos-subtle)]">Compact activity: Final gate draft available · Issue noted: CRP missing</p>
          </section>
        </div>
      </section>
    );
  }

  const { membership, supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: tender, error }, { data: requirements }, { data: evidence }, { data: evidenceLinks }, { data: documents }, { data: tasks }] = await Promise.all([
    supabase
      .from("tenders")
      .select("id, title, buyer_name, reference, description, status, submission_deadline, contract_start_date, notice_url")
      .eq("id", tenderId)
      .eq("organisation_id", organisationId)
      .maybeSingle(),
    supabase.from("requirements").select("id, title, status").eq("tender_id", tenderId),
    supabase.from("evidence_items").select("id, title, expires_on").eq("tender_id", tenderId),
    supabase.from("requirement_evidence_links").select("requirement_id, evidence_item_id").eq("organisation_id", organisationId),
    supabase.from("source_documents").select("id").eq("tender_id", tenderId),
    supabase.from("tender_tasks").select("id, title, status").eq("tender_id", tenderId).neq("status", "done"),
  ]);

  if (error) throw new Error("Tender workspace could not be loaded.");
  if (!tender) notFound();

  const linked = new Map<string, Set<string>>();
  (evidenceLinks ?? []).forEach((link) => {
    const set = linked.get(link.requirement_id) ?? new Set<string>();
    set.add(link.evidence_item_id);
    linked.set(link.requirement_id, set);
  });

  const requirementCount = requirements?.length ?? 0;
  const covered = (requirements ?? []).filter((item) => (linked.get(item.id)?.size ?? 0) > 0).length;
  const missingEvidence = (requirements ?? []).filter((item) => (linked.get(item.id)?.size ?? 0) === 0);
  const atRisk = (requirements ?? []).filter((item) => item.status === "at_risk" || item.status === "open");
  const readiness = requirementCount ? Math.round((covered / requirementCount) * 100) : 0;
  const evidenceValidity = evaluateEvidenceValidity(evidence ?? [], tender.contract_start_date);
  const days = daysRemaining(tender.submission_deadline);
  const changeTenderStatus = updateTenderStatus.bind(null, tenderId, organisationId);
  const canEditStatus = membership.role !== "member" && membership.role !== "viewer";

  const overall =
    missingEvidence.length > 0 || evidenceValidity.status === "fail"
      ? "No-Go"
      : atRisk.length > 0 || evidenceValidity.status === "unknown"
        ? "Conditional Go"
        : requirementCount === 0
          ? "In progress"
          : "Go";

  const topActions = [
    ...missingEvidence.slice(0, 2).map((item) => ({ label: `Link evidence for “${item.title}”`, tone: "Blocked" })),
    ...(evidenceValidity.status === "fail" ? [{ label: evidenceValidity.message, tone: "Blocked" }] : []),
    ...atRisk.slice(0, 2).map((item) => ({ label: `Review requirement “${item.title}”`, tone: "Needs attention" })),
    ...((tasks ?? []).slice(0, 1).map((task) => ({ label: task.title, tone: "In progress" })) as Array<{ label: string; tone: string }>),
  ].slice(0, 3);

  return (
    <section className="space-y-6">
      <div>
        <Link href={`/dashboard/${organisationId}/tenders`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Tenders</Link>
        <p className="mt-3 text-sm text-[var(--tgos-muted)]">
          {tender.buyer_name}
          {tender.reference ? ` · ${tender.reference}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">{tender.title}</h1>
        <p className="mt-2 text-sm text-[var(--tgos-muted)]">
          Submission deadline:{" "}
          {tender.submission_deadline
            ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(tender.submission_deadline))
            : "Not set"}
          {days === null ? "" : ` · `}
          {days === null ? null : <strong>{days >= 0 ? `${days} days remaining` : "Deadline passed"}</strong>}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              overall === "No-Go"
                ? "bg-[var(--tgos-critical-bg)] text-[var(--tgos-critical)]"
                : overall === "Go"
                  ? "bg-[var(--tgos-success-bg)] text-[var(--tgos-success)]"
                  : "bg-[var(--tgos-warning-bg)] text-[var(--tgos-warning)]"
            }`}
          >
            Overall status: {overall}
          </span>
          {canEditStatus ? (
            <form action={changeTenderStatus} className="flex items-center gap-2">
              <label htmlFor="tender-status" className="sr-only">Lifecycle status</label>
              <select id="tender-status" name="status" defaultValue={tender.status} className="min-h-10 rounded-[10px] border border-[var(--tgos-border)] px-2 text-xs capitalize">
                {["draft", "bid_decision", "active", "submitted", "awarded", "lost", "archived"].map((status) => (
                  <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                ))}
              </select>
              <button className="min-h-10 rounded-[10px] bg-[var(--tgos-navy)] px-3 text-xs font-semibold text-white">Save</button>
            </form>
          ) : (
            <span className="text-xs capitalize text-[var(--tgos-subtle)]">{tender.status.replaceAll("_", " ")}</span>
          )}
        </div>
      </div>

      <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="overview" />

      <div className="flex flex-wrap gap-2">
        <Link href={`/dashboard/${organisationId}/tenders/${tenderId}/final-gate`} className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">Run final gate</Link>
        <Link href={`/dashboard/${organisationId}/tenders/${tenderId}/documents`} className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border-strong)] bg-white px-4 text-sm font-semibold">Upload document</Link>
        <Link href={`/dashboard/${organisationId}/reports`} className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border)] bg-white px-4 text-sm font-semibold">Share report</Link>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4"><p className="text-sm text-[var(--tgos-subtle)]">Overall readiness</p><p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">{readiness}%</p><p className="mt-1 text-xs text-[var(--tgos-muted)]">Requirements with linked evidence</p></div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4"><p className="text-sm text-[var(--tgos-subtle)]">Mandatory / all requirements</p><p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">{covered} / {requirementCount}</p></div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4"><p className="text-sm text-[var(--tgos-subtle)]">Missing evidence links</p><p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">{missingEvidence.length}</p></div>
        <div className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4"><p className="text-sm text-[var(--tgos-subtle)]">Source documents</p><p className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">{documents?.length ?? 0}</p></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Top priority actions</h2>
          <ul className="mt-3 divide-y divide-[var(--tgos-border)] text-sm">
            {topActions.length ? topActions.map((action) => (
              <li key={action.label} className="flex items-start justify-between gap-3 py-3">
                <span>{action.label}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${action.tone === "Blocked" ? "bg-[var(--tgos-critical-bg)] text-[var(--tgos-critical)]" : "bg-[var(--tgos-warning-bg)] text-[var(--tgos-warning)]"}`}>{action.tone}</span>
              </li>
            )) : <li className="py-3 text-[var(--tgos-muted)]">No open blockers detected from current links. Run Final Gate before submission.</li>}
          </ul>
        </section>
        <section className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-[var(--tgos-navy)]">Brief</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--tgos-muted)]">{tender.description || "No description added."}</p>
          {tender.notice_url ? <a href={tender.notice_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-[var(--tgos-primary)]">Open notice</a> : null}
          <p className="mt-4 text-xs text-[var(--tgos-subtle)]" role="note">AI-assisted analysis. Human review and approval are required before tender submission.</p>
        </section>
      </div>
    </section>
  );
}
