# Corrections Register

Defects found in the 30 August 2026 pack during regulatory audit, 6 September 2026.
Each was verified against a primary source. Each would have caused the platform to give a customer a wrong answer.

---

## A. Defects that change what the system decides

### A1 — PAS 91 is a withdrawn standard

**Pack said:** PAS 91 financial ratios; "PAS 91 readiness module"; PAS 91 presented as a live pre-qualification requirement.

**Reality:** PAS 91:2013+A1:2017 was withdrawn by BSI in April 2023. PPN 03/24 directs public sector buyers to the **Common Assessment Standard (CAS)** for construction pre-qualification. CAS Version 5 (1 July 2025) made the Building Safety section mandatory.

**Impact:** A compliance module built on a standard that no longer exists. Every customer-facing claim referencing PAS 91 is wrong, and the audience most likely to buy this product is the audience most likely to know that.

**Action:** Purge every PAS 91 reference. Replace with CAS. See `prequalification.construction.standard`.

**Residual risk:** PPN 03/24 is titled "Standard Selection Questionnaire (SQ)" and was issued March 2024 under the PCR 2015 regime. PA23 replaced the SQ with the Procurement Specific Questionnaire (PSQ) from 24 February 2025. PPN 03/24 may itself be superseded. The gov.uk PPN page has not been read directly. Entry carries `needs_review`.

---

### A2 — PPN 003 does not govern payment

**Pack and outreach copy said:** "PPN 003's 30-day payment obligations."

**Reality:** three separate things were collapsed into one wrong statement.

| What | Source | Substance |
|---|---|---|
| 30-day sub-contract terms | PA23 **s.73(1)** — statute, not a PPN | Implied into every public sub-contract |
| Supplier payment standard | **PPN 018**, from 1 Oct 2025 | 95% of invoices within 60 days (90% with action plan) **and** all invoices averaging 45 days |
| Spot checks | **PPN 021**, April 2025 | Sub-contracts over £5m pa inc VAT |

**Impact:** the headline figure in the marketing copy (30 days) is not the figure suppliers are assessed against (45-day average). A bid professional reads this and concludes the product author has not read the source material.

**Action:** remove PPN 003 everywhere. See `payment.subcontract_terms` and `payment.supplier_standard`.

---

### A3 — Wrong comparator on the CRP trigger

**Pack said:** `>= £5m`.

**Reality:** PPN 006 reads *"above £5 million per annum (including VAT based on the advertised contract value, averaged over the life of the contract)"*. Strictly greater than.

**Impact:** a contract valued at exactly £5,000,000 is out of scope. The platform would have blocked export and demanded a Carbon Reduction Plan from a customer who did not need one.

**Also missing from the pack:** the value is averaged over contract life, and PPN 006 carries a "related and proportionate" carve-out — so this is not an unconditional gate.

**Action:** see `carbon.crp.trigger`, field `comparator: greater_than`.

---

### A4 — Wrong comparator on the KPI threshold, and wrong duty-holder

**Pack said:** contracts `>= £5m` require at least 3 KPIs, framed as a supplier obligation.

**Reality:** PA23 s.52(1): *"Before entering into a public contract with an estimated value of **more than** £5 million, a **contracting authority** must set at least three key performance indicators."*

**Two defects:** the comparator, and the duty-holder. This is an obligation on the buyer. The platform would have told suppliers to do something that is not theirs to do.

**Note:** s.52(5) permits the threshold to be changed by regulations — a live change vector to monitor.

**Action:** see `kpi.pa23.s52`.

---

### A5 — Building Safety Act test is missing half its logic

**Pack said:** "BSA 18m threshold."

**Reality:** BSA 2022 s.65 plus the Higher-Risk Buildings (Descriptions and Supplementary Provisions) Regulations 2023: a higher-risk building is one that is **at least 18 metres in height OR has at least 7 storeys**, AND contains **at least 2 residential units**.

**Impact:** a 7-storey building under 18 metres qualifies. The platform as specified would have passed it. That is a **false negative in a building-safety check** — the worst possible failure direction for this product.

**Additional detail the pack omits:** height is measured to the top floor surface; storeys consisting solely of rooftop plant are ignored; during design and construction the definition also captures care homes and hospitals at least 18m. Roof-garden treatment has been under MHCLG review since 17 December 2025 and is unsettled.

**Action:** see `bsa.higher_risk_building`.

---

### A6 — s.19 collapses two distinct mechanisms

**Pack said:** s.19(2)(a) "must satisfy requirements before scoring" — treated as a single fail state.

**Reality:** PA23 s.19 contains two separate mechanisms. Under s.19(2)(a) a tender that does not satisfy the authority's requirements cannot be the most advantageous tender. Under s.19(3) the authority may **disregard** a tender for other reasons — conditions of participation, abnormally low price, procedural breach. Abnormally low price carries a statutory right to explain under s.19(4)–(5) before the tender may be disregarded.

**Impact:** modelling these as one state means telling a customer their bid is dead when the law still gives them a right to respond.

**Action:** model FAILS_REQUIREMENTS and DISREGARDED as distinct states. See `award.pa23.s19`.

---

### A7 — NHS Evergreen scope stated too broadly

**Pack said:** NHS Evergreen Level 1 from 6 April 2026, framed as applying to NHS procurement generally.

**Reality:** the requirement applies to **NHS Supply Chain** tenders. It is an eligibility gate at tender close and is **not scored or weighted**. Level 1 includes holding a PPN 006-compliant CRP but does not discharge the other four of the Five Supplier Asks. Score valid 12 months.

**Change pending:** NHS published a Net Zero Supplier Roadmap update on 9 June 2026 introducing new requirements from 1 April 2027. Recorded as `nextExpectedChange`.

**Action:** see `nhs.evergreen.level1`.

---

### A8 — NHS modern slavery duty: wrong duty-holder, and must not be value-gated

**Pack said:** NHS Modern Slavery Regs, effective 17 May 2026, listed alongside value-triggered rules.

**Reality:** the National Health Service (Procurement, Slavery and Human Trafficking) Regulations 2025 (SI 2025/1212), in force 17 May 2026, place the duty on **public bodies procuring for the health service in England** — including central purchasing bodies and local authorities, not only trusts. It applies **regardless of contract value**.

**Impact:** gating this rule on a monetary threshold would suppress it on most contracts.

**Separately:** PA23 Schedule 6 makes modern slavery offences a **mandatory exclusion ground**. That is a different rule with different consequences and must be modelled separately.

**Action:** see `nhs.modernslavery.regs`.

---

### A9 — The £5.337m figure attached to CAS is stale

**Widely repeated across the industry and in the pack.** That was the works threshold before 2026. From 1 January 2026 the works threshold is **£5,193,000** (SI 2025/1200). Repeating £5.337m now is wrong.

---

## B. Internal contradictions inside the August pack

### B1 — Two document generations coexist

Near-identical filenames carry different PPN references:

| File | Social value | Carbon |
|---|---|---|
| `Tender_Submission_Checklist.docx` | PPN 002 | PPN 006 |
| `Tender_Submission_Checklist__.docx` | PPN 06/20 | PPN 06/21 |
| `ITT_Response_Template__1_.docx` | — | PPN 006 |
| `ITT_Response_Template.docx` | — | PPN 06/21 |

Loading the wrong copy makes the platform cite withdrawn policy. There are also six near-duplicate copies of `Placeholder_Index___Integration_Guide`.

### B2 — Brand name is inconsistent

Documents variously use **TENDER.GATE.OS.COM** and **TENDER.GATE.OS**. The locked brand is **TENDER.GATE.OS**. Every TENDER.GATE.OS occurrence must be corrected.

### B3 — Two milestone schemes

`TENDER.GATE.OS_Full_Stack_Architecture_Agent_Blueprint.md` defines milestones **M0–M8**. The milestone prompt files define **M00–M10**. These do not map to each other. One scheme must be retired.

### B4 — Deployment platform is asserted, not decided

The architecture blueprint states a *"Vercel + Supabase deployment baseline."* The locked position is that the deployment platform is **undecided until M10** and Vercel must not be assumed. Supabase is locked; the hosting platform is not.

---

## C. What was correct

Stated for balance, and because these were verified rather than assumed.

- **PPN 026** — every detail in the pack matched gov.uk: £1m inc VAT scope, 10% at £1m–<£5m, 20% at £5m+, two outcomes, six model award criteria, central government only, NHS and local government not required.
- **PPN 002** — 10% minimum weighting confirmed. One wording nuance: for absolute methodologies the PPN says 10% of the **non-price criteria**; the pack said "quality."
- **£135,018** — confirmed against SI 2025/1200 on legislation.gov.uk.
- The decision to name PPN 006 and PPN 002 rather than the legacy 06/21 and 06/20 numbering was correct; the older files simply were not updated.
