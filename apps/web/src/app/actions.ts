"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { z } from "zod";
import { requireOrganisationMembership, requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const organisationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const passportSchema = z.object({
  legalName: z.string().trim().min(2).max(160),
  tradingName: z.string().trim().max(160),
  companyNumber: z.string().trim().max(32),
  vatNumber: z.string().trim().max(32),
  addressLine1: z.string().trim().max(160),
  addressLine2: z.string().trim().max(160),
  townOrCity: z.string().trim().max(100),
  postcode: z.string().trim().max(24),
  financialYearEnd: z.string().trim(),
  annualTurnover: z.string().trim(),
  netAssets: z.string().trim(),
  policies: z.string().trim(),
  certifications: z.string().trim(),
  primaryContactName: z.string().trim().max(160),
  primaryContactEmail: z.string().trim().max(254),
  primaryContactPhone: z.string().trim().max(40),
});

const tenderSchema = z.object({
  title: z.string().trim().min(2).max(200),
  buyerName: z.string().trim().min(2).max(200),
  reference: z.string().trim().max(120),
  description: z.string().trim().max(10000),
  noticeUrl: z.string().trim().url().or(z.literal("")),
  submissionDeadline: z.string().trim(),
  contractStartDate: z.string().trim(),
});

const tenderLotSchema = z.object({
  name: z.string().trim().min(1).max(160),
  reference: z.string().trim().max(120),
  description: z.string().trim().max(10000),
});

const tenderTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  dueAt: z.string().trim(),
});

const sourceDocumentSchema = z.object({
  sourceDocumentId: z.string().uuid().or(z.literal("")),
  title: z.string().trim().min(2).max(200),
  documentType: z.string().trim().min(2).max(80),
});

const requirementSchema = z.object({
  classification: z.string().trim().min(2).max(80),
  dueAt: z.string().trim(),
  requirementText: z.string().trim().min(2).max(20000),
  sourceDocumentId: z.string().uuid(),
  sourceDocumentVersionId: z.string().uuid(),
  sourcePage: z.coerce.number().int().positive(),
  sourceSection: z.string().trim().min(1).max(200),
  title: z.string().trim().min(2).max(200),
});

const evidenceSchema = z.object({
  description: z.string().trim().max(10000),
  evidenceType: z.string().trim().min(2).max(80),
  expiresOn: z.string().trim(),
  sourceDocumentId: z.string().uuid(),
  sourceDocumentVersionId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
});

const tenderStatusSchema = z.enum(["draft", "bid_decision", "active", "submitted", "awarded", "lost", "archived"]);
const taskStatusSchema = z.enum(["open", "in_progress", "blocked", "done"]);
const requirementStatusSchema = z.enum(["open", "in_progress", "satisfied", "at_risk", "waived"]);
const evidenceLinkSchema = z.object({
  evidenceItemId: z.string().uuid(),
  requirementId: z.string().uuid(),
});

const issueSeveritySchema = z.enum(["critical", "high", "medium", "low"]);
const issueStateSchema = z.enum(["open", "in_progress", "awaiting_review", "resolved", "accepted_risk"]);
const gateDecisionSchema = z.enum(["go", "conditional_go", "no_go", "in_progress"]);

const issueSchema = z.object({
  citationText: z.string().trim().max(2000),
  dueOn: z.string().trim(),
  ownerName: z.string().trim().max(160),
  recommendedAction: z.string().trim().max(5000),
  requirementId: z.string().uuid().or(z.literal("")),
  severity: issueSeveritySchema,
  tenderId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  whyItMatters: z.string().trim().min(2).max(5000),
});

const issueStateUpdateSchema = z.object({
  acceptedRiskApproverName: z.string().trim().max(160),
  acceptedRiskReason: z.string().trim().max(5000),
  issueId: z.string().uuid(),
  state: issueStateSchema,
});

const gateApprovalSchema = z.object({
  acceptedRiskIssueIds: z.array(z.string().uuid()).default([]),
  approverName: z.string().trim().min(2).max(160),
  comment: z.string().trim().max(5000),
  decision: gateDecisionSchema,
  systemDecision: z.string().trim().max(40),
});

const maxSourceDocumentBytes = 25 * 1024 * 1024;

function readField(formData: FormData, field: string) {
  return String(formData.get(field) ?? "");
}

function toPence(value: string) {
  if (!value) return null;

  const normalized = value.replace(/,/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Financial values must be non-negative amounts with up to two decimal places.");
  }

  const [pounds, pence = ""] = normalized.split(".");
  return Number(pounds) * 100 + Number(pence.padEnd(2, "0"));
}

function toNamedItems(value: string) {
  return value
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function toContacts(input: z.infer<typeof passportSchema>) {
  if (!input.primaryContactName && !input.primaryContactEmail && !input.primaryContactPhone) {
    return [];
  }

  return [
    {
      email: input.primaryContactEmail || null,
      name: input.primaryContactName || null,
      phone: input.primaryContactPhone || null,
      type: "primary",
    },
  ];
}

function toLondonUtc(value: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error("Submission deadline must be a valid London date and time.");
  }

  const requestedUtc = Date.parse(`${value}:00Z`);
  const displayedParts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Europe/London",
    year: "numeric",
  })
    .formatToParts(new Date(requestedUtc))
    .reduce<Record<string, string>>((parts, part) => {
      if (part.type !== "literal") parts[part.type] = part.value;
      return parts;
    }, {});

  const displayedUtc = Date.UTC(
    Number(displayedParts.year),
    Number(displayedParts.month) - 1,
    Number(displayedParts.day),
    Number(displayedParts.hour),
    Number(displayedParts.minute),
  );

  return new Date(requestedUtc - (displayedUtc - requestedUtc)).toISOString();
}

async function writeAuditEvent(
  organisationId: string,
  actorId: string,
  eventType: string,
  eventData: Record<string, unknown> = {},
) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("audit_events").insert({
    actor_id: actorId,
    event_data: eventData,
    event_type: eventType,
    organisation_id: organisationId,
  });

  if (error) throw new Error("The audit event could not be recorded.");
}

function safeStorageFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "source-document";
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function requestSignInLink(formData: FormData) {
  const email = z.string().trim().email().parse(readField(formData, "email"));
  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.WEB_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    throw new Error("The sign-in link could not be sent.");
  }

  redirect("/sign-in?sent=1");
}

export async function createOrganisation(formData: FormData) {
  const input = organisationSchema.parse({
    name: readField(formData, "name"),
    slug: readField(formData, "slug"),
  });
  const { user } = await requireUser();
  const admin = createSupabaseAdminClient();

  const { data: organisation, error: organisationError } = await admin
    .from("organisations")
    .insert({ created_by: user.id, name: input.name, slug: input.slug })
    .select("id")
    .single();

  if (organisationError || !organisation) {
    throw new Error(organisationError?.message ?? "The organisation could not be created.");
  }

  const { error: membershipError } = await admin.from("organisation_members").insert({
    organisation_id: organisation.id,
    role: "owner",
    user_id: user.id,
  });

  if (membershipError) {
    await admin.from("organisations").delete().eq("id", organisation.id);
    throw new Error("The owner membership could not be created.");
  }

  await writeAuditEvent(organisation.id, user.id, "organisation_created");
  redirect(`/dashboard/${organisation.id}`);
}

export async function createTender(organisationId: string, formData: FormData) {
  const input = tenderSchema.parse({
    buyerName: readField(formData, "buyerName"),
    contractStartDate: readField(formData, "contractStartDate"),
    description: readField(formData, "description"),
    noticeUrl: readField(formData, "noticeUrl"),
    reference: readField(formData, "reference"),
    submissionDeadline: readField(formData, "submissionDeadline"),
    title: readField(formData, "title"),
  });
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);

  const { data: tender, error } = await supabase
    .from("tenders")
    .insert({
      buyer_name: input.buyerName,
      contract_start_date: input.contractStartDate || null,
      created_by: user.id,
      description: input.description,
      notice_url: input.noticeUrl || null,
      organisation_id: organisationId,
      owner_id: user.id,
      reference: input.reference || null,
      submission_deadline: toLondonUtc(input.submissionDeadline),
      title: input.title,
    })
    .select("id")
    .single();

  if (error || !tender) {
    throw new Error(error?.message ?? "The tender could not be created.");
  }

  await writeAuditEvent(organisationId, user.id, "tender_created");
  revalidatePath(`/dashboard/${organisationId}`);
  revalidatePath(`/dashboard/${organisationId}/tenders`);
  redirect(`/dashboard/${organisationId}/tenders/${tender.id}`);
}

export async function createTenderLot(tenderId: string, organisationId: string, formData: FormData) {
  const input = tenderLotSchema.parse({
    description: readField(formData, "description"),
    name: readField(formData, "name"),
    reference: readField(formData, "reference"),
  });
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const { error } = await supabase.from("tender_lots").insert({
    description: input.description,
    name: input.name,
    reference: input.reference || null,
    tender_id: tenderId,
  });

  if (error) throw new Error("The tender lot could not be created.");

  await writeAuditEvent(organisationId, user.id, "tender_lot_created");
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
}

export async function createTenderTask(tenderId: string, organisationId: string, formData: FormData) {
  const input = tenderTaskSchema.parse({
    dueAt: readField(formData, "dueAt"),
    title: readField(formData, "title"),
  });
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const { error } = await supabase.from("tender_tasks").insert({
    created_by: user.id,
    due_at: input.dueAt ? toLondonUtc(input.dueAt) : null,
    organisation_id: organisationId,
    owner_id: user.id,
    tender_id: tenderId,
    title: input.title,
  });

  if (error) throw new Error("The tender task could not be created.");

  await writeAuditEvent(organisationId, user.id, "tender_task_created");
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
}

export async function uploadSourceDocument(tenderId: string, organisationId: string, formData: FormData) {
  const input = sourceDocumentSchema.parse({
    documentType: readField(formData, "documentType") || "other",
    sourceDocumentId: readField(formData, "sourceDocumentId"),
    title: readField(formData, "title"),
  });
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a source document to upload.");
  }
  if (file.size > maxSourceDocumentBytes) {
    throw new Error("Source documents must be 25 MB or smaller.");
  }

  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  let sourceDocumentId = input.sourceDocumentId;
  let version = 1;
  let createdDocument = false;

  if (sourceDocumentId) {
    const { data: existing, error } = await supabase
      .from("source_documents")
      .select("id, current_version")
      .eq("id", sourceDocumentId)
      .eq("tender_id", tenderId)
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (error || !existing) throw new Error("The source document could not be found.");
    version = existing.current_version + 1;
  } else {
    const { data: created, error } = await supabase
      .from("source_documents")
      .insert({
        created_by: user.id,
        document_type: input.documentType,
        organisation_id: organisationId,
        tender_id: tenderId,
        title: input.title,
      })
      .select("id")
      .single();

    if (error || !created) throw new Error("The source document could not be created.");
    sourceDocumentId = created.id;
    createdDocument = true;
  }

  const bytes = await file.arrayBuffer();
  const storagePath = `${organisationId}/${tenderId}/${sourceDocumentId}/v${version}-${safeStorageFilename(file.name)}`;
  const storage = supabase.storage.from("tender-source-documents");
  const { error: uploadError } = await storage.upload(storagePath, bytes, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) {
    if (createdDocument) await supabase.from("source_documents").delete().eq("id", sourceDocumentId);
    throw new Error("The source document file could not be uploaded.");
  }

  const hash = createHash("sha256").update(Buffer.from(bytes)).digest("hex");
  const { error: versionError } = await supabase.from("source_document_versions").insert({
    byte_size: file.size,
    created_by: user.id,
    mime_type: file.type || "application/octet-stream",
    sha256: hash,
    source_document_id: sourceDocumentId,
    storage_path: storagePath,
    version,
  });

  if (versionError) {
    await storage.remove([storagePath]);
    if (createdDocument) await supabase.from("source_documents").delete().eq("id", sourceDocumentId);
    throw new Error("The source document version could not be recorded.");
  }

  await writeAuditEvent(organisationId, user.id, createdDocument ? "document_uploaded" : "document_version_created");
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
}

export async function createRequirement(tenderId: string, organisationId: string, formData: FormData) {
  const input = requirementSchema.parse({
    classification: readField(formData, "classification"),
    dueAt: readField(formData, "dueAt"),
    requirementText: readField(formData, "requirementText"),
    sourceDocumentId: readField(formData, "sourceDocumentId"),
    sourceDocumentVersionId: readField(formData, "sourceDocumentVersionId"),
    sourcePage: readField(formData, "sourcePage"),
    sourceSection: readField(formData, "sourceSection"),
    title: readField(formData, "title"),
  });
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const { error } = await supabase.from("requirements").insert({
    classification: input.classification,
    created_by: user.id,
    due_at: input.dueAt ? toLondonUtc(input.dueAt) : null,
    organisation_id: organisationId,
    owner_id: user.id,
    requirement_text: input.requirementText,
    source_document_id: input.sourceDocumentId,
    source_document_version_id: input.sourceDocumentVersionId,
    source_page: input.sourcePage,
    source_section: input.sourceSection,
    tender_id: tenderId,
    title: input.title,
  });

  if (error) throw new Error("The requirement could not be created.");

  await writeAuditEvent(organisationId, user.id, "requirement_created");
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
}

export async function createEvidence(tenderId: string, organisationId: string, formData: FormData) {
  const input = evidenceSchema.parse({
    description: readField(formData, "description"),
    evidenceType: readField(formData, "evidenceType"),
    expiresOn: readField(formData, "expiresOn"),
    sourceDocumentId: readField(formData, "sourceDocumentId"),
    sourceDocumentVersionId: readField(formData, "sourceDocumentVersionId"),
    title: readField(formData, "title"),
  });
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const { error } = await supabase.from("evidence_items").insert({
    created_by: user.id,
    description: input.description,
    evidence_type: input.evidenceType,
    expires_on: input.expiresOn || null,
    organisation_id: organisationId,
    source_document_id: input.sourceDocumentId,
    source_document_version_id: input.sourceDocumentVersionId,
    tender_id: tenderId,
    title: input.title,
  });

  if (error) throw new Error("The evidence item could not be created.");

  await writeAuditEvent(organisationId, user.id, "evidence_created");
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
}

export async function updateTenderStatus(tenderId: string, organisationId: string, formData: FormData) {
  const status = tenderStatusSchema.parse(readField(formData, "status"));
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin"]);
  const { error } = await supabase
    .from("tenders")
    .update({ status })
    .eq("id", tenderId)
    .eq("organisation_id", organisationId);

  if (error) throw new Error("The tender status could not be updated.");

  await writeAuditEvent(organisationId, user.id, `tender_status_changed_${status}`);
  revalidatePath(`/dashboard/${organisationId}`);
  revalidatePath(`/dashboard/${organisationId}/tenders`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
}

export async function updateTenderTaskStatus(tenderId: string, organisationId: string, formData: FormData) {
  const taskId = z.string().uuid().parse(readField(formData, "taskId"));
  const status = taskStatusSchema.parse(readField(formData, "status"));
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const { error } = await supabase
    .from("tender_tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("tender_id", tenderId)
    .eq("organisation_id", organisationId);

  if (error) throw new Error("The tender task status could not be updated.");

  await writeAuditEvent(organisationId, user.id, `tender_task_status_changed_${status}`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
}

export async function updateRequirementStatus(tenderId: string, organisationId: string, formData: FormData) {
  const requirementId = z.string().uuid().parse(readField(formData, "requirementId"));
  const status = requirementStatusSchema.parse(readField(formData, "status"));
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const { error } = await supabase
    .from("requirements")
    .update({ status })
    .eq("id", requirementId)
    .eq("tender_id", tenderId)
    .eq("organisation_id", organisationId);

  if (error) throw new Error("The requirement status could not be updated.");

  await writeAuditEvent(organisationId, user.id, `requirement_status_changed_${status}`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
}

export async function linkRequirementEvidence(tenderId: string, organisationId: string, formData: FormData) {
  const input = evidenceLinkSchema.parse({
    evidenceItemId: readField(formData, "evidenceItemId"),
    requirementId: readField(formData, "requirementId"),
  });
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const { error } = await supabase.from("requirement_evidence_links").insert({
    created_by: user.id,
    evidence_item_id: input.evidenceItemId,
    organisation_id: organisationId,
    requirement_id: input.requirementId,
  });

  if (error) {
    if (error.code === "23505") throw new Error("This evidence is already linked to the requirement.");
    throw new Error("The evidence could not be linked to the requirement.");
  }

  await writeAuditEvent(organisationId, user.id, "requirement_evidence_linked");
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
}

export async function unlinkRequirementEvidence(tenderId: string, organisationId: string, formData: FormData) {
  const input = evidenceLinkSchema.parse({
    evidenceItemId: readField(formData, "evidenceItemId"),
    requirementId: readField(formData, "requirementId"),
  });
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const { error } = await supabase
    .from("requirement_evidence_links")
    .delete()
    .eq("requirement_id", input.requirementId)
    .eq("evidence_item_id", input.evidenceItemId)
    .eq("organisation_id", organisationId);

  if (error) throw new Error("The evidence could not be unlinked from the requirement.");

  await writeAuditEvent(organisationId, user.id, "requirement_evidence_unlinked");
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
}

export async function saveCompanyPassport(organisationId: string, formData: FormData) {
  const input = passportSchema.parse({
    addressLine1: readField(formData, "addressLine1"),
    addressLine2: readField(formData, "addressLine2"),
    annualTurnover: readField(formData, "annualTurnover"),
    certifications: readField(formData, "certifications"),
    companyNumber: readField(formData, "companyNumber"),
    financialYearEnd: readField(formData, "financialYearEnd"),
    legalName: readField(formData, "legalName"),
    netAssets: readField(formData, "netAssets"),
    policies: readField(formData, "policies"),
    postcode: readField(formData, "postcode"),
    primaryContactEmail: readField(formData, "primaryContactEmail"),
    primaryContactName: readField(formData, "primaryContactName"),
    primaryContactPhone: readField(formData, "primaryContactPhone"),
    townOrCity: readField(formData, "townOrCity"),
    tradingName: readField(formData, "tradingName"),
    vatNumber: readField(formData, "vatNumber"),
  });
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin"]);
  const { data: existing, error: existingError } = await supabase
    .from("company_passports")
    .select("id")
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (existingError) throw new Error("The Company Passport could not be checked.");

  const passport = {
    annual_turnover_pence: toPence(input.annualTurnover),
    certifications: toNamedItems(input.certifications),
    company_number: input.companyNumber || null,
    contacts: toContacts(input),
    financial_year_end: input.financialYearEnd || null,
    legal_name: input.legalName,
    net_assets_pence: toPence(input.netAssets),
    organisation_id: organisationId,
    policies: toNamedItems(input.policies),
    registered_address: {
      line1: input.addressLine1 || null,
      line2: input.addressLine2 || null,
      postcode: input.postcode || null,
      townOrCity: input.townOrCity || null,
    },
    trading_name: input.tradingName || null,
    updated_by: user.id,
    vat_number: input.vatNumber || null,
  };

  const result = existing
    ? await supabase.from("company_passports").update(passport).eq("id", existing.id)
    : await supabase.from("company_passports").insert({ ...passport, created_by: user.id });

  if (result.error) throw new Error("The Company Passport could not be saved.");

  await writeAuditEvent(organisationId, user.id, existing ? "company_passport_updated" : "company_passport_created");
  revalidatePath(`/dashboard/${organisationId}`);
  revalidatePath(`/dashboard/${organisationId}/passport`);
}

export async function deleteCompanyPassport(organisationId: string) {
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin"]);
  const { error } = await supabase.from("company_passports").delete().eq("organisation_id", organisationId);

  if (error) throw new Error("The Company Passport could not be deleted.");

  await writeAuditEvent(organisationId, user.id, "company_passport_deleted");
  revalidatePath(`/dashboard/${organisationId}`);
  revalidatePath(`/dashboard/${organisationId}/passport`);
}

export async function createIssue(organisationId: string, formData: FormData) {
  const requirementRaw = readField(formData, "requirementId");
  const input = issueSchema.parse({
    citationText: readField(formData, "citationText"),
    dueOn: readField(formData, "dueOn"),
    ownerName: readField(formData, "ownerName"),
    recommendedAction: readField(formData, "recommendedAction"),
    requirementId: requirementRaw,
    severity: readField(formData, "severity"),
    tenderId: readField(formData, "tenderId"),
    title: readField(formData, "title"),
    whyItMatters: readField(formData, "whyItMatters"),
  });
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const { data, error } = await supabase
    .from("issues")
    .insert({
      citation_text: input.citationText,
      created_by: user.id,
      due_on: input.dueOn || null,
      organisation_id: organisationId,
      owner_name: input.ownerName,
      recommended_action: input.recommendedAction,
      requirement_id: input.requirementId || null,
      severity: input.severity,
      tender_id: input.tenderId,
      title: input.title,
      why_it_matters: input.whyItMatters,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("The issue could not be created.");

  await writeAuditEvent(organisationId, user.id, "issue_created", {
    issueId: data.id,
    severity: input.severity,
    tenderId: input.tenderId,
  });
  revalidatePath(`/dashboard/${organisationId}/issues`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${input.tenderId}/issues`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${input.tenderId}/final-gate`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${input.tenderId}/report`);
}

export async function updateIssueState(organisationId: string, tenderId: string, formData: FormData) {
  const input = issueStateUpdateSchema.parse({
    acceptedRiskApproverName: readField(formData, "acceptedRiskApproverName"),
    acceptedRiskReason: readField(formData, "acceptedRiskReason"),
    issueId: readField(formData, "issueId"),
    state: readField(formData, "state"),
  });

  if (input.state === "accepted_risk") {
    if (input.acceptedRiskApproverName.length < 2 || input.acceptedRiskReason.length < 2) {
      throw new Error("Accepted risk requires a named approver and a reason.");
    }
  }

  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const patch =
    input.state === "accepted_risk"
      ? {
          accepted_risk_approver_name: input.acceptedRiskApproverName,
          accepted_risk_at: new Date().toISOString(),
          accepted_risk_reason: input.acceptedRiskReason,
          state: input.state,
        }
      : {
          accepted_risk_approver_name: null,
          accepted_risk_at: null,
          accepted_risk_reason: null,
          state: input.state,
        };

  const { error } = await supabase
    .from("issues")
    .update(patch)
    .eq("id", input.issueId)
    .eq("organisation_id", organisationId)
    .eq("tender_id", tenderId);

  if (error) throw new Error("The issue state could not be updated.");

  await writeAuditEvent(
    organisationId,
    user.id,
    input.state === "accepted_risk" ? "issue_accepted_risk" : `issue_state_changed_${input.state}`,
    {
      issueId: input.issueId,
      state: input.state,
      tenderId,
    },
  );
  revalidatePath(`/dashboard/${organisationId}/issues`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}/issues`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}/final-gate`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}/report`);
}

export async function recordGateApproval(tenderId: string, organisationId: string, formData: FormData) {
  const acceptedRaw = formData.getAll("acceptedRiskIssueIds").map((value) => String(value)).filter(Boolean);
  const input = gateApprovalSchema.parse({
    acceptedRiskIssueIds: acceptedRaw,
    approverName: readField(formData, "approverName"),
    comment: readField(formData, "comment"),
    decision: readField(formData, "decision"),
    systemDecision: readField(formData, "systemDecision"),
  });
  const { supabase, user } = await requireOrganisationMembership(organisationId, ["owner", "admin", "member"]);
  const { data, error } = await supabase
    .from("tender_gate_approvals")
    .insert({
      accepted_risk_issue_ids: input.acceptedRiskIssueIds,
      approver_name: input.approverName,
      approver_user_id: user.id,
      comment: input.comment,
      decision: input.decision,
      organisation_id: organisationId,
      system_decision: input.systemDecision || null,
      tender_id: tenderId,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("The gate approval could not be recorded.");

  await writeAuditEvent(organisationId, user.id, "gate_approval_recorded", {
    approvalId: data.id,
    decision: input.decision,
    systemDecision: input.systemDecision || null,
    tenderId,
  });
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}/final-gate`);
  revalidatePath(`/dashboard/${organisationId}/tenders/${tenderId}/report`);
  revalidatePath(`/dashboard/${organisationId}/reports`);
}

