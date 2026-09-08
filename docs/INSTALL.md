# Install

## Requirements

Node 22 or later for the regulatory tools and Docker Desktop plus the Supabase CLI
for database gates. Install the workspace dependencies with `npm install`.

## Contents

```
TENDER_GATE_OS_Pack_2026-09-07/
  00_READ_FIRST.md
  docs/
    01_PRODUCT_PACK.md               what it is, scope, stack
    02_ARCHITECTURE.md               build architecture
    03_PRICING_AND_ENTITLEMENTS.md   ladder, entitlements, Stripe
    04_MILESTONE_ROADMAP.md          M00 to M10
    05_GO_TO_MARKET.md               sequencing, message discipline
    06_COMPLIANCE_RULES.md           the six rules in plain English
    07_CORRECTIONS_REGISTER.md       what was wrong in the legacy pack
    08_LOCKED_DECISIONS.md           decisions and their status
    09_MIGRATION_FROM_LEGACY.md      rename map and string purge
    10_TOKEN_REGISTRY.md             Master Suite tokens and F1-F10
    11_MILESTONE_PROMPTS.md          prompts for a coding agent
    INSTALL.md
    audit-report.txt
  tools/
    regulatory-dataset.json          14 values with provenance
    validate.mjs                     9 evidence-quality rules
    rules.mjs                        6 compliance rules
    rules.test.mjs                   29 boundary fixtures
    tokens.mjs                       token registry and export gate
    tokens.test.mjs                  42 fixtures
```

## Verify before trusting

```bash
cd tools
node validate.mjs       # RESULT: PASS, exit 0
node rules.test.mjs     # passed 29  failed 0
node tokens.test.mjs    # passed 42  failed 0
```

Prove the validator fails when it should:

```bash
TGOS_TODAY=2027-02-01 node validate.mjs    # exit 1, stale entries blocked
```

If any command does not behave as described, stop and report it rather than proceeding.

## Order of work

1. `00_READ_FIRST.md`
2. `docs/07_CORRECTIONS_REGISTER.md`
3. `docs/09_MIGRATION_FROM_LEGACY.md`
4. `docs/08_LOCKED_DECISIONS.md` — resolve the open items
5. Confirm the three commands above exit 0
6. `docs/11_MILESTONE_PROMPTS.md` — start M01

## Placing the tools in the codebase

```bash
mkdir -p tender-gate-os/packages/regulatory-data
cp tools/regulatory-dataset.json tools/validate.mjs \
   tender-gate-os/packages/regulatory-data/

mkdir -p tender-gate-os/packages/rules-engine
cp tools/rules.mjs tools/rules.test.mjs \
   tender-gate-os/packages/rules-engine/

mkdir -p tender-gate-os/packages/document-engine
cp tools/tokens.mjs tools/tokens.test.mjs \
   tender-gate-os/packages/document-engine/
```

`rules.mjs` resolves the dataset relative to its own file. If you split the packages as above, update that import to point at `packages/regulatory-data/regulatory-dataset.json`.

## CI gate

```yaml
- run: node packages/regulatory-data/validate.mjs
- run: node packages/rules-engine/rules.test.mjs
- run: node packages/document-engine/tokens.test.mjs
- run: npm run lint --workspace apps/web
- run: npm run build --workspace apps/web
- run: npm run test:rls
- run: npm run test:m02
- run: npm run test:m03
```

All checks must pass before release. Wire `validate.mjs` as a pre-commit hook as well — it is the check that catches a stale regulatory value before it reaches a customer.

The RLS gate uses the local Supabase database and therefore requires Docker Desktop. Run
`supabase start` before `npm run test:rls`; the test deliberately exercises the database
policies as the `authenticated` role rather than checking only application code.
The M02 gate uses the same local database and verifies version retrieval, SHA-256 and byte-size
preservation, immutable version rows, and tenant/workspace integrity. The application upload
flow stores files in the private `tender-source-documents` bucket and issues five-minute signed
download URLs.

## Maintaining the dataset

Adding or changing a value requires: a primary source URL on legislation.gov.uk, gov.uk, assets.publishing.service.gov.uk or england.nhs.uk; a legal basis; an effective date; today's date in `lastVerified`; a sensitivity level; and a VAT basis if monetary.

Set `nextExpectedChange` whenever a change date is known. The validator blocks any entry whose expected-change date has passed unreconciled. That is the mechanism that replaces remembering.

Review ages: high 90 days, medium 180, low 365.

## Adding a rule

1. Add a dataset entry with a primary source
2. Write the rule to read it by `id` — never hardcode the value
3. Write boundary fixtures, including the failure and UNKNOWN paths
4. Confirm all three test commands still exit 0

In that order.
