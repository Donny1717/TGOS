"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-700">The page could not be loaded. You can try again or return to a safe page.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50">
            Go to home
          </a>
        </div>
      </section>
    </main>
  );
}
