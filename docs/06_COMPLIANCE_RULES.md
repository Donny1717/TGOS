# Compliance Rules

Six rules implemented in `tools/rules.mjs`, covered by 29 boundary fixtures in `tools/rules.test.mjs`. Every threshold is read from `regulatory-dataset.json` at evaluation time. No regulatory number appears in the rule code.

---

## Contract properties

Every rule declares:

- **Duty holder** — supplier, or contracting authority. Two of the six are buyer duties and must never render on a supplier's task list.
- **Comparator** — read from the dataset, never assumed. `above £5m` is not `>= £5m`.
- **UNKNOWN as a real result** — insufficient input returns UNKNOWN with the missing fields named. Never a default pass, never a default fail.
- **Sources on every result** — a finding the user cannot trace is indistinguishable from an invention.

---

## R1 · Carbon Reduction Plan — PPN 006

**Duty:** supplier, as a condition of participation.
**Trigger:** contract value **above** £5m per annum, **including VAT**, averaged over the life of the contract.
**Scope:** central government departments, executive agencies, NDPBs.
**Carve-out:** applies only where related and proportionate — this is not an unconditional gate.

Requires `annualValueIncVat`, `contractYears`, `buyerType`. A value supplied exclusive of VAT returns UNKNOWN rather than being silently compared.

*Fixture:* exactly £5,000,000/yr → NOT_APPLICABLE. The August spec used `>=` and would have demanded a CRP from a customer who did not need one.

## R2 · Contract KPIs — PA23 s.52

**Duty:** contracting authority. **Not the supplier.**
**Trigger:** estimated value **more than** £5m — total, not per annum.
**Requirement:** at least three KPIs, set before entering into the contract.
**Disapplied** by s.52(2) where performance cannot appropriately be assessed by KPIs.

Surface to the supplier as intelligence about how they will be measured. Never as a task.

*Fixtures:* exactly £5,000,000 → NOT_APPLICABLE; `dutyHolder` is `contracting_authority`; `supplierAction` is `none`.

**R1 and R2 must never share a constant.** Different bases, different comparators, different duty holders.

## R3 · Higher-risk building — BSA 2022 s.65

**Test:** (at least 18 metres **OR** at least 7 storeys) **AND** at least 2 residential units.

Height measured to the top floor surface. Storeys consisting solely of rooftop plant are ignored. During design and construction the definition also captures care homes and hospitals at least 18m. Rooftop-garden treatment has been under MHCLG review since 17 December 2025 and is unsettled.

*Fixtures:* 7 storeys at 17m → APPLIES. The August spec tested height alone and would have produced a **false negative in a building-safety check**. 20m and 8 storeys with 1 residential unit → NOT_APPLICABLE. Missing `residentialUnits` → UNKNOWN, never a pass.

## R4 · Social value model — PPN 002 vs PPN 026

**Selected from the tender documents, never from the current date.**

PPN 002: minimum 10% of the total score, or 10% of the **non-price criteria** where an absolute methodology such as Price per Quality Point is used.

PPN 026: from procurements commenced on or after 1 January 2027. Scope from £1m inc VAT. 10% at £1m to under £5m; 20% at £5m and above. Two outcomes — Good Jobs, Skills — across six model award criteria. Central government only; local government and the NHS may adopt voluntarily.

**Concurrency hazard.** Both models run at once from 1 January 2027. Commencement is publication of the tender notice. Date-based selection gives wrong guidance to a large share of customers throughout 2027.

**Coverage gap.** PPN 002 applied from the ordinary threshold; PPN 026 starts at £1m. Contracts between roughly £135,018 and £1m carry no mandated social value from 2027. The engine flags `coverageGap: true` rather than treating it as an error.

Cabinet Office practitioner guidance and sub-criteria are still pending. Do not rely on detail below model level until published.

*Fixtures:* commenced 2026-12-31 → PPN 002 regardless of today's date; missing commencement date → UNKNOWN.

## R5 · NHS modern slavery — SI 2025/1212

**Duty:** the buyer. **No value threshold.**
In force 17 May 2026. Public bodies procuring goods or services for the health service in England must carry out a modern slavery risk assessment before advertising and before award, across the whole commercial lifecycle.

Covers central purchasing bodies and local authorities buying for the health service, not only NHS trusts.

**Distinct rule:** PA23 Schedule 6 makes modern slavery offences a mandatory exclusion ground on every procurement. Model separately.

*Fixture:* a £40,000 NHS contract → APPLIES. Gating this rule on value would suppress it on most contracts.

## R6 · Award outcome — PA23 s.19

Two distinct mechanisms, which the August spec collapsed into one.

| State | Basis | Remediable |
|---|---|---|
| `FAILS_REQUIREMENTS` | s.19(2)(a) — does not satisfy the authority's requirements | No |
| `AT_RISK_OF_DISREGARD` (abnormally low) | s.19(3), with a statutory right to explain under s.19(4)–(5) | **Yes** |
| `AT_RISK_OF_DISREGARD` (procedure, conditions) | s.19(3) | Authority discretion |
| `ELIGIBLE_FOR_ASSESSMENT` | Satisfies requirements | — |

"Requirements" means those described in the tender notice or associated tender documents (s.19(7)).

*Fixture:* abnormally low → `AT_RISK_OF_DISREGARD`, `remediable: true`. Telling a customer their bid is dead when the law gives them a right to respond is the failure this fixture prevents.

---

## Coverage

Six rules. UK public procurement contains far more. This is not a claim of completeness — it is a claim that each implemented rule is evidenced, tested and traceable.

Add rules by adding a dataset entry with a primary source, then a rule that reads it, then boundary fixtures. In that order.
