import Link from "next/link";
import { notFound } from "next/navigation";
import { uploadSourceDocument } from "@/app/actions";
import { TenderSubnav } from "@/components/tender-subnav";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

type PageProps = { params: Promise<{ organisationId: string; tenderId: string }> };

export default async function TenderDocumentsPage({ params }: PageProps) {
  const { organisationId, tenderId } = await params;
  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <section className="space-y-6">
        <div>
          <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Overview</Link>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--tgos-navy)]">Documents</h1>
        </div>
        <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="documents" />
        <p className="text-sm text-[var(--tgos-muted)]">Local preview — uploads disabled.</p>
      </section>
    );
  }

  const { membership, supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: tender }, { data: documents }] = await Promise.all([
    supabase.from("tenders").select("id, title").eq("id", tenderId).eq("organisation_id", organisationId).maybeSingle(),
    supabase.from("source_documents").select("id, title, document_type, current_version").eq("tender_id", tenderId).order("created_at"),
  ]);
  if (!tender) notFound();
  const documentIds = (documents ?? []).map((document) => document.id);
  const { data: versions, error: versionsError } = documentIds.length
    ? await supabase.from("source_document_versions").select("id, source_document_id, version, storage_path, sha256, byte_size").in("source_document_id", documentIds).order("version", { ascending: false })
    : { data: [], error: null };
  if (versionsError) throw new Error("Source document versions could not be loaded.");
  const signedVersions = await Promise.all((versions ?? []).map(async (version) => {
    const { data: signed, error } = await supabase.storage.from("tender-source-documents").createSignedUrl(version.storage_path, 300);
    if (error || !signed) throw new Error("A source document download link could not be created.");
    return { ...version, signedUrl: signed.signedUrl };
  }));
  const versionsByDocument = new Map<string, typeof signedVersions>();
  signedVersions.forEach((version) => {
    const current = versionsByDocument.get(version.source_document_id) ?? [];
    current.push(version);
    versionsByDocument.set(version.source_document_id, current);
  });
  const canManage = membership.role !== "viewer";
  const uploadDocument = uploadSourceDocument.bind(null, tenderId, organisationId);

  return (
    <section className="space-y-6">
      <div>
        <Link href={`/dashboard/${organisationId}/tenders/${tenderId}`} className="text-sm font-semibold text-[var(--tgos-primary)]">← Overview</Link>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--tgos-navy)]">Documents</h1>
        <p className="mt-2 text-sm text-[var(--tgos-muted)]">{tender.title} · immutable source versions</p>
      </div>
      <TenderSubnav organisationId={organisationId} tenderId={tenderId} current="documents" />
      {canManage ? (
        <form action={uploadDocument} encType="multipart/form-data" className="space-y-3 rounded-[10px] border border-[var(--tgos-border)] bg-white p-4">
          <h2 className="font-semibold text-[var(--tgos-navy)]">Upload document</h2>
          <label className="block text-sm font-medium">Existing document
            <select name="sourceDocumentId" className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2">
              <option value="">New source document</option>
              {(documents ?? []).map((document) => <option key={document.id} value={document.id}>{document.title} (v{document.current_version})</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">Title<input name="title" required minLength={2} maxLength={200} className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
            <label className="block text-sm font-medium">Type<input name="documentType" required minLength={2} maxLength={80} placeholder="ITT, clarification, schedule" className="mt-1 w-full min-h-11 rounded-[10px] border border-[var(--tgos-border)] px-3 py-2" /></label>
          </div>
          <label className="block text-sm font-medium">Choose files<input name="file" type="file" required className="mt-1 block w-full text-sm" /></label>
          <p className="text-xs text-[var(--tgos-subtle)]">Accepted via file picker. Maximum 25 MB. Drag-and-drop is not required.</p>
          <button className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white">Upload immutable version</button>
        </form>
      ) : null}
      <div className="space-y-3">
        {(documents ?? []).map((document) => (
          <article key={document.id} className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-4 text-sm">
            <div className="flex justify-between gap-3"><h2 className="font-semibold text-[var(--tgos-navy)]">{document.title}</h2><span className="text-[var(--tgos-subtle)]">{document.document_type}</span></div>
            <ul className="mt-2 space-y-1">
              {(versionsByDocument.get(document.id) ?? []).map((version) => (
                <li key={version.id}><a href={version.signedUrl} className="text-[var(--tgos-primary)]">Version {version.version} · {version.byte_size.toLocaleString("en-GB")} bytes · {version.sha256.slice(0, 12)}…</a></li>
              ))}
            </ul>
          </article>
        ))}
        {(documents ?? []).length === 0 ? <p className="text-sm text-[var(--tgos-muted)]">No source documents yet.</p> : null}
      </div>
    </section>
  );
}
