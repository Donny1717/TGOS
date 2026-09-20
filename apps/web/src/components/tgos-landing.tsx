import Link from "next/link";

export function TgosLanding() {
  return (
    <main id="main" className="min-h-screen bg-[var(--tgos-background)] text-[var(--tgos-text)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--tgos-navy)] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 border-b border-[var(--tgos-border)] bg-[color-mix(in_srgb,var(--tgos-background)_92%,white)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--tgos-navy)]">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--tgos-primary)] text-xs font-bold text-white">
              TG
            </span>
            <span>TGOS — Tender Gate OS</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-[var(--tgos-muted)] md:flex" aria-label="Primary">
            <a href="#problem" className="hover:text-[var(--tgos-text)]">The problem</a>
            <a href="#how" className="hover:text-[var(--tgos-text)]">How it works</a>
            <a href="#outcomes" className="hover:text-[var(--tgos-text)]">Outcomes</a>
            <a href="#trust" className="hover:text-[var(--tgos-text)]">Trust</a>
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--tgos-primary-hover)]"
          >
            Start a tender readiness check
          </Link>
        </div>
      </header>

      <div id="main-content">
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-[var(--tgos-info-bg)] px-3 py-1 text-sm font-semibold text-[var(--tgos-info)]">
              UK tender compliance gate
            </p>
            <h1 className="max-w-[18ch] text-4xl font-semibold tracking-tight text-[var(--tgos-navy)] sm:text-[2.25rem]">
              Know what is missing before you submit.
            </h1>
            <p className="mt-4 max-w-xl text-[1.0625rem] leading-7 text-[var(--tgos-muted)]">
              TGOS turns complex tender documents into a clear, evidence-led readiness workflow — helping UK suppliers
              identify requirements, resolve gaps and complete a final human-approved compliance check before submission.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--tgos-primary-hover)]"
              >
                Start a tender readiness check
              </Link>
              <a
                href="#how"
                className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border-strong)] bg-white px-4 text-sm font-semibold text-[var(--tgos-text)]"
              >
                See how TGOS works
              </a>
            </div>
            <p className="mt-4 text-sm text-[var(--tgos-subtle)]">
              For UK suppliers, bid teams, tender consultants, and compliance teams.
            </p>
          </div>

          <aside className="overflow-hidden rounded-[10px] border border-[var(--tgos-border)] bg-white shadow-[0_8px_24px_rgba(11,31,58,0.06)]" aria-label="Final submission gate preview">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--tgos-border)] bg-[var(--tgos-surface-subtle)] px-4 py-3 text-sm text-[var(--tgos-muted)]">
              <span>Final Submission Gate</span>
              <span className="rounded-full bg-[var(--tgos-critical-bg)] px-2.5 py-1 text-xs font-bold text-[var(--tgos-critical)]">
                Decision: No-Go
              </span>
            </div>
            <ul className="divide-y divide-[var(--tgos-border)] px-4">
              {[
                ["Public Liability Insurance", "£5m available · £10m required · Insurance.pdf p.2", "Blocked", "critical"],
                ["Carbon Reduction Plan", "Mandatory attachment not found in tender pack", "Blocked", "critical"],
                ["ISO 9001 certificate", "Expired evidence · needs replacement", "Needs attention", "warning"],
                ["TQ-01 Method statement", "Human review required — mobilisation detail incomplete", "Human review required", "review"],
              ].map(([title, meta, label, tone]) => (
                <li key={title} className="flex items-start justify-between gap-3 py-3.5">
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-0.5 text-xs text-[var(--tgos-subtle)]">{meta}</p>
                  </div>
                  <span
                    className={
                      tone === "critical"
                        ? "rounded-full bg-[var(--tgos-critical-bg)] px-2.5 py-1 text-xs font-bold text-[var(--tgos-critical)]"
                        : tone === "warning"
                          ? "rounded-full bg-[var(--tgos-warning-bg)] px-2.5 py-1 text-xs font-bold text-[var(--tgos-warning)]"
                          : "rounded-full bg-[var(--tgos-info-bg)] px-2.5 py-1 text-xs font-bold text-[var(--tgos-info)]"
                    }
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section id="problem" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.04em] text-[var(--tgos-primary)]">The tender problem</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">Missed mandatory items. Scattered evidence. Rushed submission.</h2>
          <p className="mt-3 max-w-2xl text-[var(--tgos-muted)]">
            Bid teams lose hours chasing documents and still risk a disqualifying gap. AI writing tools make text faster — they do not prove the pack is submission-ready.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Missed mandatory items", "Pass/fail conditions, attachments, and word limits hide across ITT packs and clarifications."],
              ["Scattered evidence", "Insurance, policies, certificates and CRP files live in inboxes, shared drives, and last year’s folder."],
              ["Rushed submission", "Deadline pressure turns incomplete packs into late discoveries — when there is no time left to fix them."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
                <h3 className="text-lg font-semibold text-[var(--tgos-navy)]">{title}</h3>
                <p className="mt-2 text-sm text-[var(--tgos-muted)]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.04em] text-[var(--tgos-primary)]">How TGOS works</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">Upload. Decode. Resolve. Approve.</h2>
          <p className="mt-3 max-w-2xl text-[var(--tgos-muted)]">A controlled compliance workflow from tender pack to human-approved readiness decision.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Upload", "Create a tender workspace and upload the pack. Classify documents and keep originals under control."],
              ["02", "Decode", "Extract requirements into a register with source citations, types, weightings and limits where found."],
              ["03", "Resolve", "Match evidence, flag gaps and expiry risk, then assign owners to clear blockers first."],
              ["04", "Approve", "Run the Final Submission Gate and record a named human decision before anyone submits."],
            ].map(([num, title, text]) => (
              <article key={num} className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
                <p className="font-mono text-xs font-bold text-[var(--tgos-primary)]">{num}</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--tgos-navy)]">{title}</h3>
                <p className="mt-2 text-sm text-[var(--tgos-muted)]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="outcomes" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.04em] text-[var(--tgos-primary)]">Key outcomes</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">What your team can see at a glance</h2>
          <p className="mt-3 max-w-2xl text-[var(--tgos-muted)]">
            Every screen should answer: what is at risk, what next, who owns it, and is the tender ready to submit?
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              ["Requirements", "A searchable register of mandatory, pass/fail, scored and attachment obligations with source quotes."],
              ["Evidence", "Matched, partial, missing, expired or unapproved documents linked to the requirements they support."],
              ["Issues", "Prioritised corrective actions with severity, owner, due date, citation and recommended next step."],
              ["Final gate", "Go / Conditional Go / No-Go / In progress — with blockers first and an auditable human approval."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
                <h3 className="text-lg font-semibold text-[var(--tgos-navy)]">{title}</h3>
                <p className="mt-2 text-sm text-[var(--tgos-muted)]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="capabilities" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.04em] text-[var(--tgos-primary)]">Product capability overview</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">Built as a compliance gatekeeper</h2>
          <p className="mt-3 max-w-2xl text-[var(--tgos-muted)]">
            TGOS is not primarily a bid-writing tool, document repository, legal-advice service, or buyer-portal submitter. It owns the readiness gate.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
              <h3 className="text-lg font-semibold text-[var(--tgos-navy)]">What TGOS may do</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--tgos-text)]">
                <li>Extract and structure tender requirements</li>
                <li>Identify potential gaps, conflicts and risks</li>
                <li>Match requirements to evidence</li>
                <li>Support review, approval and readiness reporting</li>
                <li>Provide AI-assisted analysis with document citations</li>
              </ul>
            </article>
            <article className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
              <h3 className="text-lg font-semibold text-[var(--tgos-navy)]">What TGOS must not do</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--tgos-text)]">
                <li>Promise legal compliance or a winning bid</li>
                <li>Invent requirements, deadlines, evidence or citations</li>
                <li>Present AI interpretation as legal advice</li>
                <li>Mark a tender safe to submit without named human approval</li>
              </ul>
            </article>
            <article className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
              <h3 className="text-lg font-semibold text-[var(--tgos-navy)]">Ecosystem position</h3>
              <p className="mt-3 text-sm text-[var(--tgos-muted)]">
                Independent specialist within the DOCCUTE Tender Ecosystem — receiving evidence and draft responses when sharing is permitted, and returning readiness status to the control core.
              </p>
            </article>
          </div>
        </section>

        <section id="trust" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="rounded-xl bg-[var(--tgos-navy)] px-6 py-8 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.04em] text-blue-200">Trust and safeguards</p>
            <h2 className="mt-2 text-2xl font-semibold">Evidence-led by design</h2>
            <p className="mt-3 max-w-3xl text-white/80">
              AI findings must show sources, uncertainty and a clear path to human review. Export and readiness decisions stay under organisational control.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Source citations", "Document name, page/section, extracted quote, related requirement ID, and confidence/uncertainty where available."],
                ["Permissions and audit trail", "Organisation isolation, role-based access, and auditable events for uploads, matches, issues, risk acceptance and approvals."],
                ["Human review", "AI-assisted analysis. Human review and approval are required before tender submission."],
                ["Accessibility and security", "Designed to meet WCAG 2.2 AA. Backend authorisation is fail-closed. Secrets never ship in the client."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-[10px] border border-white/15 bg-white/5 p-4">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-white/75">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.04em] text-[var(--tgos-primary)]">Accessibility and security summary</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--tgos-navy)]">Calm, usable, accountable</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
              <h3 className="text-lg font-semibold text-[var(--tgos-navy)]">Accessibility</h3>
              <p className="mt-2 text-sm text-[var(--tgos-muted)]">
                Semantic structure, keyboard access, visible focus, contrast-safe status labels, accessible uploads, dialogs and data tables. Accessibility is a release requirement, not a later enhancement.
              </p>
            </article>
            <article className="rounded-[10px] border border-[var(--tgos-border)] bg-white p-5">
              <h3 className="text-lg font-semibold text-[var(--tgos-navy)]">Security</h3>
              <p className="mt-2 text-sm text-[var(--tgos-muted)]">
                Organisation-isolated data, server-side authorisation, restricted file access, validated uploads, and audit logging for privileged actions.
              </p>
            </article>
          </div>
          <div className="mt-4 rounded-[10px] border border-[var(--tgos-border)] bg-white p-4 text-sm text-[var(--tgos-muted)]" role="note">
            <strong className="text-[var(--tgos-text)]">Mandatory disclaimer:</strong>{" "}
            AI-assisted analysis. Human review and approval are required before tender submission. TGOS does not provide legal advice and does not guarantee compliance or award outcomes.
          </div>
        </section>

        <section id="cta" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-xl border border-[var(--tgos-border)] bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(11,31,58,0.06)]">
            <h2 className="text-2xl font-semibold text-[var(--tgos-navy)]">Start a tender readiness check</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--tgos-muted)]">
              Create a workspace, upload the pack, and see blockers before the deadline — with a Final Submission Gate that still requires a named human decision.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--tgos-navy)] px-4 text-sm font-semibold text-white"
              >
                Start a tender readiness check
              </Link>
              <a
                href="#how"
                className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--tgos-border-strong)] bg-white px-4 text-sm font-semibold"
              >
                See how TGOS works
              </a>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-[var(--tgos-border)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-[var(--tgos-subtle)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>TGOS — Tender Gate OS · Honey-B2024 Ltd, London</p>
          <p>
            <a href="#trust" className="hover:text-[var(--tgos-muted)]">Trust</a>
            {" · "}
            <Link href="/sign-in" className="hover:text-[var(--tgos-muted)]">Sign in</Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
