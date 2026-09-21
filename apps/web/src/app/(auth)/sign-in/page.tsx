import { requestSignInLink } from "@/app/actions";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (isLocalAuthBypassEnabled()) {
    redirect("/dashboard");
  }

  const { error, sent } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">TGOS — Tender Gate OS</p>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Login is optional during product development. For local UI work set{" "}
          <code className="rounded bg-slate-100 px-1">DISABLE_AUTH=true</code> in root{" "}
          <code className="rounded bg-slate-100 px-1">.env</code> and open{" "}
          <Link href="/dashboard" className="font-semibold text-blue-700">
            /dashboard
          </Link>
          . Google sign-in will be added later.
        </p>
        {sent && (
          <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Check your email for the sign-in link.</p>
        )}
        {error === "callback" && (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            That sign-in link is invalid or has expired. Request a new link and try again.
          </p>
        )}
        <form action={requestSignInLink} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">
            Work email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <button className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">
            Send sign-in link
          </button>
        </form>
      </section>
    </main>
  );
}
