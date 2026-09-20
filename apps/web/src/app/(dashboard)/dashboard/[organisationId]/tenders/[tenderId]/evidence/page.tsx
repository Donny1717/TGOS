import Link from "next/link";
import { notFound } from "next/navigation";
import { createEvidence } from "@/app/actions";
import { TenderSubnav } from "@/components/tender-subnav";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";
import { evaluateEvidenceValidity } from "@/lib/evidence";

type PageProps = { params: Promise<{ organisationId: string; tenderId: string }> };

export default async function TenderEvidencePage({ params }: PageProps) {
  const { organisationId, tenderId } = await params;
  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <section className="space-y-6">
        <div>
          <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Overview</Link>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--tgos-navy)]">Evidence</h1>
        </div>
        <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="evidence" />
        <p className="text-sm text-[var(--tgos-muted)]">Local preview evidence list is on the organisation Evidence page.</p>
      </section>
    );
  }

  const { membership, supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: tender }, { data: evidence }, { data: documents }] = await Promise.all([
    supabase.from("tenders").select("id, title, contract_start_date").eq("id", tenderId).eq("organisation_id", organisationId).maybeSingle(),
    supabase.from("evidence_items").select("id, title, evidence_type, description, expires_on, source_document_id, source_document_version_id").eq("tender_id", tenderId).order("created_at"),
    supabase.from("source_documents").select("id, title").eq("tender_id", tenderId),
  ]);
  if (!tender) notFound();
  const documentIds = (documents ?? []).map((document) => document.id);
  const { data: versions } = documentIds.length
    ? await supabase.from("source_document_versions").select("id, version, storage_path").in("source_document_id", documentIds).order("version", { ascending: false })
    : { data: [] as Array<{ id: string; version: number; storage_path: string }> };
  const validity = evaluateEvidenceValidity(evidence ?? [], tender.contract_start_date);
  const canManage = membership.role !== "viewer";
  const addEvidence = createEvidence.bind(null, tenderId, organisationId);

  return (
    <section className="space-y-6">
      <div>
        <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Overview</Link>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--tgos-navy)]">Evidence</h1>
        <p className="mt-2 text-sm text-[var(--tgos-muted)]">{tender.title} · validity measured to contract start</p>
      </div>
      <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="evidence" />
      {validity.status !== "pass" ? <p className="rounded-[10px] bg-[var(--tgos-warning-bg)] px-4 py-3 text-sm text-[var(--tgos-warning)]">{validity.message}</p> : null}
      {canManage && (versions ?? []).length > 0 ? (
        <form action={addEvidence} className="space-y-3 rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
          <h2 className="font-semibold text-[var(--tgos-navy)]">Add evidence</h2>
          <label className="block text-sm font-medium">Title<input name="title" required minLength={2} maxLength={200} className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">Type<input name="evidenceType" required minLength={2} maxLength={80} className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
            <label className="block text-sm font-medium">Expires<input name="expiresOn" type="date" className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
          </div>
          <label className="block text-sm font-medium">Description<textarea name="description" maxLength={10000} rows={2} className="mt-1 w-full rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
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
          <button className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">Add evidence</button>
        </form>
      ) : null}
      <div className="overflow-hidden rounded-[10px] border border-[var(--tgos-border)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--tgos-surface-subtle)] text-xs text-[var(--tgos-subtle)]">
            <tr>
              <th className="px-3 py-2" scope="col">Document</th>
              <th className="px-3 py-2" scope="col">Type</th>
              <th className="px-3 py-2" scope="col">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {(evidence ?? []).map((item) => (
              <tr key={item.id} className="border-t border-[var(--tgos-border)]">
                <td className="px-3 py-3 font-medium">{item.title}</td>
                <td className="px-3 py-3">{item.evidence_type}</td>
                <td className="px-3 py-3">{item.expires_on ?? "—"}</td>
              </tr>
            ))}
            {(evidence ?? []).length === 0 ? <tr className="border-t border-[var(--tgos-border)]"><td className="px-3 py-6 text-[var(--tgos-muted)]" colSpan={3}>No evidence items yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
