import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-700">That address does not match a page in this workspace.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
            Go to home
          </Link>
          <Link href="/dashboard" className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">
            Open workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
