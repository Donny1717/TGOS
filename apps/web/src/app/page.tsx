import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-sm font-bold tracking-[0.2em] text-cyan-300">
          TENDER.GATE.OS
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-cyan-300 hover:text-cyan-200"
        >
          Sign in
        </Link>
      </header>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Evidence-led tender control
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Keep every bid answer traceable, reviewable, and ready to export.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A controlled workspace for UK public-sector tender work. Capture requirements, connect evidence,
            preserve sources, and stop unresolved compliance gaps reaching the final submission.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/sign-in"
              className="rounded-md bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200"
            >
              Start with a secure sign-in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-700 px-5 py-3 font-semibold text-slate-100 hover:border-cyan-300"
            >
              Open workspace
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-cyan-950/30">
          <p className="text-sm font-semibold text-slate-300">Control principles</p>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
            <li className="border-l-2 border-cyan-300 pl-4">No figure enters a submission without a named source.</li>
            <li className="border-l-2 border-emerald-300 pl-4">Evidence gaps stay visible until evidenced or formally waived.</li>
            <li className="border-l-2 border-amber-300 pl-4">Original documents and audit events remain part of the record.</li>
          </ul>
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-700 pt-5 text-center">
            <div>
              <p className="text-2xl font-bold text-cyan-300">6</p>
              <p className="mt-1 text-xs text-slate-400">validated rule families</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-300">RLS</p>
              <p className="mt-1 text-xs text-slate-400">tenant isolation</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">100%</p>
              <p className="mt-1 text-xs text-slate-400">source-first intent</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
