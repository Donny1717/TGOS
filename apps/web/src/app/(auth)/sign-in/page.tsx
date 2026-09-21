import { signInWithPassword, signUpWithPassword } from "@/app/actions-auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams: Promise<{ error?: string; mode?: string; detail?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (isLocalAuthBypassEnabled()) {
    redirect("/dashboard");
  }

  const { error, mode, detail } = await searchParams;
  const isSignUp = mode === "signup";
  const detailText = detail ? decodeURIComponent(detail) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">TGOS — Tender Gate OS</p>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">{isSignUp ? "Create account" : "Sign in"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Real data on your Supabase project. Set <code className="rounded bg-slate-100 px-1">DISABLE_AUTH=false</code> in
          .env and restart the app.
        </p>

        {(error || detailText) && (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
            {detailText ??
              (error === "credentials"
                ? "Email or password is incorrect."
                : error === "signup"
                  ? "Could not create the account."
                  : "Sign-in failed.")}
          </p>
        )}

        <form action={isSignUp ? signUpWithPassword : signInWithPassword} className="mt-8 space-y-5">
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
          <label className="block text-sm font-medium">
            Password (at least 6 characters)
            <input
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <button className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">
            {isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isSignUp ? (
            <>
              Already registered?{" "}
              <Link href="/sign-in" className="font-semibold text-blue-700">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href="/sign-in?mode=signup" className="font-semibold text-blue-700">
                Create account
              </Link>
            </>
          )}
        </p>
      </section>
    </main>
  );
}
