# TGOS status and next work

**Updated:** 2026-09-21 (Phase 1 rules wire-up)  
**Purpose:** Stop re-running completed instructions. Agents must read this before `docs/11_MILESTONE_PROMPTS.md`.

## Product scope (locked 2026-09-21)

- **Does:** document checking — missing evidence/requirements, compliance aligned to **Procurement Act 2023**, roadmap grammar + word count + alerts. High accuracy; stay up to date with the Act and related instruments.
- **Does not:** create or generate submission documents (no Master Suite / answer generation as core duty).

## Phase 0 — Run on any machine (done 2026-09-21)

| Item | Evidence |
|------|----------|
| Cross-platform setup | `SETUP.md` |
| `npm run verify` | validate + rules + tokens |
| CI Node 22 + verify | `.github/workflows/node.js.yml` |

## Phase 1 — Rules in product (done 2026-09-21, first slice)

| Item | Evidence |
|------|----------|
| Rules package | `packages/rules-engine` (dataset from `tools/regulatory-dataset.json`) |
| Web helper | `apps/web/src/lib/compliance.ts` — hardBlocks, supplier obligations, buyer intelligence, UNKNOWN |
| Final Gate | PA23 panel; hard fails force No-Go; demo uses sample inputs |
| Migration | `supabase/migrations/20260921120000_tender_compliance_inputs.sql` |

**Still open in Phase 1 / Sprint 4:** UI to edit tender compliance inputs; auto-create issues from supplier APPLIES; grammar + word count; real auth default; RLS re-run.

## Do not rebuild (already in the repo)

| Item | Evidence | Notes |
|------|----------|--------|
| M00 regulatory tools | `tools/validate.mjs`, `rules.mjs`, `tokens.mjs` + tests | exit 0 |
| M00 corrections locked by tests | `[AUG-PACK-BUG]` fixtures | Do not re-open |
| M01–M03 schema + UI base | migrations + pages | verify gates, do not recreate |
| Landing | `tgos-landing.tsx` | check-oriented copy |

## Sprint backlog (remaining)

### Sprint 4 — Enforce truth (in progress)
- [x] Wire tools/rules into Final Gate (package + panel + hardBlocks)
- [ ] Form to capture tender compliance inputs (buyer type, values, commencement date)
- [ ] Re-run RLS / isolation gates; confirm no client secrets
- [ ] Real auth path as default for beta (local bypass only for explicit local preview)
- [ ] Basic a11y pass
- [ ] Grammar check + word count + alerts

### Sprint 5 — GTM hygiene
- [ ] Customer-facing copy matches shipped behaviour
- [ ] Onboarding end-to-end on real org data
- [ ] Private beta invite flow

### Later
- Hosting decision; billing only if needed for beta
- Do **not** prioritise document generation as core product

## Authoritative specs

- Setup: `SETUP.md`
- Product/UX/A11y: `TGOS_Product_UX_UI_Accessibility_Build_Spec.md`
- Standing constraints: `docs/11_MILESTONE_PROMPTS.md` section 0
