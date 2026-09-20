# TENDER.GATE.OS

**Issued:** 7 September 2026
**Replaces:** the DOCCUTE / DOCCOTE pack of 30 August 2026, in full
**Company:** Honey-B2024 Ltd, London · **Repo folder:** `TGOS` (local) · remote `Donny1717/TENDER-GATE-OS`

---

## What this is

A UK public-sector tender compliance platform for SMEs and bid consultants, specified from the ground up with the defects of the previous pack corrected and locked out by tests.

**The core constraint, which is the product:** no figure enters a submission without a named source. Unresolved evidence gaps are marked, and final export is blocked until each is either evidenced or waived by a named person with a recorded reason.

## Three things here are proven by execution

```bash
cd tools
node validate.mjs       # 14 regulatory values, primary source on every one
node rules.test.mjs     # 29 boundary fixtures across 6 compliance rules
node tokens.test.mjs    # 42 fixtures across the Master Suite output gate
```

All three exit 0. Run them before you trust anything in this pack.

Every fixture tagged `[AUG-PACK-BUG]` is a case the previous specification answered wrongly. They are now locked by test.

## The rest is written work, not proven work

The architecture, pricing, roadmap, GTM and milestone prompts are design decisions, not facts — there is no primary source to check them against. Known defects are removed and the reasoning is stated, but they have not been through an equivalent audit.

`docs/08_LOCKED_DECISIONS.md` marks every item **LOCKED**, **LOCKED (judgement)**, **OPEN** or **CONTESTED**. Read the status, not just the row. Absence of a correction is not a clearance.

## What was wrong before

Nine regulatory defects that would have given customers wrong answers:

- **PAS 91** presented as live. BSI withdrew it in April 2023.
- **PPN 003** cited for 30-day payment. It does not govern payment.
- **Two `>=` comparators** where the law says *above* and *more than*.
- **The Building Safety test** used height alone, missing the 7-storey limb — a false negative in a building-safety check.
- **PA23 s.52** and the **NHS modern slavery duty** framed as supplier obligations. Both bind the buyer.
- **PA23 s.19** collapsed two mechanisms, one carrying a statutory right to respond.
- **NHS Evergreen** scoped too broadly.
- **NHS modern slavery** grouped with value-triggered rules. It has no value threshold.

Plus four contradictions: two document generations citing different PPNs, two brand spellings, two milestone schemes, and a hosting platform asserted as decided.

Full detail with sources: `docs/07_CORRECTIONS_REGISTER.md`.

## The rule that stops it recurring

**Regulatory values live in `tools/regulatory-dataset.json` and nowhere else.** Documents, templates and code reference an entry by `id` — `carbon.crp.trigger`, `bsa.higher_risk_building` — never by repeating the number.

The previous pack decayed because the same figure was copied into a dozen files and only some were updated. That is a filing problem, not a knowledge problem, and this is the fix.

Four change dates are already recorded. The validator blocks any entry whose expected-change date passes unreconciled, so nobody has to remember them.

## The trap worth naming once

There are **two separate £5m rules** and they must never share a constant:

| | `carbon.crp.trigger` | `kpi.pa23.s52` |
|---|---|---|
| Basis | Per annum, averaged over contract life | Total estimated value |
| Comparator | Above | More than |
| Duty holder | **Supplier** | **Contracting authority** |

Both are strictly greater-than. A contract at exactly £5,000,000 triggers neither. Both are tested.

## Order of work

1. This file
2. `docs/STATUS_AND_NEXT.md` — what is already done vs open (read before any agent prompt)
3. `TGOS_Product_UX_UI_Accessibility_Build_Spec.md` — authoritative UX/UI/a11y build spec
4. `docs/07_CORRECTIONS_REGISTER.md` — regulatory defects (historical; locked by tests)
5. `docs/08_LOCKED_DECISIONS.md` — resolve remaining OPEN items
6. `docs/INSTALL.md` — confirm three zero exit codes when touching tools
7. `docs/11_MILESTONE_PROMPTS.md` — **M04 onward only** (M01–M03 build prompts retired)

## Contents

```
docs/01_PRODUCT_PACK.md              what it is, scope, stack
docs/02_ARCHITECTURE.md              build architecture
docs/03_PRICING_AND_ENTITLEMENTS.md  ladder, entitlements, Stripe
docs/04_MILESTONE_ROADMAP.md         M00 to M10, single scheme
docs/05_GO_TO_MARKET.md              sequencing, message discipline
docs/06_COMPLIANCE_RULES.md          the six rules in plain English
docs/07_CORRECTIONS_REGISTER.md      what was wrong, with sources
docs/08_LOCKED_DECISIONS.md          decisions and their status
docs/09_MIGRATION_FROM_LEGACY.md     rename map and string purge
docs/10_TOKEN_REGISTRY.md            Master Suite tokens and F1-F10
docs/11_MILESTONE_PROMPTS.md         prompts for a coding agent
docs/INSTALL.md                      setup and CI wiring

tools/regulatory-dataset.json        14 values with provenance
tools/validate.mjs                   9 evidence-quality rules
tools/rules.mjs                      6 compliance rules
tools/rules.test.mjs                 29 boundary fixtures
tools/tokens.mjs                     token registry and export gate
tools/tokens.test.mjs                42 fixtures
```

## Still open

Three things are not decided, and are marked as not decided rather than quietly filled in:

- **Deployment platform** — an M10 decision. No hosting assumption is encoded anywhere.
- **PPN 03/24 status** — PAS 91 is withdrawn and the Common Assessment Standard replaces it, but PPN 03/24 predates PA23's replacement of the SQ with the PSQ. Its own status is unresolved.
- **`threshold.works`** — £5,193,000 came from secondary reporting of PPN 023 Annex A and needs line-by-line confirmation against the PDF.

Six rules are implemented. UK public procurement contains far more. This pack does not claim the rule set is complete — it claims each implemented rule is evidenced, tested and traceable.
