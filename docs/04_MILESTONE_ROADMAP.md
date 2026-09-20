# Milestone Roadmap

**Version:** 2026-09-06 · **Status overlay:** 2026-09-13 (see `docs/STATUS_AND_NEXT.md`)

The August pack carried two incompatible schemes: M0–M8 in the architecture blueprint and M00–M10 in the prompt files. **M00–M10 is retained.** The M0–M8 scheme is retired; the architecture document has been rewritten to remove it.

A milestone is complete when its **gate passes in a test runner**, not when UI exists.

---

## M00 — Foundation *(DONE — do not rebuild)*

Delivered: production document pack, token registry, milestone prompts, regulatory dataset + validators.

**Re-confirmed 2026-09-13:** `node tools/validate.mjs`, `node tools/rules.test.mjs`, `node tools/tokens.test.mjs` exit 0.

Structural/architectural prose in the pack was not fully audited on 6 September 2026. Absence of a correction is not a clearance.

## M00.5 — Purge and reconcile *(PARTIAL — residual only)*

Original “do before M01” checklist is **no longer a greenfield task**. Remaining work is residual string/UI purge only (see `docs/STATUS_AND_NEXT.md`). Do not re-archive the pack or re-run M01 prelude as if the repo were empty.

Validate/rules zero-exit codes: **already satisfied**.

## M01 — Organisations, roles, Company Passport, RLS *(IMPLEMENTED — verify gate, do not rebuild)*

Present in repo: organisations, memberships, roles, Company Passport UI/actions, dashboard entry, migrations, `supabase/tests/rls-isolation.sql`.

**Remaining:** re-run the RLS gate test and align dashboard shell to Spec §5 / Priority 1 (UX), not recreate tenancy.

## M02 — Tender workspace and Source Document Room *(IMPLEMENTED — verify gate, do not rebuild)*

Present: tenders, lots, tasks, immutable versioned source documents, SHA-256, signed URLs, upload actions, `supabase/tests/tender-source-documents.sql`.

**Remaining:** verify immutability gate; UX to Spec §8.7 / document processing §8.8.

## M03 — Requirements matrix and Evidence Locker *(IMPLEMENTED — verify gate, do not rebuild)*

Present: requirements with source citation fields, evidence items, link/unlink, expiry evaluation helper, `supabase/tests/requirements-evidence.sql`.

**Remaining:** Spec §8.9–8.11 register/drawer UX; ensure expiry warnings meet gate semantics in product UI.

## M04 — Answer Studio *(NOT STARTED — keep prompt)*

Question workspace, word limits, answer plan, versions, comments, review states. AI provider interface behind an abstraction — no provider lock-in at this stage.

**Gate:** no AI-produced text can reach an approved state without an explicit human approval event.

## M05 — Pricing workspace, rule engine, Audit Command Centre *(NOT STARTED — keep prompt)*

Pricing lines, VAT handling, reconciliation. `packages/rules-engine` productionised from `tools/rules.mjs`. Red/Amber/Green readiness.

**Gate:** every rule result carries `dutyHolder` and source URLs. No regulatory constant exists outside `packages/regulatory-data/`.

## M06 — Master Suite generation *(NOT STARTED — keep prompt)*

Token registry, deterministic Markdown to DOCX generation, preview, export manifest.

**Gate:** generated documents contain no value absent from controlled data.

## M07 — Approvals, signatures, entitlements *(NOT STARTED — keep prompt)*

Approval stages, approval invalidation on upstream change, signature-ready state, notifications, Stripe entitlements.

**Gate:** final export is provably blocked while a hard-fail is unresolved; a waiver writes a named person and reason to the audit log.

## M08 — AI extraction and grounding *(NOT STARTED — keep prompt)*

Extraction with page and section citation, RAG grounded in approved evidence only, seed demo data, security and accessibility hardening.

**Gate:** every extracted requirement carries a citation the user can open and check.

## M09 — Billing operations *(NOT STARTED — keep prompt)*

Full Stripe lifecycle, usage meters, billing admin, the go-live checklist in `03_PRICING_AND_ENTITLEMENTS.md`.

## M10 — Production launch *(NOT STARTED — keep prompt)*

**Deployment platform decided here.** Not before. Readiness endpoint, data inventory and lifecycle documentation, organisation data export request workflow, monitoring, runbooks.

---

## Standing requirement at every milestone

Working code, migration files, tests, documentation updates, environment requirements, and run commands. Not a progress narrative.

A milestone is complete when its gate passes in a test runner, not when it is described as complete.
