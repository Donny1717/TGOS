# TGOS status and next work

**Updated:** 2026-09-13 (agent session)  
**Purpose:** Stop re-running completed instructions. Agents must read this before `docs/11_MILESTONE_PROMPTS.md`.

## Do not rebuild (already in the repo)

| Item | Evidence | Notes |
|------|----------|--------|
| M00 regulatory tools | `tools/validate.mjs`, `rules.mjs`, `tokens.mjs` + tests | Re-confirmed 2026-09-13: validate/rules/tokens exit 0 |
| M00 corrections locked by tests | `[AUG-PACK-BUG]` fixtures in `tools/rules.test.mjs` | Do not re-open as build tasks |
| M01 schema + UI (base) | migrations `organisations_and_passport`, org/passport/onboarding UI, server actions | Gate: `supabase/tests/rls-isolation.sql` exists — re-run to confirm, do not recreate tables/UI from scratch |
| M02 schema + UI (base) | tender/lots/tasks/source documents + upload/version/hash + signed URLs | Gate SQL: `supabase/tests/tender-source-documents.sql` — verify, do not rebuild |
| M03 schema + UI (base) | requirements (manual + citation fields), evidence items, link/unlink, expiry helper | Gate SQL: `supabase/tests/requirements-evidence.sql` — verify, do not rebuild |
| Marketing landing §8.1 (first pass) | `apps/web/src/components/tgos-landing.tsx` used by `/` and `/tgos` | Real Next.js page — **no HTML mockups**. Tokens in `globals.css` |

## Still open — TGOS only

See sprint backlog below. Do not expand scope to other products.

## Sprint backlog — private beta / GTM path (TGOS)

Ordered for production readiness. Do not skip gate/security for polish.

### Sprint 1 — Shell + clarity (done)
- [x] App shell §5: Overview, Tenders, Requirements, Evidence, Issues, Reports, Settings (+ Help/accessibility)
- [x] Compact top bar (tender context / deadline when relevant, notifications, user menu) — no second full nav
- [x] Dashboard §8.4: priority actions, KPI cards (≤4), active tenders, evidence alerts — **no decorative charts**
- [x] Design tokens applied across dashboard shell

### Sprint 2 — Tender command centre
- [x] Tender Overview §8.7 (status, countdown, top 3 actions, Run final gate CTA)
- [x] Requirement Register §8.9 + accessible detail drawer §8.10
- [x] Evidence view §8.11 (filters: missing / expired / expiring / unapproved)

### Sprint 2 note
- [x] Final Gate page shell + decision from live requirement/evidence links (approval persistence still Sprint 3)

### Sprint 3 — The product gate (done)
- [x] Issues & Actions §8.12 (severity, owner, due, citation, states incl. accepted risk)
- [x] Final Submission Gate §8.13 (Go / Conditional Go / No-Go / In progress + mandatory AI disclaimer)
- [x] Human approval record (approver, decision, datetime, comment, accepted-risk refs)
- [x] Tender Readiness Report §8.14 (HTML first)

Apply migration before using live data: supabase/migrations/20260913120000_issues_and_gate_approvals.sql

### Sprint 4 — Enforce truth in the product
- [ ] Wire 	ools/rules (+ export gate semantics) into Final Gate / readiness — UI must block on hard fails
- [ ] Re-run RLS / isolation gates; confirm no client secrets
- [ ] Real auth path as default for beta (local bypass only for explicit local preview)
- [ ] Basic a11y pass: skip link, focus, keyboard drawer, status text labels; accessibility page with honest wording

### Sprint 5 — GTM hygiene (TGOS)
- [ ] Customer-facing copy matches shipped behaviour (no overclaim)
- [ ] Onboarding 3-step §8.3 works end-to-end on real org data
- [ ] Private beta invite flow ready (manual OK)

### Later (after private beta) — still TGOS
- M04 Answer Studio, M06 Master Suite, M08 AI extraction, M09 Stripe, M10 hosting decision

## Authoritative specs

- Product/UX/A11y: TGOS_Product_UX_UI_Accessibility_Build_Spec.md (repo root)
- Short index: docs/TGOS_PRODUCT_UX_A11Y_SPEC_v1.md
- Standing coding constraints: docs/11_MILESTONE_PROMPTS.md section 0 (keep)
