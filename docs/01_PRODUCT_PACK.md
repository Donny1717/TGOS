# TENDER.GATE.OS — Product Pack

**Version:** 2026-09-06 · supersedes the 30 August 2026 pack
**Brand:** TENDER.GATE.OS · **Product:** TENDER.GATE.OS · **Repo folder:** `tender-gate-os`
**Company:** Honey-B2024 Ltd, London

---

## 1. What the product is

A UK public-sector tender compliance platform for SMEs and bid consultants. It holds a supplier's evidence once, maps a buyer's requirements to that evidence with source citations, checks the result against verified UK procurement rules, and generates a controlled document suite.

**The core constraint, which is the product:** no figure enters a submission without a named source. Unresolved evidence gaps are marked, and final export is blocked until each is either evidenced or explicitly waived by a named person with a recorded reason.

## 2. What it is not

- Not a proposal writer. AI drafts from approved evidence only; it never introduces facts.
- Not legal advice. It reports what published rules say and cites them. It does not interpret them for a specific procurement.
- Not a guarantee of compliance. The audit reports what it can check. Its coverage is finite and stated.

That third point must survive into the UI copy. A product that implies certification it cannot deliver creates liability the company cannot carry.

## 3. Who it is for

| Segment | Why they buy |
|---|---|
| In-house bid teams at SME contractors | They carry the cost of assembling evidence and capture none of the revenue from it |
| Independent bid writers | Decide alone, buy without procurement, feel the admin burden directly |
| Bid consultancies | Their clients' evidence arrives incomplete; chasing it is unbilled work |

The consultancy pitch is different from the other two and must not be merged with them. A tool that shortens evidence assembly threatens consultancy billable hours unless it is positioned against their *unbilled* chasing work.

## 4. Product modules

| Module | Purpose |
|---|---|
| Company Passport | Reusable legal, financial, policy, certification and contact data |
| Tender Workspace | Tender metadata, lots, owners, deadlines, lifecycle |
| Source Document Room | Immutable originals, versions, extraction with source citation |
| Requirements Engine | Structured buyer requirements, classification, owner, evidence mapping |
| Bid/No-Bid | Capacity, fit, margin, risk, decision record |
| Evidence Locker | Supplier proof, expiry monitoring, version control, requirement links |
| Answer Studio | Question workspace, word limits, answer plan, AI assistance, review |
| Pricing Workspace | Pricing lines, VAT, NPV, assumptions, TUPE, reconciliation |
| Master Suite | Formal tender documents generated only from controlled data |
| Audit Command Centre | Hard-fail and high-risk controls, Red/Amber/Green readiness |
| Approvals & Signatures | Review stages, approval invalidation, signature-ready evidence |
| Tender-to-Award | Submission receipts, award outcomes, reusable learning |
| Admin & Billing | Tenants, plans, usage, rule packs, billing operations |

## 5. Core workflow

```
Import opportunity → create tender workspace → upload ITT, spec, pricing, forms
→ extract and confirm source-cited requirements → bid/no-bid
→ link Company Passport and Evidence Locker → draft and review answers
→ complete and reconcile pricing → generate Master Suite → run audit
→ approve, sign, export → record portal receipt and award outcome
```

## 6. Regulatory scope

Fourteen values, every one verified against a primary source on 6 September 2026, held in `tools/regulatory-dataset.json`. Six rules implemented and tested in `tools/rules.mjs`.

**Regulatory values live in the dataset and nowhere else.** Documents, templates and code reference entries by `id` — `carbon.crp.trigger`, `bsa.higher_risk_building` — never by repeating the number. The August pack decayed because the same figure was copied into a dozen files and only some were updated.

### The trap worth naming

There are **two separate £5m rules** and they must never share a constant:

| | `carbon.crp.trigger` | `kpi.pa23.s52` |
|---|---|---|
| Basis | Per annum, averaged over contract life | Total estimated contract value |
| VAT | Inclusive | Inclusive |
| Comparator | Above | More than |
| Duty holder | **Supplier** | **Contracting authority** |
| Carve-out | Related and proportionate | s.52(2) where KPIs inappropriate |

### Changes already on the calendar

| Date | What |
|---|---|
| Nov 2026 | Cabinet Office practitioner guidance for PPN 026 |
| 1 Jan 2027 | PPN 026 applies to procurements commenced on or after |
| 1 Apr 2027 | NHS Net Zero Supplier Roadmap requirements |
| 1 Jan 2028 | Next WTO GPA threshold revision |

The validator blocks any entry whose expected-change date has passed unreconciled. Nobody has to remember these.

### The 2027 concurrency hazard

From 1 January 2027 **PPN 002 and PPN 026 run at the same time**. A procurement commenced before that date may continue under PPN 002; commencement is publication of the tender notice.

The platform selects the model **from the tender documents, never from the current date**. Date-based selection gives wrong guidance to a large share of customers throughout 2027. Enforced by `ruleSocialValueModel` and covered by test.

## 7. Reference stack

```
Next.js App Router + TypeScript strict
Tailwind CSS + accessible UI primitives
Supabase Auth + PostgreSQL + Storage + Row Level Security
PostgreSQL full-text search + pgvector
Zod validation
Background jobs for ingestion, extraction, document generation
AI provider abstraction
DOCX/XLSX/PDF document-engine abstraction
Stripe Billing + verified webhooks
Email provider abstraction
Sentry-ready monitoring + consent-aware analytics
```

**Deployment platform is undecided.** It is a M10 decision. Any document asserting a hosting baseline is stating a preference as a decision.

## 8. Monorepo layout

```
apps/web/
packages/db/
packages/shared/
packages/rules-engine/          <- tools/rules.mjs is the seed for this
packages/regulatory-data/       <- tools/regulatory-dataset.json lives here
packages/document-engine/
packages/ai-provider/
packages/billing/
packages/notifications/
supabase/migrations/
supabase/functions/
docs/
tests/unit/ tests/integration/ tests/e2e/
.github/workflows/
```

## 9. Verification discipline

| Rule | Enforcement |
|---|---|
| Regulatory data requires a primary source: legislation.gov.uk, gov.uk, assets.publishing.service.gov.uk, england.nhs.uk | `validate.mjs` rule 2 |
| Every value carries source URL, effective date, last-verified date | rules 1, 4 |
| A value past its review age is blocked, not silently served | rule 4 |
| Monetary thresholds must declare a VAT basis | rule 8 |
| A rule that cannot be evaluated returns UNKNOWN with the missing input named | `rules.mjs` |
| Code is proven by a test runner, not by assertion | `rules.test.mjs`, 29 cases |

Secondary commentary may guide a search. It may never be the citation.

## 10. Honest statement of coverage

Six rules are implemented. UK public procurement contains far more. This pack does not claim the rule set is complete; it claims each implemented rule is evidenced and tested.

Two entries carry `needs_review` and are stated as such rather than quietly shipped:

- `prequalification.construction.standard` — PAS 91 is withdrawn and Common Assessment Standard replaces it, but PPN 03/24 predates PA23's replacement of the SQ with the PSQ, so PPN 03/24's own status is unresolved.
- `threshold.works` — £5,193,000 came from secondary reporting of PPN 023 Annex A and needs line-by-line confirmation against the PDF.

Neither is a defect in the platform. Both are stated so nobody mistakes silence for verification.
