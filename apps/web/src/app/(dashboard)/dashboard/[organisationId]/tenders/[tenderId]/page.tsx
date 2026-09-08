import Link from "next/link";
import { notFound } from "next/navigation";
import { createEvidence, createRequirement, createTenderLot, createTenderTask, uploadSourceDocument } from "@/app/actions";
import { requireOrganisationMembership } from "@/lib/auth";
import { evaluateEvidenceValidity } from "@/lib/evidence";

type TenderPageProps = {
  params: Promise<{ organisationId: string; tenderId: string }>;
};

export default async function TenderPage({ params }: TenderPageProps) {
  const { organisationId, tenderId } = await params;
  const { membership, supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: tender, error }, { data: tasks }, { data: lots }, { data: documents }, { data: requirements }, { data: evidence }] = await Promise.all([
    supabase
      .from("tenders")
      .select("id, title, buyer_name, reference, description, status, submission_deadline, contract_start_date, notice_url")
      .eq("id", tenderId)
      .eq("organisation_id", organisationId)
      .maybeSingle(),
    supabase.from("tender_tasks").select("id, title, status, due_at").eq("tender_id", tenderId).order("due_at"),
    supabase.from("tender_lots").select("id, name, reference, description").eq("tender_id", tenderId).order("created_at"),
    supabase.from("source_documents").select("id, title, document_type, current_version").eq("tender_id", tenderId).order("created_at"),
    supabase.from("requirements").select("id, title, requirement_text, classification, status, due_at, source_document_id, source_document_version_id, source_page, source_section").eq("tender_id", tenderId).order("due_at", { nullsFirst: false }),
    supabase.from("evidence_items").select("id, title, evidence_type, description, expires_on, source_document_id, source_document_version_id").eq("tender_id", tenderId).order("expires_on", { nullsFirst: false }),
  ]);

  if (error) throw new Error("Tender workspace could not be loaded.");
  if (!tender) notFound();

  const documentIds = (documents ?? []).map((document) => document.id);
  const { data: versions, error: versionsError } = documentIds.length
    ? await supabase
        .from("source_document_versions")
        .select("id, source_document_id, version, storage_path, sha256, byte_size, mime_type, created_at")
        .in("source_document_id", documentIds)
        .order("version", { ascending: false })
    : { data: [], error: null };

  if (versionsError) throw new Error("Source document versions could not be loaded.");
  const signedVersions = await Promise.all(
    (versions ?? []).map(async (version) => {
      const { data: signed, error: signedError } = await supabase.storage
        .from("tender-source-documents")
        .createSignedUrl(version.storage_path, 300);
      if (signedError || !signed) throw new Error("A source document download link could not be created.");
      return { ...version, signedUrl: signed.signedUrl };
    }),
  );
  const versionsByDocument = new Map<string, typeof signedVersions>();
  signedVersions.forEach((version) => {
    const current = versionsByDocument.get(version.source_document_id) ?? [];
    current.push(version);
    versionsByDocument.set(version.source_document_id, current);
  });
  const canManage = membership.role !== "viewer";
  const addLot = createTenderLot.bind(null, tenderId, organisationId);
  const addTask = createTenderTask.bind(null, tenderId, organisationId);
  const uploadDocument = uploadSourceDocument.bind(null, tenderId, organisationId);
  const addRequirement = createRequirement.bind(null, tenderId, organisationId);
  const addEvidence = createEvidence.bind(null, tenderId, organisationId);
  const evidenceValidity = evaluateEvidenceValidity(evidence ?? [], tender.contract_start_date);

  return (
    <section className="space-y-6">
      <div>
        <Link href={`/dashboard/${organisationId}/tenders`} className="text-sm font-medium text-blue-700 hover:text-blue-900">
          ← Tender workspaces
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">{tender.buyer_name}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{tender.title}</h1>
            {tender.reference && <p className="mt-2 text-sm text-slate-600">Reference: {tender.reference}</p>}
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
            {tender.status.replace("_", " ")}
          </span>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Tender brief</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{tender.description || "No description added."}</p>
          {tender.notice_url && (
            <a href={tender.notice_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900">
              Open notice
            </a>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Key dates</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Submission deadline</dt><dd>{tender.submission_deadline ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(tender.submission_deadline)) : "Not set"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Contract start</dt><dd>{tender.contract_start_date ?? "Not set"}</dd></div>
          </dl>
        </section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <p className="mt-2 text-sm text-slate-600">{tasks?.length ?? 0} task{tasks?.length === 1 ? "" : "s"} recorded.</p>
          {canManage && (
            <form action={addTask} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <label className="block text-sm font-medium">
                Task
                <input name="title" required minLength={2} maxLength={200} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">
                Due (Europe/London)
                <input name="dueAt" type="datetime-local" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">Add task</button>
            </form>
          )}
          <div className="mt-4 space-y-2">
            {(tasks ?? []).map((task) => (
              <div key={task.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                <div className="flex justify-between gap-3"><span>{task.title}</span><span className="capitalize text-slate-500">{task.status.replace("_", " ")}</span></div>
                {task.due_at && <p className="mt-1 text-xs text-slate-500">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(task.due_at))}</p>}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Source Document Room</h2>
          <p className="mt-2 text-sm text-slate-600">{documents?.length ?? 0} source document{documents?.length === 1 ? "" : "s"} recorded.</p>
          {canManage && (
            <form action={uploadDocument} encType="multipart/form-data" className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <label className="block text-sm font-medium">
                Existing document
                <select name="sourceDocumentId" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">New source document</option>
                  {(documents ?? []).map((document) => <option key={document.id} value={document.id}>{document.title} (v{document.current_version})</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Title
                  <input name="title" required minLength={2} maxLength={200} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="block text-sm font-medium">
                  Type
                  <input name="documentType" required minLength={2} maxLength={80} placeholder="ITT, clarification, schedule" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                </label>
              </div>
              <input name="file" type="file" required className="block w-full text-sm" />
              <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">Upload immutable version</button>
              <p className="text-xs text-slate-500">Maximum 25 MB. Files are private, hashed with SHA-256 and retained as immutable versions.</p>
            </form>
          )}
          <div className="mt-4 space-y-3">
            {(documents ?? []).map((document) => (
              <div key={document.id} className="rounded-md bg-slate-50 px-3 py-3 text-sm">
                <div className="flex justify-between gap-3"><span className="font-medium">{document.title}</span><span className="text-slate-500">{document.document_type}</span></div>
                <div className="mt-2 space-y-1">
                  {(versionsByDocument.get(document.id) ?? []).map((version) => (
                    <a key={version.id} href={version.signedUrl} className="block text-xs text-blue-700 hover:text-blue-900">
                      Version {version.version} · {version.byte_size.toLocaleString("en-GB")} bytes · {version.sha256.slice(0, 12)}…
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Lots</h2>
        <p className="mt-2 text-sm text-slate-600">{lots?.length ?? 0} lot{lots?.length === 1 ? "" : "s"} recorded.</p>
        {canManage && (
          <form action={addLot} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-3">
            <input name="name" required minLength={1} maxLength={160} placeholder="Lot name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input name="reference" maxLength={120} placeholder="Lot reference" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input name="description" maxLength={10000} placeholder="Description" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 md:col-span-3 md:w-fit">Add lot</button>
          </form>
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(lots ?? []).map((lot) => (
            <div key={lot.id} className="rounded-md bg-slate-50 px-3 py-3 text-sm">
              <p className="font-medium">{lot.name}{lot.reference ? ` · ${lot.reference}` : ""}</p>
              {lot.description && <p className="mt-1 text-slate-600">{lot.description}</p>}
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Requirements matrix</h2>
          <p className="mt-2 text-sm text-slate-600">{requirements?.length ?? 0} requirement{requirements?.length === 1 ? "" : "s"} recorded. Every requirement must cite a document, version, page and section.</p>
          {canManage && (versions ?? []).length > 0 && (
            <form action={addRequirement} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <input name="title" required minLength={2} maxLength={200} placeholder="Requirement title" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <textarea name="requirementText" required minLength={2} maxLength={20000} placeholder="Requirement text" rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="classification" required minLength={2} maxLength={80} placeholder="Classification" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="sourcePage" required type="number" min="1" placeholder="Source page" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="sourceSection" required minLength={1} maxLength={200} placeholder="Source section" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="dueAt" type="datetime-local" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <select name="sourceDocumentVersionId" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">Select source version</option>
                {(versions ?? []).map((version) => <option key={version.id} value={version.id}>{version.version} · {version.storage_path.split("/").pop()}</option>)}
              </select>
              <select name="sourceDocumentId" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">Select source document</option>
                {(documents ?? []).map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
              </select>
              <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">Add requirement</button>
            </form>
          )}
          <div className="mt-4 space-y-3">
            {(requirements ?? []).map((requirement) => (
              <div key={requirement.id} className="rounded-md bg-slate-50 px-3 py-3 text-sm">
                <div className="flex justify-between gap-3"><span className="font-medium">{requirement.title}</span><span className="capitalize text-slate-500">{requirement.status.replace("_", " ")}</span></div>
                <p className="mt-1 text-slate-700">{requirement.requirement_text}</p>
                <p className="mt-2 text-xs text-slate-500">Source: page {requirement.source_page}, {requirement.source_section}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Evidence Locker</h2>
          <p className="mt-2 text-sm text-slate-600">{evidence?.length ?? 0} evidence item{evidence?.length === 1 ? "" : "s"} recorded. Validity is measured to contract start.</p>
          {evidenceValidity.status !== "pass" && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{evidenceValidity.message}</p>
          )}
          {canManage && (versions ?? []).length > 0 && (
            <form action={addEvidence} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <input name="title" required minLength={2} maxLength={200} placeholder="Evidence title" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="evidenceType" required minLength={2} maxLength={80} placeholder="Insurance, accreditation..." className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                <input name="expiresOn" type="date" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <textarea name="description" maxLength={10000} placeholder="What this evidence proves" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <select name="sourceDocumentVersionId" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">Select source version</option>
                {(versions ?? []).map((version) => <option key={version.id} value={version.id}>{version.version} · {version.storage_path.split("/").pop()}</option>)}
              </select>
              <select name="sourceDocumentId" required className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">Select source document</option>
                {(documents ?? []).map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}
              </select>
              <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">Add evidence</button>
            </form>
          )}
          <div className="mt-4 space-y-3">
            {(evidence ?? []).map((item) => (
              <div key={item.id} className="rounded-md bg-slate-50 px-3 py-3 text-sm">
                <div className="flex justify-between gap-3"><span className="font-medium">{item.title}</span><span className="text-slate-500">{item.evidence_type}</span></div>
                {item.description && <p className="mt-1 text-slate-600">{item.description}</p>}
                <p className="mt-2 text-xs text-slate-500">{item.expires_on ? `Expires ${item.expires_on}` : "No expiry date recorded"}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
