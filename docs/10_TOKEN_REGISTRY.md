# Master Suite Token Registry

Implemented in `tools/tokens.mjs`. Covered by 42 fixtures in `tools/tokens.test.mjs`.

---

## 1. The five documents

| File | Format | Purpose |
|---|---|---|
| `01_ITT_Response_PA23.docx` | Word A4 portrait | Main narrative response, sections 1–6 |
| `02_Pricing_Schedule_PA23.xlsx` | Excel, 7 sheets | Instructions, Summary, Lump Sum, Day Rates, Schedule of Rates, Optional Items, Whole Life Cost |
| `03_Certificate_of_Non_Collusion_PA23.docx` | Word A4 portrait | Non-collusion and non-canvassing declaration |
| `04_Form_of_Tender_PA23.docx` | Word A4 portrait | Formal offer, validity, addenda, execution |
| `05_Response_Checklist_PA23.docx` | Word A4 landscape | Compliance checklist by domain, portal control, sign-off |

Attachments are controlled by token families, not substituted for these documents: `COP_*`, `EXCLUSION_*`, `CONNECTED_PERSON_*`, `FY*`, `REFERENCE_*`, `EL_* PL_* PI_* CYBER_*`, `CARBON_*`, `MODERN_SLAVERY_*`, `NHS_EVERGREEN_*`, `PERSONNEL_*`, `APPENDIX_*`.

## 2. Token syntax

```
{{UPPER_SNAKE_CASE}}
```

ASCII `A–Z`, `0–9`, `_` only. No inner spaces. Repeating rows carry a numeric index from 1: `{{RISK_1_DESCRIPTION}}`. Checklist rows carry a domain letter and row number — Q qualification, T technical, C commercial, A administrative, F final: `{{STATUS_T7}}`, `{{OWNER_C3}}`.

Extraction regex: `\{\{[A-Z0-9_]+\}\}`

A token with no value renders as an empty string or `N/A`. **It never survives into an export.** Lowercase braces such as `{{note}}` are not tokens and do not trigger F1 — tested.

## 3. Types

| Type | Rendering |
|---|---|
| string | Single line |
| text | Multi-paragraph narrative |
| date | DD/MM/YYYY |
| datetime | DD/MM/YYYY HH:MM, Europe/London |
| integer | Whole number |
| decimal | Two decimal places |
| currency | `£#,##0.00` rendered; **stored and compared as integer pence** |
| percent | 0–100 consistently |
| boolean | Yes / No |
| enum | One of the listed values only |
| email, phone, url | Format-validated |

Currency is the one that bites. Money is compared as integer pence. Comparing formatted strings hides rounding and returns a false pass — `checkF3` returns `unknown` rather than passing if given a string or a float.

## 4. Shared identity tokens

These render identically in every document that carries them. Divergence is the most common avoidable rejection cause.

```
TENDER_REF · TENDER_TITLE · COMPANY_LEGAL_NAME
BUYER_ORGANISATION · LOT_NUMBER · SUBMISSION_DEADLINE
```

"Acme Ltd" and "Acme Limited" are a conflict, not a synonym. A dropped digit in a tender reference is caught. Both are tested.

## 5. Universal output checks

| ID | Rule | Severity | Automated |
|---|---|---|---|
| F1 | No unresolved token remains after generation | Hard fail | Yes |
| F2 | Shared identity tokens agree across documents | Hard fail | Yes |
| F3 | Form of Tender price equals Pricing Schedule headline total | Hard fail | Yes |
| F4 | Every required signature and execution block is complete | Hard fail | Yes |
| F5 | Required portal forms and attachments uploaded before deadline | Hard fail | **No** |
| F6 | Every response within its buyer word or page limit | Hard fail | Yes |
| F7 | Named staff, FTEs, TUPE and delivery claims match the priced solution | High risk | **No** |
| F8 | Social value commitments have measurable targets, owners, dates, cost treatment | High risk | Yes |
| F9 | Insurance and accreditation valid to contract start, or renewal evidence attached | High risk | Yes |
| F10 | Exported files downloaded from the portal and re-opened before deadline | Hard fail | **No** |

**The `automated` column is a product commitment, not a note.** F5, F7 and F10 are human attestations the platform records but cannot verify. The UI must show that distinction. Claiming to have checked something the software cannot see is exactly the failure this product exists to prevent, and it is the fastest route to a liability the company cannot carry.

## 6. Evidence validity is measured to contract start

Not to the submission deadline. A certificate that lapses between submission and contract start is a live risk a buyer will raise. `checkF9` requires `contractStartDate` and returns `unknown` without it.

Renewal evidence attached moves the item from fail to pass with a caveat — some buyers accept renewal undertakings and some do not. The caveat is surfaced rather than resolved silently.

## 7. Export gate

```
RED    a hard fail is unresolved         final export BLOCKED
AMBER  hard fails waived, or high risk   final export allowed
GREEN  everything passed                 final export allowed
```

**Draft export is never gated.** Available on every plan including Free, at every status including RED. A prospect must be able to take something away, and a bid team under deadline must be able to circulate a working draft.

An `unknown` result on a hard-fail check is treated as blocking. An unchecked control is not a passed control.

## 8. Waivers

A waiver requires a named person and a recorded reason. `evaluateExportGate` throws if either is absent — an anonymous waiver defeats the audit trail, so it is rejected in code rather than discouraged in documentation.

Every waiver writes an `audit_finding_waived` event carrying the check, the person and the reason. This is the single most consequential action in the product and it is logged as such.

A waived hard fail produces AMBER, never GREEN. The distinction between "this passed" and "someone decided to proceed anyway" must survive to the audit trail.

## 9. Terminology under PA23

| Use | Not |
|---|---|
| Most Advantageous Tender (MAT) | MEAT |
| Conditions of Participation (CoP) | PQQ, ESPD, PCR 2015 Reg 58 |
| Find a Tender, Central Digital Platform | OJEU, TED |
| PPN 006 | PPN 06/21 |
| PPN 002 / PPN 026 | PPN 06/20 |
| Common Assessment Standard | PAS 91 — withdrawn April 2023 |

Legacy terminology in a generated document tells a buyer the supplier is working from an out-of-date pack.

## 10. Adding a token

1. Define it in the registry with document, section, type, severity and help text
2. Add it to `SHARED_IDENTITY_TOKENS` if it appears in more than one document
3. Write a fixture for its failure mode, not only its success case
4. Confirm `node tools/tokens.test.mjs` exits 0

In that order. A token without a failure fixture is a token nobody has tested.
