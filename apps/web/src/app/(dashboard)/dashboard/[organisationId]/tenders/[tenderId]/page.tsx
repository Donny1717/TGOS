import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createEvidence,
  createRequirement,
  createTenderLot,
  createTenderTask,
  linkRequirementEvidence,
  unlinkRequirementEvidence,
  updateRequirementStatus,
  updateTenderStatus,
  updateTenderTaskStatus,
  uploadSourceDocument,
} from "@/app/actions";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";
import { evaluateEvidenceValidity } from "@/lib/evidence";

type TenderPageProps = {
  params: Promise<{ organisationId: string; tenderId: string }>;
};

export default async function TenderPage({ params }: TenderPageProps) {
  const { organisationId, tenderId } = await params;
  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    const tender = tenderId === "westshire-fm"
      ? { title: "Westshire FM Contract", buyer: "Westshire County Council", reference: "WCC-FM-118", deadline: "18 September 2026 · 12:00", description: "Facilities management services across civic offices and community buildings." }
      : tenderId === "nhs-data-platform"
        ? { title: "NHS Data Platform", buyer: "North Midlands NHS Trust", reference: "NMDP-26-09", deadline: "22 September 2026 · 17:00", description: "Secure data platform implementation and managed support services." }
        : { title: "Civic Digital Services Framework", buyer: "Civic Services Authority", reference: "CDS-2026-04", deadline: "12 September 2026 · 17:00", description: "A multi-lot framework for accessible, secure digital services across local government." };

    return (
      <section className="space-y-6">
        <div><Link href="/dashboard/demo/tenders" className="text-sm font-medium text-cyan-700 hover:text-cyan-900">← Tender workspaces</Link><div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-cyan-700">{tender.buyer}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{tender.title}</h1><p className="mt-2 text-sm text-slate-500">Reference: {tender.reference}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">In progress</span></div></div>
        <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Tender brief</h2><p className="mt-3 text-sm leading-6 text-slate-700">{tender.description}</p></section><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Key dates</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Submission deadline</dt><dd className="font-medium text-slate-800">{tender.deadline}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Evidence coverage</dt><dd className="font-medium text-emerald-700">94%</dd></div></dl></section></div>
        <div className="grid gap-6 lg:grid-cols-3"><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-900">Tasks</h2><div className="mt-4 space-y-3">{["Review mandatory requirements", "Confirm insurance schedule", "Finalise quality response"].map((task, index) => <div key={task} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm"><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${index === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{index === 0 ? "✓" : "!"}</span><span className="text-slate-700">{task}</span></div>)}</div></section><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-900">Source documents</h2><div className="mt-4 space-y-3 text-sm">{["Invitation to tender.pdf", "Specification and requirements.docx", "Pricing schedule.xlsx"].map((document) => <div key={document} className="rounded-lg bg-slate-50 p-3 text-slate-700">▤ {document}<p className="mt-1 text-xs text-slate-400">Current version · indexed</p></div>)}</div></section><section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-900">Evidence register</h2><div className="mt-4 space-y-3 text-sm">{["ISO 9001 certificate", "Cyber Essentials Plus", "Case study: Birmingham"].map((item) => <div key={item} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="text-slate-700">{item}</span><span className="text-xs font-semibold text-emerald-700">Ready</span></div>)}</div></section></div>
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-500">Local preview data only. Actions and uploads are disabled.</p>
      </section>
    );
  }
  const { membership, supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: tender, error }, { data: tasks }, { data: lots }, { data: documents }, { data: requirements }, { data: evidence }, { data: evidenceLinks }] = await Promise.all([
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
    supabase.from("requirement_evidence_links").select("requirement_id, evidence_item_id").eq("organisation_id", organisationId),
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
  const changeTenderStatus = updateTenderStatus.bind(null, tenderId, organisationId);
  const changeTaskStatus = updateTenderTaskStatus.bind(null, tenderId, organisationId);
  const changeRequirementStatus = updateRequirementStatus.bind(null, tenderId, organisationId);
  const linkEvidence = linkRequirementEvidence.bind(null, tenderId, organisationId);
  const unlinkEvidence = unlinkRequirementEvidence.bind(null, tenderId, organisationId);
  const evidenceValidity = evaluateEvidenceValidity(evidence ?? [], tender.contract_start_date);
  const linkedEvidenceByRequirement = new Map<string, Set<string>>();
  (evidenceLinks ?? []).forEach((link) => {
    const linked = linkedEvidenceByRequirement.get(link.requirement_id) ?? new Set<string>();
    linked.add(link.evidence_item_id);
    linkedEvidenceByRequirement.set(link.requirement_id, linked);
  });
  const requirementCount = requirements?.length ?? 0;
  const coveredRequirementCount = (requirements ?? []).filter((requirement) => {
    const linked = linkedEvidenceByRequirement.get(requirement.id);
    return linked && linked.size > 0;
  }).length;
  const evidenceCoverage = requirementCount ? Math.round((coveredRequirementCount / requirementCount) * 100) : 0;

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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Tender brief</h2>
            {membership.role !== "member" && membership.role !== "viewer" && (
              <form action={changeTenderStatus} className="flex items-center gap-2">
                <label htmlFor="tender-status" className="sr-only">Tender status</label>
                <select id="tender-status" name="status" defaultValue={tender.status} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                  {["draft", "bid_decision", "active", "submitted", "awarded", "lost", "archived"].map((status) => (
                    <option key={status} value={status}>{status.replace("_", " ")}</option>
                  ))}
                </select>
                <button className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white">Save</button>
              </form>
            )}
          </div>
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
                <div className="flex justify-between gap-3">
                  <span>{task.title}</span>
                  {canManage ? (
                    <form action={changeTaskStatus}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <label htmlFor={`task-status-${task.id}`} className="sr-only">Task status</label>
                      <select id={`task-status-${task.id}`} name="status" defaultValue={task.status} className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs capitalize text-slate-600">
                        {["open", "in_progress", "blocked", "done"].map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                      </select>
                      <button className="ml-1 text-xs font-semibold text-blue-700">Save</button>
                    </form>
                  ) : <span className="capitalize text-slate-500">{task.status.replace("_", " ")}</span>}
                </div>
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Requirements matrix</h2>
              <p className="mt-2 text-sm text-slate-600">{requirementCount} requirement{requirementCount === 1 ? "" : "s"} recorded. Every requirement must cite a document, version, page and section.</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${evidenceCoverage === 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{evidenceCoverage}% evidence coverage</span>
          </div>
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
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{requirement.title}</span>
                  {canManage ? (
                    <form action={changeRequirementStatus}>
                      <input type="hidden" name="requirementId" value={requirement.id} />
                      <label htmlFor={`requirement-status-${requirement.id}`} className="sr-only">Requirement status</label>
                      <select id={`requirement-status-${requirement.id}`} name="status" defaultValue={requirement.status} className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs capitalize text-slate-600">
                        {["open", "in_progress", "satisfied", "at_risk", "waived"].map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                      </select>
                      <button className="ml-1 text-xs font-semibold text-blue-700">Save</button>
                    </form>
                  ) : <span className="capitalize text-slate-500">{requirement.status.replace("_", " ")}</span>}
                </div>
                <p className="mt-1 text-slate-700">{requirement.requirement_text}</p>
                <p className="mt-2 text-xs text-slate-500">Source: page {requirement.source_page}, {requirement.source_section}</p>
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Linked evidence</p>
                  <div className="mt-2 space-y-2">
                    {[...(linkedEvidenceByRequirement.get(requirement.id) ?? [])].map((evidenceId) => {
                      const item = (evidence ?? []).find((candidate) => candidate.id === evidenceId);
                      return item ? (
                        <div key={evidenceId} className="flex items-center justify-between gap-2">
                          <p className="text-xs text-emerald-700">✓ {item.title}</p>
                          {canManage && (
                            <form action={unlinkEvidence}>
                              <input type="hidden" name="requirementId" value={requirement.id} />
                              <input type="hidden" name="evidenceItemId" value={item.id} />
                              <button className="text-xs font-semibold text-rose-700 hover:text-rose-900">Unlink</button>
                            </form>
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                  {canManage && (evidence ?? []).length > 0 && (
                    <form action={linkEvidence} className="mt-2 flex flex-wrap gap-2">
                      <input type="hidden" name="requirementId" value={requirement.id} />
                      <select name="evidenceItemId" required className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-xs">
                        <option value="">Link evidence…</option>
                        {(evidence ?? []).filter((item) => !(linkedEvidenceByRequirement.get(requirement.id)?.has(item.id))).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                      </select>
                      <button className="rounded bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white">Link</button>
                    </form>
                  )}
                </div>
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
