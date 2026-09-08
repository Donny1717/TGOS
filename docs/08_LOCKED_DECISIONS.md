# Locked Decisions

Carried forward from the August pack. Status column states what kind of confidence each decision has — not all of them have the same kind.

**LOCKED** — evidence exists and was checked.
**LOCKED (judgement)** — a design decision, not a factual claim. Correct because it was reasoned, with a stated reversal trigger.
**OPEN** — not decided. Must not be treated as decided.
**CONTESTED** — the pack contains conflicting statements. Resolve before build.

---

## Platform and stack

| Decision | Status | Basis / reversal trigger |
|---|---|---|
| Backend is **Supabase** (Auth + Postgres + Storage + RLS), not Fastify/BullMQ | LOCKED | All 52 source files specified Supabase. Reverse only if RLS cannot express the tenant model. |
| Every tenant-owned row carries `organisation_id`; RLS on every such table | LOCKED (judgement) | Standard multi-tenant isolation. Acceptance test: two organisations cannot read each other's data in an automated test. |
| **Deployment platform** | **OPEN** | Decide at M10. The architecture blueprint's "Vercel + Supabase baseline" line is an assertion, not a decision — strike it. |
| Postgres full-text search + pgvector for retrieval | LOCKED (judgement) | Avoids a second datastore. Reverse if recall proves inadequate on real ITT corpora. |
| Document engine abstraction over DOCX/XLSX/PDF | LOCKED (judgement) | Keeps format handling replaceable. |
| Stripe Billing with verified webhook signatures | LOCKED | — |

## Document pipeline

| Decision | Status | Basis |
|---|---|---|
| **Markdown → DOCX deterministic pipeline** | LOCKED | The existing `.docx` files in the project are plain Markdown with a renamed extension, not real Word files. Verified by inspection. |
| **Draft export available on every plan including Free; final export is the only gated output** | LOCKED (judgement) | Product decision. Reversal trigger: draft export becomes a substitute for the paid tier in observed usage. |
| Master Suite generated only from controlled data, never free text | LOCKED (judgement) | This is the product's core claim. Non-negotiable. |

## Data and content

| Decision | Status | Basis |
|---|---|---|
| Submission checklist has **52 rows**, not 61 | LOCKED | Counted. The legacy index claimed 61. |
| Pricing workbook **Column H (Optional Items) is deleted** | LOCKED | Column H had no formula connections and silently excluded money from the tender total — it promised behaviour the workbook could not deliver. |
| Brand is **TENDER.GATE.OS** | LOCKED | Every TENDER.GATE.OS occurrence is a defect. See CORRECTIONS B2. |
| Project folder is **`tender-gate-os`** | LOCKED | Not `web`, not anything else. |
| Regulatory values live only in `regulatory-dataset.json`; documents reference by `id` | LOCKED | New rule. This is what prevents the August pack's decay from recurring. |

## Milestones

| Decision | Status | Basis |
|---|---|---|
| Milestone scheme | **CONTESTED** | Architecture blueprint uses M0–M8; milestone prompts use M00–M10. They do not map. Pick one before M01 starts. |
| M00 (foundation pack) complete | LOCKED, with qualification | The pack exists. Its regulatory content contained 9 defects (see CORRECTIONS A1–A9). Structural and architectural content was **not audited**. |

## Verification discipline

| Rule | Status |
|---|---|
| Regulatory data requires a primary source: legislation.gov.uk, gov.uk, assets.publishing.service.gov.uk, england.nhs.uk | LOCKED |
| Secondary commentary may guide the search; it may not be the citation | LOCKED |
| Every regulatory value carries source URL + effective date + last-verified date | LOCKED |
| A value past its review age is blocked, not silently served | LOCKED — enforced by `validate.mjs` |
| `node tools/validate.mjs` must pass before any build | LOCKED |
| Code is verified by a live test runner, not by assertion | LOCKED — Node 22 in use |

## Known change dates on the calendar

| Date | What | Recorded as |
|---|---|---|
| Autumn 2026 (set to 30 Nov) | Cabinet Office practitioner guidance and sub-criteria for PPN 026 | `socialvalue.model.next.nextExpectedChange` |
| 1 Jan 2027 | PPN 026 applies to procurements commenced on or after this date | `socialvalue.model.next.effectiveFrom` |
| 1 Apr 2027 | NHS Net Zero Supplier Roadmap requirements (published 9 Jun 2026) | `nhs.evergreen.level1.nextExpectedChange` |
| 1 Jan 2028 | Next WTO GPA biennial threshold revision; SI expected Nov 2027 | three `threshold.*` entries |

The validator blocks any entry whose `nextExpectedChange` has passed without reconciliation. These dates do not need to be remembered by a person.

## Transition hazard worth stating separately

From 1 January 2027, **PPN 002 and PPN 026 run concurrently**. A procurement commenced before that date may stay on PPN 002; commencement is the publication of the tender notice.

The platform must select the social value model **from the tender documents**, never from the current date. Date-based selection will give wrong guidance to a large number of customers throughout 2027.

Related: PPN 002 applied from the ordinary procurement threshold; PPN 026 applies only from £1m. Contracts between roughly £135,018 and £1m carry no mandated social value from 2027. That gap is real and worth surfacing to customers as an opportunity, not an error.
