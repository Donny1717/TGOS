# Migration from the legacy pack

The August 2026 pack was branded DOCCUTE / DOCCOTE and contained nine regulatory defects and four internal contradictions. This pack replaces it under the name **TENDER.GATE.OS**.

You do not need to open the legacy folder to use this pack. This document exists for the case where you want to carry something forward.

---

## 1. Simplest path

```
tender-gate-os/        unzip this pack here, work here only
OLD_legacy_aug2026/    rename the old folder, do not open it
```

That is the whole migration. Nothing else is required to start M01.

## 2. Rename map, if you do carry anything forward

| Legacy | TENDER.GATE.OS |
|---|---|
| DOCCUTE / DOCCOTE / DOCCUTE.OS | TENDER.GATE.OS |
| `doccute.pro` | `tender-gate-os` |
| `doccote_starter_monthly_gbp` | `tendergate_starter_monthly_gbp` |
| `DOCCUTE_TODAY` env var | `TGOS_TODAY` |
| "DOCCOTE Tender Pro" in Stripe products | "TENDER.GATE.OS" |

Stripe lookup keys must be corrected **before** creating live-mode prices. They are painful to change afterwards.

## 3. String purge, if you carry a legacy file forward

Every hit is a defect.

```bash
grep -rn -i -E "PAS 91|PPN 003|PPN 06/2|DOCCOTE|DOCCUTE|Vercel|5\.337|139,000|138,760|139,688" .
```

| Found | Replace with | Why |
|---|---|---|
| `PAS 91` | Common Assessment Standard | Withdrawn by BSI April 2023 |
| `PPN 003` | delete — see corrections A2 | Does not govern payment |
| `PPN 06/20` | PPN 002 | Superseded |
| `PPN 06/21` | PPN 006 | Superseded |
| `£5.337m` | £5,193,000 | Pre-2026 works threshold |
| `£139,000` `£138,760` `£139,688` | £135,018 | Pre-2026 threshold |
| `DOCCOTE` `DOCCUTE` | TENDER.GATE.OS | Rebrand |
| `Vercel` | remove | Platform undecided until M10 |

Legacy `.docx` files are Markdown with a renamed extension, so grep reaches them. Add `--include="*.docx"` to be sure.

## 4. Comparator audit

Search for `>=` and `≥` near any monetary threshold. Both verified £5m rules are **strictly greater than**. See corrections A3 and A4.

## 5. What is worth carrying forward

Nothing is required. These are the only items with content this pack does not reproduce:

| Legacy artefact | Status here |
|---|---|
| Token registry | **Reproduced** — `tools/tokens.mjs`, `docs/10_TOKEN_REGISTRY.md` |
| Output checks F1–F10 | **Reproduced and tested** — 42 fixtures |
| Milestone prompts | **Rewritten** — `docs/11_MILESTONE_PROMPTS.md` |
| Fixture corpus (36 files) | **Not reproduced.** Sample ITT documents used for pipeline testing. Recreate as needed, or lift from the archive. |
| Architecture blueprint | Rewritten, corrected |
| Pricing and entitlements | Rewritten, corrected |
| GTM plan | Rewritten, corrected |

Only the fixture corpus is genuinely absent. It is test data, not specification — the pipeline can be built and tested without it, and rebuilt with real ITT documents later, which will be better test data anyway.

## 6. Duplicate files in the legacy folder

If you do go in, these are the known duplicates. Keep one of each.

```
Placeholder_Index___Integration_Guide.docx  and __1_ through __5_   (6 copies)
Tender_Submission_Checklist.docx  /  Tender_Submission_Checklist__.docx
ITT_Response_Template__1_.docx    /  ITT_Response_Template.docx
Tender_Response_Master_Suite_Placeholder_Index.pdf  /  _1ok.pdf
```

Within each pair the copies cite **different PPN generations**. Loading the wrong one makes the platform cite withdrawn policy. Diff before choosing; do not assume the numbered suffix is newer.

## 7. Gate before starting M01

```bash
cd tools
node validate.mjs      # exit 0
node rules.test.mjs    # exit 0, 29 passed
node tokens.test.mjs   # exit 0, 42 passed
```

Three zero exit codes and a clean grep. Then begin.
