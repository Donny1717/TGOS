# Architecture

**Version:** 2026-09-06. Corrected from `TENDER.GATE.OS_Full_Stack_Architecture_Agent_Blueprint.md`.

Two corrections applied: the deployment platform assertion is removed, and the milestone scheme is unified with the roadmap document.

---

## 1. Objectives

1. Keep each organisation's tender data strictly isolated.
2. Ingest tender documents while preserving originals and versions.
3. Extract buyer requirements with source citations and human approval.
4. Store supplier evidence once, reuse it safely across tenders.
5. Generate and cross-validate the connected document suite.
6. Detect hard-fail and cross-document inconsistencies before submission.
7. Ground AI only in approved evidence and tender sources.
8. Enforce entitlements, usage controls and Stripe billing.
9. Provide audit logging suitable for commercially sensitive work.
10. Scale from SME self-serve to consultant workspace.

## 2. Tenant model

Every customer-owned row carries `organisation_id`. RLS on every such table. Server-side role and membership checks in addition to RLS — never RLS alone, never application checks alone.

**Acceptance test:** two organisations cannot read each other's data in an automated test. This is a build gate, not a wish.

## 3. Regulatory data as a package

`packages/regulatory-data/` holds the dataset and its validator. Nothing else in the codebase may contain a regulatory constant.

```
packages/regulatory-data/
  regulatory-dataset.json
  validate.mjs
  index.ts               typed accessor by id
```

`packages/rules-engine/` consumes it. Rules read thresholds and comparators from the dataset at evaluation time. Changing a threshold changes one JSON field and no code.

**CI gate:** `node packages/regulatory-data/validate.mjs` must exit 0 before build. Wire it as a pre-commit hook too.

## 4. Rule engine contract

Every rule returns:

```ts
{
  rule: string;
  status: "APPLIES" | "NOT_APPLICABLE" | "UNKNOWN" | <rule-specific state>;
  dutyHolder: "supplier" | "contracting_authority" | null;
  detail: string;
  basis: string;          // legal basis from the dataset
  sources: string[];      // primary source URLs
  missing?: string[];     // named inputs required to resolve UNKNOWN
}
```

Three properties are non-negotiable:

**UNKNOWN is a first-class result.** A rule with insufficient input returns UNKNOWN and names what is missing. It never defaults to pass and never defaults to fail.

**`dutyHolder` is mandatory.** A duty on the contracting authority must never render on a supplier's task list. Two of the six implemented rules are buyer duties; presenting them as supplier obligations was a defect in the August pack.

**`sources` travels with the result.** A finding the user cannot trace is indistinguishable from an invention.

## 5. Document pipeline

Deterministic Markdown to DOCX. No AI in the generation path.

The `.docx` files in the legacy project folder are Markdown with a renamed extension, not Word files. Verified by inspection. Any tooling that assumes OOXML on those inputs will fail.

**Export gating.** Draft export is available on every plan including Free. Final export is the only gated output, and is blocked while any hard-fail control is unresolved. A waiver requires a named person and a recorded reason, stored in the audit log.

## 6. AI boundary

AI may: extract requirements from a source document with a page and section citation for human confirmation; plan and draft answers from approved evidence; run gap and red-team review.

AI may not: introduce a fact absent from approved evidence; state a regulatory value — those come from the dataset only; approve anything.

Every AI-produced element carries provenance and an approval state. Nothing AI-produced reaches a final export unapproved.

## 7. Security controls

- Supabase RLS on every tenant-owned table
- Server-side role and membership checks
- Private storage buckets, short-lived signed URLs
- File metadata, version and hash recording
- Secrets in environment variables only
- Signed Stripe webhook verification
- Rate limits on auth, upload, AI, generation, export
- Audit log for sensitive events
- Log redaction for document text and commercial content
- Retention and deletion design; organisation data export
- Security headers, CSP, CSRF-safe sessions

### Audit events

```
organisation_created            member_invited
role_changed                    tender_created
document_uploaded               document_version_created
extraction_started              extraction_confirmed
requirement_created             requirement_approved
evidence_linked                 answer_generated
answer_approved                 pricing_changed
audit_run                       audit_finding_resolved
audit_finding_waived            document_generated
document_exported               approval_granted
approval_invalidated            submission_receipt_recorded
subscription_changed            regulatory_dataset_updated
```

Two additions over the August list: `audit_finding_waived`, because a waived hard-fail is the single most consequential action in the product; and `regulatory_dataset_updated`, because the dataset is now a controlled artefact.

## 8. Environments and configuration

```
local  ·  preview  ·  staging  ·  production
```

```
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AI_PROVIDER_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
EMAIL_PROVIDER_API_KEY
SENTRY_DSN
ANALYTICS_KEY
STORAGE_SIGNING_SECRET_OR_PROVIDER_CONFIG
```

Separate Supabase project for production. Automated preview deployment per pull request. Production deployment requires tests, build and migration checks to pass. Back-up and recovery runbook. Health endpoint and uptime monitor.

**Hosting platform: undecided until M10.** Do not encode a provider assumption into build scripts before that decision.

## 9. Migration discipline

New additive migrations only. Inspect the latest migration timestamp and choose a later one. Never modify a previous migration. Reuse the established `updated_at` trigger and membership helpers.

## 10. Architecture acceptance tests

Complete only when:

1. Two organisations cannot access one another's data in automated RLS tests.
2. `validate.mjs` exits 0 in CI.
3. `rules.test.mjs` passes, including every boundary fixture.
4. Final export is provably blocked while a hard-fail control is unresolved.
5. A waiver writes a named person and reason to the audit log.
6. No regulatory constant exists outside `packages/regulatory-data/`.
7. Every AI-produced element carries provenance and an approval state.
