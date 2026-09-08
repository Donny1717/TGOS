import { requestSignInLink } from "@/app/actions";

type SignInPageProps = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, sent } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">TENDER.GATE.OS</p>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Sign in securely</h1>
        <p className="mt-2 text-sm text-slate-600">Request a one-time sign-in link to access your organisations.</p>
        {sent && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Check your email for the sign-in link.</p>}
        {error === "callback" && (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            That sign-in link is invalid or has expired. Request a new link and try again.
          </p>
        )}
        <form action={requestSignInLink} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">
            Work email
            <input name="email" type="email" autoComplete="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <button className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">Send sign-in link</button>
        </form>
      </section>
    </main>
  );
}
