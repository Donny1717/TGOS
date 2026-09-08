# Milestone Prompts

Prompts for delegating each milestone to a coding agent (Codex, Claude Code). Rewritten for TENDER.GATE.OS with the corrected constraints built in.

Every prompt inherits the standing constraints in section 0. Do not restate them per milestone; do not omit them either.

---

## 0. Standing constraints — apply to every milestone

```
PROJECT: TENDER.GATE.OS — UK public procurement compliance SaaS
FOLDER:  tender-gate-os
STACK:   Next.js App Router, TypeScript strict, Supabase (Auth/Postgres/
         Storage/RLS), Tailwind, Zod, Stripe

HARD CONSTRAINTS — violating any of these fails the milestone:

1. No regulatory constant may appear outside packages/regulatory-data/.
   Thresholds, percentages, comparators and dates are read from
   regulatory-dataset.json by id at evaluation time.

2. Every rule result carries dutyHolder. A duty on the contracting
   authority must never render on a supplier's task list.

3. UNKNOWN is a valid result. Insufficient input returns UNKNOWN with the
   missing fields named. Never default to pass. Never default to fail.

4. Money is stored and compared as integer pence. Never compare formatted
   currency strings.

5. Comparators come from the dataset. `above £5m` is not `>= £5m`.

6. Every tenant-owned row carries organisation_id with RLS, plus a
   server-side membership check. Not one or the other.

7. New additive migrations only. Inspect the latest timestamp, choose a
   later one, never modify a previous migration.

8. Deliver working code, migrations, tests, docs, env requirements and run
   commands. Not a progress narrative.

9. Before you report done: node tools/validate.mjs and every test file must
   exit 0. Paste the actual output. Do not assert that tests pass.

10. If a spec instruction conflicts with these constraints, stop and say so.
    Do not resolve it silently.
```

---

## M01 — Organisations, roles, Company Passport, RLS

```
Build the multi-tenant foundation.

SCOPE
- organisations, organisation_members, roles (owner/admin/member/viewer)
- Company Passport: legal identity, financial, policy, certification,
  contact data. Schema plus CRUD UI.
- RLS on every tenant-owned table
- Dashboard shell
- updated_at trigger, membership helper functions

GATE — must be demonstrated by an automated test
Two organisations cannot read each other's data. Write the test so it fails
if RLS is dropped, not only if the API layer is bypassed.

DELIVER
supabase/migrations/<timestamp>_organisations_and_passport.sql
apps/web/app/(dashboard)/...
tests/integration/rls-isolation.test.ts
Paste the passing test output.
```

## M02 — Tender workspace and Source Document Room

```
SCOPE
- tenders: metadata, lots, owners, deadlines, lifecycle states
- source documents: immutable originals, versioning, SHA-256 hash recording
- private storage buckets, short-lived signed URLs
- task model

GATE
Original files are provably immutable and every version is retrievable.
Test: upload, replace, confirm v1 bytes and hash are unchanged.

NOTE
Deadlines are Europe/London. Store UTC, render Europe/London. A tender
deadline rendered in the wrong zone loses a bid.
```

## M03 — Requirements matrix and Evidence Locker

```
SCOPE
- requirements: text, classification, owner, due date, source citation
  (document, page, section)
- Evidence Locker: items, types, expiry dates, version control
- evidence-to-requirement links

GATES
1. Every requirement carries a source reference.
2. Expiry produces a warning BEFORE the relevant date, not after.
3. Evidence validity is measured to CONTRACT START, not the submission
   deadline. See tools/tokens.mjs checkF9.

Import checkF9 from the tokens module rather than reimplementing it.
```

## M04 — Answer Studio

```
SCOPE
- question workspace, word and page limits, answer plan
- versions, comments, review states
- AI provider behind an abstraction — no provider lock-in at this stage

GATES
1. No AI-produced text reaches an approved state without an explicit human
   approval event written to the audit log.
2. Word limits use checkF6 from tools/tokens.mjs. The limit is inclusive:
   exactly at the limit passes. A missing limit returns UNKNOWN, never pass.

AI BOUNDARY
AI may draft from approved evidence. AI may not introduce a fact absent from
approved evidence, and may not state a regulatory value — those come from
the dataset only.
```

## M05 — Pricing workspace, rules engine, Audit Command Centre

```
SCOPE
- pricing lines, VAT handling, reconciliation
- productionise tools/rules.mjs into packages/rules-engine
- productionise tools/regulatory-dataset.json into packages/regulatory-data
- Audit Command Centre with Red/Amber/Green

PORT, DO NOT REWRITE
tools/rules.mjs and tools/rules.test.mjs already implement six rules with 29
boundary fixtures. Port them to TypeScript preserving every fixture. If a
fixture becomes inconvenient, the port is wrong, not the fixture.

GATES
1. All 29 rule fixtures pass after the port.
2. node packages/regulatory-data/validate.mjs exits 0 in CI.
3. grep confirms no regulatory constant outside packages/regulatory-data/.

THE TRAP
There are two separate £5m rules. carbon.crp.trigger is per annum inc VAT
with a proportionality carve-out and binds the supplier. kpi.pa23.s52 is
total value and binds the contracting authority. They must not share a
constant. A fixture covers exactly £5,000,000 for both — both are
NOT_APPLICABLE, because both comparators are strictly greater-than.
```

## M06 — Master Suite generation

```
SCOPE
- token registry from tools/tokens.mjs
- deterministic Markdown to DOCX generation. No AI in the generation path.
- preview and export manifest

PORT, DO NOT REWRITE
tools/tokens.mjs and its 42 fixtures. Preserve all of them.

GATES
1. All 42 token fixtures pass after the port.
2. No generated document contains a value absent from controlled data.
3. F1 catches any surviving {{TOKEN}}. Lowercase braces must not
   false-positive.

WARNING
The legacy .docx files are Markdown with a renamed extension, not OOXML.
Any tooling that assumes Word format on those inputs will fail. Verify the
file type before parsing.
```

## M07 — Approvals, signatures, entitlements

```
SCOPE
- approval stages; approval invalidation when an upstream value changes
- signature-ready state, notifications
- Stripe entitlement enforcement

GATES
1. Final export is provably blocked while a hard fail is unresolved.
2. Draft export is available at every status including RED, on every plan
   including Free.
3. A waiver requires a named person AND a reason. evaluateExportGate throws
   without both — keep that behaviour.
4. Every waiver writes audit_finding_waived with check, person and reason.
5. A waived hard fail produces AMBER, never GREEN.

Port evaluateExportGate from tools/tokens.mjs.
```

## M08 — AI extraction and grounding

```
SCOPE
- extraction with page and section citation for human confirmation
- RAG grounded in approved evidence only
- seed demo data, security and accessibility hardening

GATE
Every extracted requirement carries a citation the user can open and check.
An extraction without a resolvable citation is a defect, not a warning.

BOUNDARY
Extraction proposes. A human confirms. Nothing extracted enters the
requirements matrix in an approved state without that confirmation event.
```

## M09 — Billing operations

```
SCOPE
- full Stripe lifecycle, usage meters, billing admin
- the go-live checklist in docs/03_PRICING_AND_ENTITLEMENTS.md

GATES
1. Entitlements granted only from verified webhook signatures. Never from a
   browser success redirect.
2. Webhook replay and idempotency tested.
3. No feature unlocked from client-side state alone.
4. Lookup keys use the tendergate_ prefix. Correct before creating live-mode
   prices — lookup keys are painful to change afterwards.
```

## M10 — Production launch

```
SCOPE
- DEPLOYMENT PLATFORM DECIDED HERE. Not before. Do not encode a hosting
  assumption into build scripts in any earlier milestone.
- /api/readiness with bounded dependency checks. Must not reveal Supabase
  details, Stripe state, env values or tenant data.
- docs/data-inventory-and-lifecycle.md: for each data category, purpose,
  system of record, tenant boundary, access controls, retention decision
  owner, deletion implications. Do NOT assert legal retention periods or
  GDPR compliance.
- organisation data export request workflow: creates a request and manifest,
  Owner/Admin only, tenant-scoped, excludes secrets and signed URLs. Not a
  bulk browser download.
- monitoring, backup and recovery runbook

GATE
A security review confirms no endpoint leaks configuration or cross-tenant
data.
```

---

## Reviewing what comes back

Before accepting any milestone:

1. Run the tests yourself. Do not accept "tests pass" as a statement.
2. `grep -rn` for regulatory constants outside `packages/regulatory-data/`.
3. Check that every new rule result carries `dutyHolder` and `sources`.
4. Check that `UNKNOWN` paths exist and are reachable — a rule with no
   UNKNOWN branch is a rule that guesses.
5. Read the migration. Confirm it is additive and later-dated.

The agent will sometimes report success on work that does not pass. That is
not dishonesty, it is the same failure that put nine defects into the August
pack. The test runner is the check, not the report.
