import Link from "next/link";
import { createOrganisation } from "@/app/actions";
import { requireUser } from "@/lib/auth";

export default async function OnboardingPage() {
  await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
          TENDER.GATE.OS
        </Link>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">Create an organisation</h1>
        <p className="mt-2 text-sm text-slate-600">Your account will become its owner.</p>
        <form action={createOrganisation} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">
            Organisation name
            <input name="name" required minLength={2} maxLength={120} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm font-medium">
            Workspace slug
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Use lowercase letters, numbers and hyphens."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <button className="w-full rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">
            Create organisation
          </button>
        </form>
      </section>
    </main>
  );
}
