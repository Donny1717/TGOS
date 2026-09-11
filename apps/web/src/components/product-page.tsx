import Link from "next/link";

type ProductPageProps = {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  capabilities: string[];
  accent: string;
};

export function ProductPage({ code, eyebrow, title, description, capabilities, accent }: ProductPageProps) {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3 text-sm font-bold tracking-[0.22em]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300 text-[#07111f]">D</span>DOC<span className="text-cyan-300">C</span>UTE</Link>
        <nav className="flex items-center gap-5 text-sm text-slate-300"><Link href="/" className="hidden hover:text-white sm:block">Product hub</Link><Link href="/dashboard" className="rounded-full bg-cyan-300 px-4 py-2 font-semibold text-[#07111f] hover:bg-cyan-200">Open workspace</Link></nav>
      </header>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className={`pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full ${accent} opacity-20 blur-3xl`} />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-28">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
          <div className="mt-7 max-w-4xl"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-black tracking-[0.18em] text-white">{code}</span><h1 className="mt-7 text-5xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl lg:text-7xl">{title}</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">{description}</p></div>
          <div className="mt-9 flex flex-wrap gap-4"><Link href="/dashboard" className="rounded-full bg-cyan-300 px-6 py-3.5 text-sm font-bold text-[#07111f] hover:bg-cyan-200">Open {code} workspace <span className="ml-2">→</span></Link><Link href="/" className="rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold hover:border-cyan-300/60">Back to Doccute</Link></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">What it brings together</p><div className="mt-10 grid gap-5 md:grid-cols-3">{capabilities.map((capability, index) => <article key={capability} className="rounded-2xl border border-white/10 bg-white/[0.035] p-7"><p className="text-sm font-bold text-cyan-300">0{index + 1}</p><h2 className="mt-12 text-xl font-semibold leading-snug">{capability}</h2></article>)}</div></section>
      <section className="border-t border-white/10 bg-[#0b192a] px-6 py-16 text-center lg:px-10"><h2 className="text-3xl font-semibold">A clearer way to work with important documents.</h2><Link href="/dashboard" className="mt-7 inline-flex rounded-full bg-cyan-300 px-6 py-3 text-sm font-bold text-[#07111f] hover:bg-cyan-200">Preview the workspace</Link></section>
    </main>
  );
}
