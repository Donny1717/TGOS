# Milestone Roadmap

**Version:** 2026-09-06.

The August pack carried two incompatible schemes: M0–M8 in the architecture blueprint and M00–M10 in the prompt files. **M00–M10 is retained.** The M0–M8 scheme is retired; the architecture document has been rewritten to remove it.

---

## M00 — Foundation *(complete, with qualification)*

Delivered: production document pack, token registry, fixture corpus, milestone prompts.

**Qualification, stated plainly.** The regulatory content of M00 contained nine defects that would have produced wrong answers for customers. They are listed in `07_CORRECTIONS_REGISTER.md` and are now fixed, evidenced and tested. The structural and architectural content of M00 was **not audited** on 6 September 2026. Absence of a correction is not a clearance.

**Added to M00 on 6 September 2026:**
- `tools/regulatory-dataset.json` — 14 values, primary sources, expiry policy
- `tools/validate.mjs` — 9 evidence-quality rules, exits non-zero on failure
- `tools/rules.mjs` — 6 compliance rules reading thresholds from the dataset
- `tools/rules.test.mjs` — 29 boundary fixtures, all passing

## M00.5 — Purge and reconcile *(do this before M01)*

Not in the original scheme. Inserted because starting M01 on an uncleaned folder reintroduces the defects.

1. Archive the superseded files listed in `09_PURGE_LIST.md`
2. Run the string purge: PAS 91, PPN 003, PPN 06/2x, TENDER.GATE.OS, Vercel, stale figures
3. Confirm `node tools/validate.mjs` exits 0
4. Confirm `node tools/rules.test.mjs` exits 0

**Gate:** clean grep plus two zero exit codes.

## M01 — Organisations, roles, Company Passport, RLS

Multi-tenant foundation. Organisation creation, membership, roles. Company Passport schema and UI. RLS on every tenant table. Dashboard shell.

**Gate:** two organisations cannot read each other's data in an automated test.

## M02 — Tender workspace and Source Document Room

Tender metadata, lots, owners, deadlines, lifecycle. Immutable original file storage with versioning and hashing. Task model.

**Gate:** original files are provably immutable; every version is retrievable.

## M03 — Requirements matrix and Evidence Locker

Structured requirements with manual entry and source citation. Evidence Locker with expiry monitoring. Evidence-to-requirement links.

**Gate:** every requirement carries a source reference; expiry produces a warning before the deadline, not after.

## M04 — Answer Studio

Question workspace, word limits, answer plan, versions, comments, review states. AI provider interface behind an abstraction — no provider lock-in at this stage.

**Gate:** no AI-produced text can reach an approved state without an explicit human approval event.

## M05 — Pricing workspace, rule engine, Audit Command Centre

Pricing lines, VAT handling, reconciliation. `packages/rules-engine` productionised from `tools/rules.mjs`. Red/Amber/Green readiness.

**Gate:** every rule result carries `dutyHolder` and source URLs. No regulatory constant exists outside `packages/regulatory-data/`.

## M06 — Master Suite generation

Token registry, deterministic Markdown to DOCX generation, preview, export manifest.

**Gate:** generated documents contain no value absent from controlled data.

## M07 — Approvals, signatures, entitlements

Approval stages, approval invalidation on upstream change, signature-ready state, notifications, Stripe entitlements.

**Gate:** final export is provably blocked while a hard-fail is unresolved; a waiver writes a named person and reason to the audit log.

## M08 — AI extraction and grounding

Extraction with page and section citation, RAG grounded in approved evidence only, seed demo data, security and accessibility hardening.

**Gate:** every extracted requirement carries a citation the user can open and check.

## M09 — Billing operations

Full Stripe lifecycle, usage meters, billing admin, the go-live checklist in `03_PRICING_AND_ENTITLEMENTS.md`.

## M10 — Production launch

**Deployment platform decided here.** Not before. Readiness endpoint, data inventory and lifecycle documentation, organisation data export request workflow, monitoring, runbooks.

---

## Standing requirement at every milestone

Working code, migration files, tests, documentation updates, environment requirements, and run commands. Not a progress narrative.

A milestone is complete when its gate passes in a test runner, not when it is described as complete.
