import Link from "next/link";

const products = [
  {
    code: "TGOS",
    title: "Tender and document verification",
    text: "Turn every requirement into a traceable, review-ready answer. TGOS gives bid teams one clear view of evidence, ownership and risk.",
    href: "/tgos",
    accent: "bg-cyan-300 text-[#07111f]",
  },
  {
    code: "DCOS",
    title: "Real document control and intelligence",
    text: "Make the right document easy to find, trust and act on. DCOS brings your organisation’s knowledge into a living, governed repository.",
    href: "/dcos",
    accent: "bg-violet-300 text-[#120d24]",
  },
  {
    code: "UKKB",
    title: "UK public procurement requirements",
    text: "Navigate the rules with confidence. UKKB organises the requirements, guidance and context behind public-sector procurement.",
    href: "/ukkb",
    accent: "bg-amber-300 text-[#211707]",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3 text-sm font-bold tracking-[0.22em]">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300 text-sm text-[#07111f]">D</span>
          DOC<span className="text-cyan-300">C</span>UTE
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <Link href="/tgos" className="hover:text-white">TGOS</Link>
          <Link href="/dcos" className="hover:text-white">DCOS</Link>
          <Link href="/ukkb" className="hover:text-white">UKKB</Link>
          <Link href="/sign-in" className="ml-3 hover:text-white">Sign in</Link>
          <Link href="/dashboard" className="rounded-full bg-cyan-300 px-5 py-2.5 font-semibold text-[#07111f] hover:bg-cyan-200">Open workspace</Link>
        </nav>
        <Link href="/dashboard" className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold text-[#07111f] md:hidden">Preview</Link>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-28">
        <div className="doccute-pulse pointer-events-none absolute -right-32 -top-20 h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="doccute-float pointer-events-none absolute right-10 top-28 hidden h-32 w-32 rounded-full border border-cyan-300/20 lg:block" />
        <div className="doccute-reveal relative max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.17em] text-cyan-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> One domain. Clearer decisions.
          </p>
          <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
            The intelligence layer for documents that matter.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">
            Doccute connects verification, control and procurement knowledge in one calm, evidence-led product hub—so teams can move with confidence.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="rounded-full bg-cyan-300 px-6 py-3.5 text-sm font-bold text-[#07111f] shadow-lg shadow-cyan-300/10 hover:bg-cyan-200">Explore the workspace <span className="ml-2">→</span></Link>
            <Link href="#products" className="rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-white hover:border-cyan-300/60">Meet the products</Link>
          </div>
        </div>
      </section>

      <section id="products" className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">The Doccute product hub</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Three focused products. One trusted source.</h2>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {products.map((product, index) => (
              <article key={product.code} className={`doccute-reveal doccute-reveal-delay-${index + 1} group flex flex-col rounded-2xl border border-white/10 bg-[#0c1b2d] p-7 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-2xl hover:shadow-cyan-950/40`}>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-black tracking-[0.18em] ${product.accent}`}>{product.code}</span>
                <h3 className="mt-10 text-2xl font-semibold leading-tight">{product.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-7 text-slate-400">{product.text}</p>
                <Link href={product.href} className="mt-8 text-sm font-bold text-cyan-300">Explore {product.code} <span className="ml-1 transition group-hover:ml-2">→</span></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Designed for trust</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Less searching. More certainty.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {["Source-linked by design", "Built for UK procurement", "Ready for review"].map((item, index) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
                <p className="text-2xl font-semibold text-cyan-300">0{index + 1}</p>
                <p className="mt-8 text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#091729]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Platform skills</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">The capabilities behind the products.</h2>
            <p className="mt-5 text-base leading-7 text-slate-400">
              Each product is focused, but the operating skills work together across the Doccute platform.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["01", "Source ingestion", "Bring documents, notices and references into a governed workspace."],
              ["02", "Requirement mapping", "Turn complex requirements into clear, accountable work."],
              ["03", "Evidence verification", "Check answers against sources, owners and review states."],
              ["04", "Policy intelligence", "Connect decisions to current UK public-sector guidance."],
              ["05", "Audit and lineage", "Keep versions, decisions and provenance visible over time."],
              ["06", "Export readiness", "Surface unresolved gaps before a document leaves the team."],
            ].map(([number, title, text]) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-cyan-300/30">
                <p className="text-xs font-bold tracking-[0.18em] text-cyan-300">{number}</p>
                <h3 className="mt-8 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b192a] px-6 py-24 text-center lg:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Ready when you are</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">Bring your document work into focus.</h2>
        <Link href="/dashboard" className="mt-8 inline-flex rounded-full bg-cyan-300 px-7 py-3.5 text-sm font-bold text-[#07111f] hover:bg-cyan-200">Open the workspace <span className="ml-2">→</span></Link>
      </section>
      <footer className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-10"><p className="font-semibold tracking-[0.18em] text-slate-300">DOC<span className="text-cyan-300">C</span>UTE</p><p>Document intelligence for teams that care about the detail.</p><p>© 2026 Doccute</p></div></footer>
    </main>
  );
}
