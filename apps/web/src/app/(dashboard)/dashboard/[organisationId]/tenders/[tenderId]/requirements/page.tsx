import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createRequirement,
  linkRequirementEvidence,
  unlinkRequirementEvidence,
  updateRequirementStatus,
} from "@/app/actions";
import { RequirementRegister } from "@/components/requirement-register";
import { TenderSubnav } from "@/components/tender-subnav";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

type PageProps = { params: Promise<{ organisationId: string; tenderId: string }> };

export default async function TenderRequirementsPage({ params }: PageProps) {
  const { organisationId, tenderId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    const rows = [
      {
        id: "m01",
        title: "Public Liability Insurance ≥ £10m",
        requirementText: "The supplier must provide Public Liability Insurance of at least £10 million.",
        classification: "Mandatory",
        status: "at_risk",
        sourcePage: 12,
        sourceSection: "4.2",
        sourceDocumentTitle: "ITT.pdf",
        linkedEvidence: [{ id: "e1", title: "PL_Insurance.pdf (£5m)" }],
      },
      {
        id: "m02",
        title: "Carbon Reduction Plan",
        requirementText: "A valid Carbon Reduction Plan must be included with the submission.",
        classification: "Attachment",
        status: "open",
        sourcePage: 18,
        sourceSection: "5.1",
        sourceDocumentTitle: "ITT.pdf",
        linkedEvidence: [],
      },
    ];
    return (
      <section className="space-y-6">
        <div>
          <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Overview</Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Requirement register</h1>
          <p className="mt-2 text-sm text-[var(--tgos-muted)]">Source-cited obligations for this tender.</p>
        </div>
        <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="requirements" />
        <RequirementRegister requirements={rows} />
      </section>
    );
  }

  const { membership, supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: tender }, { data: requirements }, { data: documents }, { data: evidence }, { data: evidenceLinks }] = await Promise.all([
    supabase.from("tenders").select("id, title").eq("id", tenderId).eq("organisation_id", organisationId).maybeSingle(),
    supabase
      .from("requirements")
      .select("id, title, requirement_text, classification, status, due_at, source_document_id, source_document_version_id, source_page, source_section")
      .eq("tender_id", tenderId)
      .order("created_at", { ascending: false }),
    supabase.from("source_documents").select("id, title, current_version").eq("tender_id", tenderId).order("created_at"),
    supabase.from("evidence_items").select("id, title").eq("tender_id", tenderId).order("created_at"),
    supabase.from("requirement_evidence_links").select("requirement_id, evidence_item_id").eq("organisation_id", organisationId),
  ]);
  if (!tender) notFound();

  const documentIds = (documents ?? []).map((document) => document.id);
  const { data: versions } = documentIds.length
    ? await supabase
        .from("source_document_versions")
        .select("id, source_document_id, version, storage_path")
        .in("source_document_id", documentIds)
        .order("version", { ascending: false })
    : { data: [] as Array<{ id: string; source_document_id: string; version: number; storage_path: string }> };

  const linked = new Map<string, Set<string>>();
  (evidenceLinks ?? []).forEach((link) => {
    const set = linked.get(link.requirement_id) ?? new Set<string>();
    set.add(link.evidence_item_id);
    linked.set(link.requirement_id, set);
  });
  const docsById = new Map((documents ?? []).map((document) => [document.id, document.title]));
  const evidenceById = new Map((evidence ?? []).map((item) => [item.id, item.title]));
  const canManage = membership.role !== "viewer";
  const addRequirement = createRequirement.bind(null, tenderId, organisationId);
  const changeRequirementStatus = updateRequirementStatus.bind(null, tenderId, organisationId);
  const linkEvidence = linkRequirementEvidence.bind(null, tenderId, organisationId);
  const unlinkEvidence = unlinkRequirementEvidence.bind(null, tenderId, organisationId);

  const rows = (requirements ?? []).map((requirement) => ({
    id: requirement.id,
    title: requirement.title,
    requirementText: requirement.requirement_text,
    classification: requirement.classification,
    status: requirement.status,
    sourcePage: requirement.source_page,
    sourceSection: requirement.source_section,
    sourceDocumentTitle: docsById.get(requirement.source_document_id) ?? null,
    dueAt: requirement.due_at,
    linkedEvidence: [...(linked.get(requirement.id) ?? [])].map((id) => ({ id, title: evidenceById.get(id) ?? id })),
  }));

  return (
    <section className="space-y-6">
      <div>
        <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Overview</Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--tgos-navy)]">Requirement register</h1>
        <p className="mt-2 text-sm text-[var(--tgos-muted)]">{tender.title} · every requirement must cite document, page and section.</p>
      </div>
      <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="requirements" />

      <RequirementRegister requirements={rows}>
        {canManage && (versions ?? []).length > 0 ? (
          <form action={addRequirement} className="space-y-3 rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
            <h2 className="text-base font-semibold text-[var(--tgos-navy)]">Add requirement</h2>
            <label className="block text-sm font-medium">Title<input name="title" required minLength={2} maxLength={200} className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
            <label className="block text-sm font-medium">Requirement text<textarea name="requirementText" required minLength={2} maxLength={20000} rows={3} className="mt-1 w-full rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">Classification<input name="classification" required minLength={2} maxLength={80} className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
              <label className="block text-sm font-medium">Due<input name="dueAt" type="datetime-local" className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
              <label className="block text-sm font-medium">Source page<input name="sourcePage" required type="number" min={1} className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
              <label className="block text-sm font-medium">Source section<input name="sourceSection" required minLength={1} maxLength={200} className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
            </div>
            <label className="block text-sm font-medium">Source document
              <select name="sourceDocumentId" required className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2">
                <option value="">Select source document</option>
                {(documents ?? []).map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">Source version
              <select name="sourceDocumentVersionId" required className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2">
                <option value="">Select source version</option>
                {(versions ?? []).map((version) => <option key={version.id} value={version.id}>v{version.version} · {version.storage_path.split("/").pop()}</option>)}
              </select>
            </label>
            <button className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">Add requirement</button>
          </form>
        ) : null}
      </RequirementRegister>

      <div className="space-y-3">
        {(requirements ?? []).map((requirement) => (
          <div key={requirement.id} className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-[var(--tgos-navy)]">{requirement.title}</p>
              {canManage ? (
                <form action={changeRequirementStatus} className="flex items-center gap-2">
                  <input type="hidden" name="requirementId" value={requirement.id} />
                  <label htmlFor={`requirement-status-${requirement.id}`} className="sr-only">Requirement status</label>
                  <select id={`requirement-status-${requirement.id}`} name="status" defaultValue={requirement.status} className="min-h-10 rounded-[10px] border border-[var(--tgos-border)] px-2 text-xs capitalize">
                    {["open", "in_progress", "satisfied", "at_risk", "waived"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                  </select>
                  <button className="text-xs font-semibold text-[var(--tgos-primary)]">Save</button>
                </form>
              ) : null}
            </div>
            {canManage && (evidence ?? []).length > 0 ? (
              <form action={linkEvidence} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="requirementId" value={requirement.id} />
                <select name="evidenceItemId" required className="min-h-10 min-w-[220px] flex-1 rounded-[10px] border border-[var(--tgos-border)] px-2 text-xs">
                  <option value="">Link evidence…</option>
                  {(evidence ?? []).filter((item) => !(linked.get(requirement.id)?.has(item.id))).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <button className="min-h-10 rounded-[10px] bg-[var(--tgos-navy)] px-3 text-xs font-semibold text-white">Link</button>
              </form>
            ) : null}
            <div className="mt-2 space-y-1">
              {[...(linked.get(requirement.id) ?? [])].map((evidenceId) => {
                const item = (evidence ?? []).find((candidate) => candidate.id === evidenceId);
                if (!item) return null;
                return (
                  <div key={evidenceId} className="flex items-center justify-between gap-2 text-xs text-[var(--tgos-success)]">
                    <span>✓ {item.title}</span>
                    {canManage ? (
                      <form action={unlinkEvidence}>
                        <input type="hidden" name="requirementId" value={requirement.id} />
                        <input type="hidden" name="evidenceItemId" value={item.id} />
                        <button className="font-semibold text-[var(--tgos-critical)]">Unlink</button>
                      </form>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
