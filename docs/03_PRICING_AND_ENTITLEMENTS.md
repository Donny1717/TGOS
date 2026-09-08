# Pricing and Entitlements

**Version:** 2026-09-06. Carried forward from the approved v2 ladder, with one correction.

Prices in GBP excluding VAT until checkout. Annual is exactly 10x monthly.

---

## 1. Ladder

| Plan | Target | Monthly | Annual | Annual saving |
|---|---|---:|---:|---:|
| Free Readiness | Prospect / new SME | £0 | £0 | — |
| Starter | Solo supplier, small team | £149 | £1,490 | £298 |
| Professional | Active SME bid team | £490 | £4,900 | £980 |
| Consultant | Consultant, multi-client | £980 | £9,800 | £1,960 |
| Enterprise | Large supplier | Custom | Custom | — |

## 2. Correction applied to the August entitlement matrix

The August matrix gave Free Readiness `masterSuiteExport: false` and "Final Master Suite exports: No", with preview only "Limited".

The locked decision is: **draft export is available on every plan including Free; final export is the only gated output.** A prospect must be able to take something away, or the free tier proves nothing.

Free Readiness therefore gets draft export with a visible watermark and no final export. Everything else in the matrix stands.

## 3. Entitlements

| Capability | Free | Starter | Professional | Consultant |
|---|---:|---:|---:|---:|
| Members | 1 | 3 | 12 | 25 |
| Active tenders | 1 | 5 | 30 | 75 |
| Client workspaces | 0 | 0 | 0 | 15 |
| Evidence storage | 250 MB | 15 GB | 100 GB | 500 GB |
| AI extraction / month | 25 pages | 500 pages | 2,500 pages | 7,500 pages |
| AI actions / month | 5 | 50 | 300 | 1,000 |
| AI reviews / month | 2 | 20 | 150 | 500 |
| **Draft export** | **Yes, watermarked** | Yes | Yes | Yes |
| **Final export / month** | **0** | 10 | 75 | 250 |
| Pricing workspace | Preview | Core | Full | Full |
| Audit engine | Basic readiness | Core rules | Advanced + export | Advanced multi-client |
| Hard-fail RAG | Yes | Yes | Yes | Yes |
| Approvals | No | 1-stage | Multi-stage | Multi-stage + client review |
| Audit trail | Basic | Full in-app | Full + export | Full + multi-client export |
| Support | Knowledge base | Standard email | Priority + onboarding | Priority + quarterly review |

Hard-fail Red/Amber/Green is available on every plan including Free. It is the product's honest core; withholding it would make the free tier misleading rather than limited.

## 4. Plan codes

Stable codes, never display labels, for permission checks:

```
free_readiness · starter · professional · consultant · enterprise
```

All money stored in pence. £149 = `14900`. £1,490 = `149000`.

## 5. Stripe

Products: Free Readiness, Starter, Professional, Consultant, Enterprise, Extra Tender Workspace Pack, Extra AI Processing Pack, Extra Member Seat Pack, Implementation Onboarding.

Lookup keys use the corrected brand:

```
tendergate_starter_monthly_gbp        tendergate_starter_annual_gbp
tendergate_professional_monthly_gbp   tendergate_professional_annual_gbp
tendergate_consultant_monthly_gbp     tendergate_consultant_annual_gbp
```

Every `tendergate_` key in the August pack is a defect. Correct before creating live-mode prices — lookup keys are painful to change afterwards.

Price metadata carries `plan_code`, `billing_interval` and every limit, so entitlements can be reconstructed from Stripe alone.

## 6. Billing principles

- Entitlements granted only from verified Stripe webhooks, never from a browser success redirect
- Self-serve checkout for Free, Starter, Professional; sales-assisted for Consultant and Enterprise
- Read-only access to historical data for a defined grace period after cancellation
- No automatic data deletion on cancellation without a documented policy and customer notice
- Stripe Tax only after VAT configuration has been reviewed. Do not make VAT claims in product UI before then.

## 7. Engineering tasks

1. `plans`, `plan_features`, `organisation_entitlements`, `subscriptions`, `usage_events`, `billing_events` tables
2. Seed the five plan codes above
3. Server-side checkout session creation from lookup keys
4. Customer portal session route
5. Signed `POST /api/webhooks/stripe` with idempotency and event log
6. `getEntitlements()`, `requireFeature()`, `requireLimit()` server helpers
7. Usage meters for AI, extraction, export, storage, tenders, members
8. Billing page: plan comparison, current usage, upgrade, downgrade, manage
9. Internal billing admin
10. Tests: checkout mapping, webhook replay, upgrade, payment failure, downgrade while over limit, feature restriction

## 8. Go-live checklist

Live-mode products and prices created · GBP and both intervals verified · webhook signature validated · replay and idempotency tested · upgrade, downgrade, cancellation, past-due states tested · entitlements enforced server-side and in UI · usage counters tested under concurrency · customer portal works · invoice and tax configuration reviewed · refund and retention terms published · error monitoring on checkout and webhook routes · **no feature unlocked from client-side state alone**
