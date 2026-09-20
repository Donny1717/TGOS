# TGOS — Product, UX/UI and Accessibility Build Specification

**Product:** Tender Gate OS (TGOS)  
**Version:** 1.0  
**Status:** Authoritative agent implementation specification  
**Primary market:** UK suppliers, bid teams, tender consultants, and compliance teams  
**Accessibility requirement:** WCAG 2.2 Level AA  

---

## 1. Purpose of this document

This document is the authoritative product, design, UX, UI, accessibility, and implementation brief for TGOS.

AI coding agents, designers, developers, and reviewers must use this document to make implementation decisions. Where the existing application conflicts with this specification, preserve working security and data logic, but refactor the user interface, user experience, information architecture, and copy to meet this specification.

TGOS must be a premium, calm, credible, enterprise B2B SaaS product. It must not feel like a generic chatbot, a consumer app, an unfinished prototype, a cluttered admin panel, or a file-storage application.

Do not change production database data, remove security controls, expose secrets, weaken authorisation, or replace real data with demo data without an explicit instruction.

---

## 2. Product definition

### 2.1 Product name

**TGOS — Tender Gate OS**

### 2.2 Product role

TGOS is an AI-assisted tender compliance and submission-readiness platform for UK suppliers responding to tenders.

TGOS helps users:

- Upload and organise tender packs.
- Identify tender requirements, mandatory documents, pass/fail questions, scored questions, deadlines, word limits, evaluation weightings, and submission rules.
- Match company evidence and draft responses against tender requirements.
- Flag missing, expired, insufficient, inconsistent, or unverified evidence.
- Assign actions and owners to resolve compliance gaps.
- Run a final submission readiness gate.
- Produce a Tender Readiness Report with evidence-backed findings.

### 2.3 Product promise

> **Know what is missing before you submit.**

### 2.4 Core value proposition

TGOS turns a complex tender pack into a structured, evidence-grounded compliance workflow. It gives bid and compliance teams a clear view of what is required, what is at risk, what must happen next, and whether a tender is ready for human approval before submission.

### 2.5 Product boundary

TGOS is a **compliance gatekeeper**, not primarily a bid-writing tool, document repository, procurement-law advice service, or tender-submission portal.

TGOS may:

- Extract and structure tender requirements.
- Identify potential gaps, conflicts, and risks.
- Match requirements to evidence.
- Support review, approval, action assignment, and readiness reporting.
- Provide AI-assisted analysis with document citations.

TGOS must not:

- Promise that a tender is legally compliant.
- Promise that a bid will win.
- Submit a tender into a buyer portal on the user’s behalf unless a separately approved integration exists.
- Present AI interpretation as legal advice.
- Invent requirements, deadlines, evidence, source citations, or compliance conclusions.
- Mark a tender as safe to submit without a named human approval step.

### 2.6 Mandatory user-facing disclaimer

Display this or an equivalent clear statement in relevant AI, readiness, and final-gate views:

> **AI-assisted analysis. Human review and approval are required before tender submission.**

---

## 3. DOCCUTE ecosystem position

TGOS is one independent specialist platform within the DOCCUTE Tender Ecosystem.

### 3.1 Ecosystem relationship

```text
DOCCUTE.COM
Official Control Core
Account • Organisation • Access • Billing • Shared Governance

DCOS
Approved document and evidence control
        ↓
Bidsmith / Doccute.uk
Tender response creation and bid workspace
        ↓
TGOS
Tender compliance and final submission-readiness gate

UKKB
UK procurement intelligence, guidance and checklists
```

### 3.2 TGOS ownership

TGOS owns:

- Tender workspaces.
- Tender-pack classification.
- Extracted tender requirements.
- Requirement status and risk assessment.
- Tender-specific evidence mapping.
- Compliance checks.
- Issues and corrective actions.
- Readiness decisions.
- Final approval workflow.
- Tender Readiness Reports.

### 3.3 TGOS inputs

TGOS may receive:

- Tender documents and buyer clarifications from the user.
- Approved evidence from DCOS when the organisation permits sharing.
- Draft response content and project status from Bidsmith when the organisation permits sharing.
- Procurement checklists and guidance from UKKB when applicable.

### 3.4 TGOS outputs

TGOS may provide:

- Requirement registers to Bidsmith.
- Evidence gaps and expiry risks to DCOS.
- Tender-specific guidance links to UKKB.
- Readiness status, risk summaries, and approval status to DOCCUTE.COM’s control-centre dashboard.

---

## 4. Users and jobs to be done

### 4.1 Primary users

| User | Primary need | TGOS outcome |
|---|---|---|
| Bid Manager | Deliver a complete compliant tender by the deadline | Knows what is missing, at risk, assigned, and ready |
| Tender Writer | Answer every question to the required format | Sees questions, limits, scoring criteria, and evidence needs |
| Compliance Manager | Ensure company evidence is current and valid | Sees expiring, missing, inconsistent, or insufficient documents |
| SME Director | Make an informed submit/no-submit decision | Receives a concise readiness report and blocker list |
| Tender Consultant | Manage multiple client tenders transparently | Can review requirements, evidence, issues, and approvals |
| Reviewer/Approver | Approve the final readiness decision | Sees an auditable summary with source-backed findings |

### 4.2 Key jobs to be done

1. When I receive a complex tender pack, I want TGOS to extract and structure all requirements so that I do not miss a disqualifying condition.
2. When I prepare a response, I want to know whether I have suitable evidence for every important requirement so that claims are defensible.
3. When a deadline approaches, I want a prioritised action list so that the team fixes the most serious blockers first.
4. Before submission, I want a clear human-approved decision with an audit trail so that we can submit with confidence and accountability.

---

## 5. Information architecture

Use one clear navigation level. Do not create duplicate top navigation, nested sidebars, or competing menus.

### 5.1 Application shell

- Fixed desktop left sidebar, approximately 240px wide.
- One compact top bar.
- Main content region with max width approximately 1440px.
- Responsive layout that collapses the sidebar into an accessible mobile drawer.
- Do not create a second navigation tier.

### 5.2 Sidebar navigation

Use these primary items only:

1. Overview
2. Tenders
3. Requirements
4. Evidence
5. Issues
6. Reports
7. Settings

At the sidebar bottom:

- Organisation switcher.
- User profile menu.
- Help and accessibility link.

### 5.3 Top bar

The top bar should contain only context and utilities:

- Current tender context, where relevant.
- Deadline countdown, where relevant.
- Notifications.
- User menu.

Do not put another full navigation menu in the top bar.

### 5.4 Shared routes

Suggested route structure:

```text
/
/dashboard
/tenders
/tenders/new
/tenders/:tenderId
/tenders/:tenderId/documents
/tenders/:tenderId/requirements
/tenders/:tenderId/evidence
/tenders/:tenderId/issues
/tenders/:tenderId/final-gate
/tenders/:tenderId/report
/evidence
/issues
/reports
/settings
/settings/accessibility
```

Retain existing routes where business logic depends on them, but improve labels and navigation mapping.

---

## 6. Design principles

### 6.1 Design objective

At every screen, a user must be able to answer four questions:

1. What is at risk?
2. What must I do next?
3. Who owns the action?
4. Is the tender ready to submit?

### 6.2 Product personality

TGOS must feel:

- Calm.
- Controlled.
- Secure.
- Evidence-led.
- Precise.
- Professional.
- Suitable for UK enterprise, public-sector, and compliance workflows.

TGOS must not feel:

- Loud, playful, overly rounded, or consumer-oriented.
- Like a chat-first AI product.
- Like an unstructured file browser.
- Like an analytics dashboard with decorative charts.
- Like a prototype containing generic placeholder cards.

### 6.3 Interaction principles

- One clear primary action per page.
- Put the most urgent action above the fold.
- Prioritise blockers and deadlines over secondary analytics.
- Prefer visible task states over hidden workflow.
- Use progressive disclosure: show summary first, detail in an accessible drawer or detail view.
- Preserve user confidence: every AI finding must show evidence and uncertainty.
- Do not rely on colour alone.
- Keep terms consistent across the product.

---

## 7. Visual design system

### 7.1 Colour tokens

Use the following base tokens. Validate final text and component combinations using a contrast checker before release.

```css
:root {
  --tgos-navy: #0B1F3A;
  --tgos-primary: #123B66;
  --tgos-primary-hover: #0E3156;

  --tgos-background: #F6F8FB;
  --tgos-surface: #FFFFFF;
  --tgos-surface-subtle: #F8FAFC;
  --tgos-border: #CBD5E1;
  --tgos-border-strong: #94A3B8;

  --tgos-text: #172033;
  --tgos-muted: #475569;
  --tgos-subtle: #64748B;

  --tgos-success: #15803D;
  --tgos-success-bg: #DCFCE7;
  --tgos-warning: #9A4F08;
  --tgos-warning-bg: #FEF3C7;
  --tgos-critical: #B91C1C;
  --tgos-critical-bg: #FEE2E2;
  --tgos-info: #1D4ED8;
  --tgos-info-bg: #DBEAFE;

  --tgos-focus: #005FCC;
  --tgos-focus-offset: #FFFFFF;
}
```

Rules:

- Do not use gradients, glassmorphism, neon colours, or low-contrast pale text.
- Do not use red as decoration. Reserve critical red for significant risk, error, or blocking status.
- Do not use status colour without visible text.
- Use colour sparingly and consistently.

### 7.2 Typography

- Use **Inter** or an equivalent accessible sans-serif typeface.
- Base font size: 16px.
- Do not use font sizes below 14px for data-table content.
- Use clear hierarchy and short line lengths for prose.
- Use sentence case for headings, buttons, labels, and navigation.
- Avoid all-caps except short status labels where readable and accompanied by clear text.

Suggested scale:

| Token | Size | Use |
|---|---:|---|
| Display | 32–36px | Page-level title on desktop only |
| H1 | 28–32px | Main page heading |
| H2 | 22–24px | Major section heading |
| H3 | 18–20px | Panel or subsection heading |
| Body | 16px | Default content |
| Body small | 14px | Supporting data, table cells, helper text |
| Label | 14px | Inputs, status, metadata |

### 7.3 Spacing, shape and elevation

- Use an 8px spacing system: 4, 8, 12, 16, 24, 32, 40, 48, 64.
- Use 10px corner radius for standard cards and controls.
- Use minimal soft shadows only when hierarchy requires it.
- Prefer borders and spacing over heavy shadows.
- Avoid cards inside cards inside cards.

### 7.4 Icons

- Use one icon set only, such as Lucide React.
- Every icon-only button must have an accessible name via visible text, `aria-label`, or tooltip with correct accessible behaviour.
- Icons support labels; they must not replace critical text.

### 7.5 Status system

Use meaningful labels with text and optionally an icon:

| Status | Label | Meaning |
|---|---|---|
| Success | Ready | Requirement/evidence is complete and suitable for review or use |
| Info | In progress | Work is underway or awaiting normal processing |
| Warning | Needs attention | Potential issue, incomplete evidence, or review is needed |
| Critical | Blocked | A mandatory or high-risk condition is unresolved |
| Neutral | Not started | No work or validation has started |
| Review | Human review required | AI cannot make a reliable determination |

Never show only a coloured dot. Use labels such as:

- `Blocked — Carbon Reduction Plan missing`
- `Needs attention — Insurance expires in 18 days`
- `Human review required — Contract clause unclear`
- `Ready — Approved evidence matched`

---

## 8. Core screens and behaviour

### 8.1 Marketing landing page

Purpose: explain TGOS clearly and convert qualified visitors into a demo, trial, or account creation.

Hero:

> **Know what is missing before you submit.**

Subheadline:

> TGOS turns complex tender documents into a clear, evidence-led readiness workflow — helping UK suppliers identify requirements, resolve gaps and complete a final human-approved compliance check before submission.

Primary CTA:

- `Start a tender readiness check`

Secondary CTA:

- `See how TGOS works`

Required page sections:

1. The tender problem: missed mandatory items, scattered evidence, rushed submission.
2. How TGOS works: upload, decode, resolve, approve.
3. Key outcomes: requirements, evidence, issues, final gate.
4. Product capability overview.
5. Trust and safeguards: source citations, permissions, audit trail, human review.
6. Accessibility and security summary.
7. CTA.

Do not use fake logos, fake testimonials, deceptive success claims, or claims of guaranteed compliance/wins.

### 8.2 Sign in and organisation setup

Requirements:

- Accessible sign-in form with visible labels.
- Support password managers and paste in password fields.
- No cognitive puzzle or CAPTCHA-only authentication requirement.
- Provide clear validation and error messages.
- Provide organisation creation, invitation, and role setup where supported.
- Explain why organisation data and access roles matter.

### 8.3 First-time onboarding

Use a simple 3-step onboarding flow:

```text
1. Create or select your organisation
2. Create a Tender Workspace
3. Upload your tender pack
```

Show progress in text and visually. Allow users to save and return later.

Do not overwhelm first-time users with every setting, analytics widget, or feature explanation.

### 8.4 Main dashboard

Purpose: answer “What needs my attention today?”

Header:

```text
Good morning, [Name]
You have [N] tenders requiring attention.

Primary action: + New tender
Secondary action: Upload tender pack
```

Show no more than four primary KPI cards:

1. Tenders requiring attention.
2. Critical issues.
3. Mandatory requirements at risk.
4. Nearest submission deadline.

Required panels:

- **Priority actions:** sorted Critical, High, Medium, Low.
- **Active tenders:** compact list/table sorted by deadline and risk.
- **Evidence alerts:** expiring or missing evidence where connected.
- **Recent activity:** compact, lower priority.

Do not show decorative charts unless a chart directly supports a task and all key information exists in text/table form.

### 8.5 Tenders list

Purpose: show all tender workspaces and their current state.

Columns:

- Tender title.
- Contracting authority.
- Submission deadline.
- Overall readiness status.
- Critical issue count.
- Mandatory completion.
- Owner.
- Last updated.

Controls:

- Search.
- Filter by status, deadline, owner, and risk.
- Sort by deadline, risk, and last updated.
- Clear empty state with `Create a tender` action.

### 8.6 Create Tender Workspace

Use a concise accessible form:

- Tender title.
- Contracting authority.
- Tender reference, optional.
- Submission deadline, optional but strongly encouraged.
- Submission portal, optional.
- Tender owner.
- Team members.

After creating a workspace, direct the user to document upload.

### 8.7 Tender Overview

Purpose: command centre for a single tender.

Header content:

```text
[Tender title]
[Contracting authority] · [Tender reference if available]
Submission deadline: [date and time] · [countdown]

Overall status: [Go / Conditional Go / No-Go / In progress]

Primary action: Run final gate
Secondary actions: Upload document, Share report
```

Below the header show:

- Overall readiness score as text, percentage, and explanatory status.
- Mandatory completion.
- Critical/high issue count.
- Missing documents/evidence count.
- Questions ready for review.
- Top three priority actions.
- Compact activity history.

Do not show the entire requirement register on this page.

### 8.8 Document upload and processing

Purpose: accept tender and supporting documents, show processing clearly, and preserve control.

Required features:

- Accessible `Choose files` button is the primary upload control.
- Drag-and-drop is optional enhancement only.
- Supported file types and size limits are shown before upload.
- File list shows name, type, size, upload status, processing status, and remove/retry actions.
- File upload must show text progress and accessible progress-bar semantics.
- Processing states use clear language, for example:
  - `Uploading 2 of 4 files`
  - `Extracting text from ITT.pdf`
  - `Identifying requirements`
  - `Ready for review`
- Errors must name the affected file and explain how to fix the problem.
- Users must be able to review document classification and correct it.

Suggested document classes:

- ITT / RFP / SQ.
- Specification.
- Pricing schedule.
- Form of Tender.
- Contract.
- Clarification.
- Appendix.
- Policy.
- Insurance certificate.
- Financial accounts.
- Accreditation/certificate.
- Case study.
- CV.
- Other.

### 8.9 Requirement Register

Purpose: provide a professional, searchable, auditable register of tender obligations.

Use a semantically correct table on desktop with an accessible responsive alternative at smaller widths.

Required columns:

| Column | Description |
|---|---|
| ID | Stable requirement identifier, such as M-01 or TQ-03 |
| Requirement | Concise title or question |
| Type | Mandatory, pass/fail, scored, technical, commercial, attachment, declaration, informational |
| Weighting | Score/percentage where found |
| Evidence status | Matched, partial, missing, invalid, review required |
| Overall status | Ready, in progress, needs attention, blocked, human review required |
| Owner | Person responsible for resolution |

Controls:

- Text search.
- Filters for type, status, owner, risk, evidence state, and deadline.
- Sorting.
- Saved views where supported.
- Accessible result count announcement after filtering.

Clicking a requirement opens an accessible right-side detail drawer. Do not unnecessarily navigate users away from the register.

### 8.10 Requirement detail drawer

Purpose: expose evidence and action without losing register context.

Required content:

- Requirement ID and status.
- Exact extracted requirement text.
- Source document name.
- Page number and section reference where available.
- Extracted source quote.
- Requirement type, weighting, word/character limit, deadline where found.
- Matched evidence list.
- Evidence gaps and conflicts.
- TGOS analysis.
- Confidence or uncertainty indicator.
- Clear `Human review required` state where needed.
- Owner, due date, activity, comments.
- Action controls, such as `Assign owner`, `Request evidence`, `Mark resolved`, or `Open source`.

AI output must visually and semantically distinguish:

- Facts found in source documents.
- Matched evidence.
- Suggested action.
- Uncertainty requiring human review.

### 8.11 Evidence view

Purpose: show tender-relevant documents and their validity.

Columns:

- Document name.
- Category.
- Version.
- Owner.
- Approval status.
- Effective date.
- Expiry/review date.
- Tender-ready status.
- Related requirements.

Priority filters:

- Missing.
- Expired.
- Expiring soon.
- Unapproved.
- Conflicting.
- Matched.

Primary action:

- `Upload evidence`

Where DCOS integration exists, clearly distinguish:

- Local tender document.
- DCOS approved evidence.
- Imported/shared evidence.

### 8.12 Issues and Actions

Purpose: transform findings into accountable corrective work.

Sort items by:

1. Critical.
2. High.
3. Medium.
4. Low.

Every issue must show:

- Severity.
- Tender.
- Related requirement.
- Why it matters.
- Source document/evidence citation.
- Owner.
- Due date.
- Recommended action.
- Current state.

Issue states:

- Open.
- In progress.
- Awaiting review.
- Resolved.
- Accepted risk.

Accepted risk requires:

- Named approver.
- Reason.
- Timestamp.
- Audit-log entry.

### 8.13 Final Submission Gate

Purpose: be the strongest, clearest, and most premium TGOS screen.

This screen provides an advisory, evidence-backed readiness decision. It does not itself submit the tender.

Header:

```text
Final Submission Gate

Overall decision: Go / Conditional Go / No-Go
[Short explanation]

AI-assisted analysis. Human review and approval are required before tender submission.
```

Required summary metrics:

- Mandatory requirements complete: `[N] / [N]`.
- Required attachments present: `[N] / [N]`.
- Evidence validity: `[N] / [N]`.
- Response completeness: `[N] / [N]`.
- Unresolved conflicts: `[N]`.
- Critical blockers: `[N]`.

Required content order:

1. Critical blockers first.
2. High-risk items.
3. Completion summary.
4. Remaining warnings.
5. Human approval area.
6. Report actions.

Decision definitions:

| Decision | Meaning |
|---|---|
| Go | No known critical blockers remain; final human approval is still required |
| Conditional Go | One or more non-critical or accepted-risk issues remain; human decision required |
| No-Go | Critical blocker(s) remain and must be resolved or formally accepted by an authorised approver |
| In progress | The system does not yet have enough information for a readiness decision |

Actions:

- `View critical issues`
- `Assign actions`
- `Request approval`
- `Download readiness report`
- `Share report`

The final approval control must record:

- Approver identity.
- Decision.
- Date/time.
- Optional comment.
- Any accepted-risk references.

### 8.14 Tender Readiness Report

Purpose: share a professional evidence-backed readiness summary with a bid director, client, or reviewer.

Required sections:

1. Tender summary.
2. Readiness decision and disclaimer.
3. Deadline and submission details.
4. Mandatory requirements status.
5. Critical and high-risk issues.
6. Evidence validity and gaps.
7. Requirement progress.
8. Human approvals and accepted risks.
9. Source citations and audit information.

The report must be readable in HTML and accessible when exported. Do not produce an inaccessible visual-only report.

### 8.15 Settings

Settings should cover:

- Organisation profile.
- User roles and members.
- Notifications.
- Data-sharing permissions.
- Integrations.
- Security controls.
- Billing access where applicable.
- Accessibility statement and feedback route.

---

## 9. AI rules and evidence model

### 9.1 Evidence-grounded AI only

TGOS AI must work from permitted source material, not unsupported assumptions.

Every AI finding must include, where available:

- Source document name.
- Page number or section reference.
- Extracted source quote.
- Related requirement ID.
- Evidence document reference if evidence is matched.
- Confidence/uncertainty indication.

### 9.2 Required AI output states

AI findings must use one of the following states:

| State | Definition |
|---|---|
| Pass / ready | Source-supported evidence appears to meet the stated requirement; human review may still be needed |
| Warning | Evidence or response exists but is incomplete, weak, near expiry, or needs confirmation |
| Gap | Required evidence, response, attachment, or information was not found |
| Conflict | Relevant documents contain inconsistent information |
| Human review required | The source is ambiguous, incomplete, inaccessible, or requires judgement beyond safe automated conclusion |

### 9.3 Prohibited AI behaviours

TGOS AI must not:

- Invent a source, page number, document, deadline, policy, certificate, financial amount, or compliance result.
- Convert uncertainty into a confident pass/fail conclusion.
- Say “legally compliant” unless the product is explicitly providing a validated legal service under separately approved policy.
- State that a tender will win.
- State that a buyer will accept a bid.
- Hide or downgrade critical blockers merely because text similarity is high.

### 9.4 Recommended AI wording

Use careful wording:

- `Potential gap identified`
- `No supporting evidence was found in the documents available to TGOS`
- `Human review required before relying on this finding`
- `The source appears to require...`
- `This evidence may not satisfy the stated threshold because...`

Avoid:

- `You are compliant`
- `This guarantees eligibility`
- `You will pass`
- `This tender is legally safe`

---

## 10. Data and permission principles

### 10.1 Organisation isolation

Data must be isolated by organisation. A user from one organisation must never access another organisation’s:

- Tender workspaces.
- Documents.
- Extracted requirements.
- Evidence.
- Issues.
- Reports.
- Approval history.

Enforce authorisation in the database/backend, not only in frontend route checks.

### 10.2 Core entities

Suggested core entities:

- Organisation.
- User.
- Membership.
- Role.
- TenderWorkspace.
- TenderDocument.
- DocumentVersion.
- ExtractedRequirement.
- EvidenceItem.
- EvidenceCitation.
- DraftResponse.
- ComplianceCheck.
- Issue.
- Action.
- Approval.
- AuditLog.
- Notification.

### 10.3 Audit log

Record auditable events, including:

- Tender workspace creation.
- Document upload, replacement, removal, and classification change.
- Requirement extraction and manual amendment.
- Evidence match/unmatch.
- Issue creation, status change, assignment, and resolution.
- Readiness decision generation.
- Risk acceptance.
- Final approval/rejection.
- Report export/share.

Each audit-log entry should include actor, action, target, timestamp, and relevant before/after values where appropriate.

### 10.4 Shared ecosystem data

When connecting to DCOS, Bidsmith, UKKB, or DOCCUTE.COM:

- Make data sharing explicit and permission-based.
- Show the origin of imported data.
- Preserve source ownership and version metadata.
- Let the organisation revoke sharing where technically feasible.
- Do not duplicate approved-document ownership into TGOS if DCOS is the canonical owner.

---

## 11. WCAG 2.2 AA accessibility requirements

### 11.1 Non-negotiable requirement

TGOS must be designed, implemented, tested, and maintained to meet **WCAG 2.2 Level AA** for all applicable Level A and Level AA success criteria.

Accessibility is a release requirement. It is not a later enhancement.

### 11.2 Semantic structure

- Use semantic HTML before ARIA.
- Use a correct document outline with one clear H1 per primary page and logical H2/H3 hierarchy.
- Use landmarks: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` where appropriate.
- Give navigation regions descriptive accessible labels.
- Add a visible-on-focus `Skip to main content` link as the first keyboard-focusable element.
- Use native `<button>` for actions and `<a>` for navigation.
- Do not use clickable `<div>` or `<span>` elements.

### 11.3 Keyboard access

All functions must work with:

- `Tab`
- `Shift + Tab`
- `Enter`
- `Space`
- `Escape`
- Arrow keys where standard component patterns require them

Requirements:

- Logical focus order.
- No keyboard traps except intentional modal/dialog containment that can be exited with Escape.
- No hover-only actions.
- No drag-only interactions.
- No time-limited interaction without a user-controlled extension or equivalent accessible alternative.

### 11.4 Focus visibility and focus not obscured

Do not remove default browser focus outlines unless replacing them with an equally or more visible focus indicator.

Use a shared focus treatment such as:

```css
:focus-visible {
  outline: 3px solid var(--tgos-focus);
  outline-offset: 3px;
  border-radius: 4px;
}
```

Requirements:

- Focus indicator must be clearly visible.
- Focus state must have sufficient contrast.
- Sticky headers, sidebars, banners, tooltips, dialogs, drawers, and overlays must not obscure the focused element.
- Ensure focus is visible on every interactive element, including rows, menus, icon buttons, tags, custom selects, table controls, upload controls, and pagination.

### 11.5 Contrast and visual information

- Normal text must meet at least 4.5:1 contrast ratio.
- Large text must meet at least 3:1 contrast ratio.
- Non-text UI components and focus indicators must meet at least 3:1 contrast ratio against adjacent colours where required.
- Do not use colour as the only method of conveying status, error, selection, completion, or risk.
- Ensure disabled states remain recognisable without becoming unreadable.

### 11.6 Pointer target size

- Interactive pointer targets must be at least 24 by 24 CSS pixels, except where a WCAG exception legitimately applies.
- Icon-only buttons need sufficient hit area even when the icon itself is smaller.
- Leave enough space between destructive or high-impact controls to reduce accidental activation.

### 11.7 Forms and validation

Every form control must have:

- Visible label linked to the control.
- Clear required/optional indication.
- Helpful instructions where needed.
- Programmatically associated errors.
- Error text explaining what is wrong and how to correct it.
- Error summary at the top of long forms when validation fails, with links to affected fields.

Do not use placeholder text as the only label.

Do not rely on red border alone for validation failure.

### 11.8 Upload accessibility

- Provide accessible file-picker controls.
- Drag and drop may be offered as an enhancement only.
- State accepted types and limits before upload.
- Announce upload and processing status through an `aria-live` region.
- Use accessible progress-bar semantics for percentage progress.
- Provide accessible retry/remove controls for each file.

Example:

```html
<div aria-live="polite" aria-atomic="true">
  Extracting requirements from ITT.pdf. 54% complete.
</div>
```

### 11.9 Dialogs and drawers

Modals and right-side detail drawers must:

- Use appropriate dialog semantics.
- Have a programmatic accessible name.
- Move focus into the dialog/drawer when opened.
- Keep focus within the active dialog while open.
- Close with Escape unless a truly exceptional workflow requires otherwise.
- Return focus to the triggering element when closed.
- Avoid obscuring focus.
- Have an accessible close button with a clear name.

### 11.10 Tables and data-heavy views

For Requirement Register, Evidence, Issues, and Reports:

- Use semantic `<table>` where tabular relationships exist.
- Use `<caption>` where it improves understanding.
- Use `<thead>`, `<tbody>`, `<th>`, and correct `scope` attributes.
- Associate sortable headers with sort state, such as `aria-sort`.
- Give search and filter controls visible labels.
- Announce filtered result totals through a polite live region.
- Ensure horizontal table scroll has an accessible alternative or clear responsive layout.
- Do not hide important information only in hover tooltips.

### 11.11 Responsive reflow and zoom

- Support browser zoom to 200% without loss of information or functionality.
- Support responsive reflow at a 320 CSS pixel viewport width without unnecessary two-dimensional scrolling.
- Tables may scroll horizontally when required, but controls and key context must remain accessible.
- Do not prevent user text resizing.

### 11.12 Motion and animation

- Respect `prefers-reduced-motion`.
- Avoid non-essential auto-playing motion.
- Do not use flashing content.
- Ensure status information is conveyed in text, not only by animated loading effects.

Example:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 11.13 Authentication

- Do not require users to solve cognitive tests as the only login path.
- Support password managers.
- Allow paste into username and password fields.
- Avoid unnecessary re-authentication during normal work.
- Provide accessible MFA flows where MFA is implemented.

### 11.14 Content and AI accessibility

- AI findings must be real text, not text embedded in images.
- Source citations must be keyboard accessible.
- Every chart/score must have text alternative and underlying table/list data.
- Status must include readable label and explanatory text.
- AI confidence and human-review requirements must be announced in text.

### 11.15 Accessibility statement

Provide a dedicated accessible page at `/settings/accessibility` and a public marketing-page link.

The statement must include:

- Commitment to WCAG 2.2 AA.
- Date of latest assessment.
- Testing approach.
- Known limitations, if any.
- Planned remediation dates where known.
- Feedback/contact mechanism.
- Escalation route.

Do not claim certification. Use accurate language:

> Designed and tested to meet WCAG 2.2 AA.

Only make that claim when evidence from testing supports it.

---

## 12. Engineering requirements

### 12.1 Stack alignment

The current application uses TypeScript/Vite structure. Preserve the existing functional stack unless a migration is explicitly authorised.

Preferred UI implementation approach:

- React.
- TypeScript.
- Tailwind CSS.
- Accessible components based on Radix primitives or equivalent.
- Lucide React icons.
- React Hook Form and Zod for accessible form validation.
- TanStack Table for complex table state, while retaining correct semantic table output.

Do not add a dependency unless it solves a real requirement and is compatible with the current project.

### 12.2 Security

- Never expose Supabase service-role keys or equivalent server secrets in frontend code, client bundles, browser storage, logs, screenshots, or Git commits.
- Enforce organisation/workspace access on the backend/database.
- Treat route guards as convenience only, not security.
- Validate uploaded file type, size, and ownership.
- Apply secure storage paths that prevent cross-organisation access.
- Sanitize user-controlled content where rendered.
- Record privileged actions in an audit log.

### 12.3 Quality gates

Before release or handover, run and pass:

```bash
bun install
bun run lint
bun run typecheck
bun run build
```

If the repository uses npm instead of Bun in its actual scripts, use the package-manager commands defined by the repository. Do not invent scripts; inspect `package.json` first.

Fix errors rather than suppressing them with broad ignores, unsafe casts, disabled rules, or empty catch blocks.

### 12.4 Error states

Implement polished and actionable states for:

- No tenders yet.
- No documents uploaded.
- Empty requirement register.
- Processing in progress.
- Upload failure.
- AI extraction failure.
- Permission denied.
- Network failure.
- No filtered results.
- Evidence not found.
- Final gate cannot run due to insufficient data.

Every error state must explain what happened and offer a practical next step.

### 12.5 Loading states

- Use skeletons for content loading where appropriate.
- Use real status copy for long-running document/AI operations.
- Do not use indefinite spinners without explanation.
- Do not make loading state look like completed work.

---

## 13. Automated and manual accessibility testing

### 13.1 Automated checks

Add and maintain:

- `eslint-plugin-jsx-a11y`.
- `axe-core` or equivalent automated accessibility scanning.
- Component/page accessibility tests using `jest-axe` or equivalent.
- Playwright end-to-end tests for keyboard workflows.

Build/CI must fail on critical accessibility violations.

### 13.2 Required E2E scenarios

Automate at minimum:

1. Sign in with keyboard only.
2. Create tender workspace with keyboard only.
3. Upload a document using accessible file picker.
4. Navigate Requirement Register using keyboard.
5. Search, filter, and sort requirements.
6. Open and close the requirement detail drawer; verify focus movement/restoration.
7. Resolve or assign an issue.
8. Run Final Submission Gate.
9. Request or record human approval.
10. Verify a user cannot access another organisation’s tender data.

### 13.3 Manual test matrix

Test before private beta and after meaningful UI changes:

| Test | Expected result |
|---|---|
| Keyboard-only navigation | Every action can be completed without mouse |
| Focus visibility | Focus is always visible and not obscured |
| 200% browser zoom | No lost controls or content |
| 320px reflow | Essential content/functions remain available |
| Screen reader | Key workflows make sense in NVDA + Chrome or VoiceOver + Safari |
| Contrast | Text, controls, focus, and status pass contrast checks |
| Upload | Accessible without drag/drop |
| Error recovery | Errors are announced and explain how to fix them |
| Modal/drawer | Focus is managed correctly |
| Tables | Headers, sorting, filters and result counts are understandable |
| Reduced motion | Nonessential animation is reduced/removed |

### 13.4 Recommended test tools

- Browser DevTools accessibility tree.
- axe DevTools.
- Lighthouse accessibility audit.
- NVDA with Chrome on Windows.
- VoiceOver with Safari on macOS/iOS.
- Keyboard-only test.
- Contrast checker.
- Playwright.

Automated tools find only some defects. Manual keyboard, screen-reader, zoom, and real-task testing are mandatory.

---

## 14. Demo data and test scenario

Use a fictional test tender only. Do not use confidential customer data in development or demonstrations unless explicit lawful controls and permission exist.

### 14.1 Fictional tender

**Tender title:** Facilities Management Services 2026  
**Contracting authority:** Demo Borough Council  
**Submission deadline:** 30 September 2026, 12:00 noon  

Include these planned requirements:

```text
Mandatory requirement:
The supplier must provide Public Liability Insurance of at least £10 million.

Mandatory attachment:
A valid Carbon Reduction Plan must be included with the submission.

Question TQ-01 — Method Statement
Weighting: 20%
Maximum response: 1,000 words
Explain your mobilisation plan for service commencement within 30 days.

Question TQ-02 — Social Value
Weighting: 10%
Maximum response: 750 words
Describe how you will create local employment and apprenticeship opportunities.
```

### 14.2 Planned evidence gaps

Use test evidence that deliberately creates meaningful findings:

```text
Public Liability Insurance: £5 million
Expiry date: 20 September 2026
ISO 9001 certificate: expired
Carbon Reduction Plan: not provided
```

### 14.3 Expected TGOS findings

| Check | Expected status |
|---|---|
| Public Liability Insurance | Blocked/Critical — £5m available but £10m required |
| Insurance expiry | Needs attention — expires before or too close to deadline |
| Carbon Reduction Plan | Blocked/Critical — mandatory attachment missing |
| ISO 9001 | Warning or gap — certificate expired |
| TQ-01 response | Warning — lacks detailed mobilisation timeline, named roles, risks and contingency |
| TQ-02 response | Warning — lacks measurable social-value commitments/KPIs |
| Overall decision | No-Go or Conditional Go, depending on configured rules; critical blockers must be prominent |

This scenario is required to validate that TGOS does more than display polished UI: it must find, explain, cite, and prioritise material tender risks.

---

## 15. Private beta release criteria

TGOS is ready for private beta only when all of the following are true:

### 15.1 Functional readiness

- A user can sign up/sign in and create/select an organisation.
- A user can create a Tender Workspace.
- A user can upload at least PDF, DOCX, and XLSX files where the product claims support.
- Uploaded documents are stored securely and visible only to authorised users.
- Tender documents can be classified and reviewed.
- Requirements can be extracted into a structured register.
- Requirement records show source references.
- Mandatory, pass/fail, scored, and attachment requirements can be distinguished when the source provides enough information.
- The platform identifies at least missing documents, expired evidence, insufficient coverage, and incomplete/weak response content in the fictional test scenario.
- Issues can be assigned and resolved/overridden with an audit trail.
- Final Submission Gate produces Go, Conditional Go, No-Go, or In progress status with a clear rationale.
- Human approval is required and recorded before a final readiness status is relied upon.

### 15.2 Security readiness

- Cross-organisation data access is blocked and tested.
- Backend/database authorisation is fail-closed.
- No secrets are exposed in client code or source control.
- File access is restricted by organisation/workspace permissions.
- Destructive actions require deliberate confirmation.
- Audit logs exist for key actions.

### 15.3 UX/UI readiness

- Single-level navigation is implemented.
- Main dashboard shows priority actions and tender risks clearly.
- Tender Overview, Requirement Register, Evidence, Issues, and Final Gate meet this specification.
- No duplicate navigation or cluttered multi-panel dashboard remains.
- Empty, loading, success, and error states are complete.
- Mobile layout is usable.

### 15.4 Accessibility readiness

- Applicable WCAG 2.2 A and AA criteria have been tested.
- Automated accessibility checks pass with no unresolved critical violations.
- Keyboard-only core journey passes.
- Focus, contrast, zoom/reflow, upload, dialog/drawer, table, and form tests pass.
- Accessibility statement exists with truthful known limitations.

### 15.5 Operational readiness

- Environment variables are documented.
- Error logging/monitoring is configured appropriately.
- Backup and recovery approach is understood.
- Support/feedback route exists.
- Privacy, data retention, and user-facing terms are reviewed before public release.

---

## 16. Implementation priorities

Do not attempt to build everything at once. Deliver in this order.

### Priority 1 — Make the application usable and credible

- Remove duplicate navigation.
- Implement the new app shell and design tokens.
- Refactor Dashboard, Tender Overview, Requirement Register, and Final Submission Gate.
- Establish accessible components, status system, forms, table pattern, drawer pattern, and error/loading states.
- Do not break existing data, authentication, storage, or business logic.

### Priority 2 — Make the compliance workflow real

- Tender creation.
- Document upload and classification.
- Requirement extraction with source citations.
- Requirement register.
- Evidence mapping.
- Issues/actions.
- Readiness status.

### Priority 3 — Make it safe for beta

- Organisation isolation and RLS/backend checks.
- Audit log.
- Human approval workflow.
- Automated accessibility checks.
- End-to-end happy-path tests.
- Fictional tender scenario validation.

### Priority 4 — Ecosystem integrations

- DCOS approved-evidence connection.
- Bidsmith tender-response connection.
- UKKB contextual guidance connection.
- DOCCUTE.COM SSO/control-centre summary connection.

Do not make cross-product integrations a dependency for TGOS to be useful as a standalone product.

---

## 17. Agent operating instructions

When implementing this specification, the agent must:

1. Inspect the existing repository before making assumptions.
2. Read `package.json`, existing routes, components, Supabase configuration, environment example, and current authentication/data patterns.
3. Preserve working business logic and real data flows unless explicitly asked to change them.
4. Never expose or invent credentials, secrets, API keys, or database values.
5. Implement changes in focused, reviewable increments.
6. Run the actual available lint, type-check, test, and production-build commands after changes.
7. Fix root causes rather than hiding errors with broad ignores or unsafe workarounds.
8. Keep components accessible by default.
9. Avoid unnecessary dependencies and avoid visual complexity.
10. Use real product copy from this specification rather than generic AI/SaaS placeholder language.
11. Do not claim full WCAG compliance unless testing evidence supports it.
12. Report clearly:
    - What changed.
    - What was tested.
    - What passed.
    - What remains blocked or requires human input.
    - Any security or accessibility risks found.

### 17.1 Definition of a successful implementation

A successful TGOS build is not simply a nice-looking dashboard. It is an accessible, secure, evidence-led compliance workflow where a UK bid team can:

```text
Create tender
→ upload tender pack
→ understand every requirement
→ identify missing or risky evidence
→ assign corrective actions
→ run final compliance gate
→ obtain human approval
→ export/share a readiness report
```

The interface must make this workflow feel simple, controlled, and trustworthy.

---

## 18. Final product statement

> **TGOS is the final compliance gate before tender submission.**
>
> It helps teams turn tender documents into a clear, evidence-led readiness workflow — so they can identify gaps, resolve risk and submit only after informed human review.
