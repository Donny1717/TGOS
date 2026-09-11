import Link from "next/link";
import { signOut } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  if (isLocalAuthBypassEnabled()) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] text-slate-950">
        <header className="border-b border-slate-200/80 bg-white">
          <div className="flex items-center justify-between px-5 py-4 lg:px-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold tracking-[0.15em] text-slate-900">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-xs text-cyan-300">T</span>TENDER.GATE.OS
            </Link>
            <div className="flex items-center gap-4">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">Local preview</span>
              <Link href="/" className="text-xs font-medium text-slate-700 hover:text-slate-900">Exit preview</Link>
            </div>
          </div>
        </header>
        <div className="flex">
          <aside className="hidden min-h-[calc(100vh-65px)] w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Workspace</p>
            <nav className="space-y-1" aria-label="Workspace">
              <Link href="/dashboard/demo" className="block rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-900">Overview</Link>
              <Link href="/dashboard/demo/tenders" className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Tender workspaces</Link>
              <Link href="/dashboard/demo/passport" className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Company Passport</Link>
            </nav>
            <div className="mt-10 rounded-xl border border-cyan-200 bg-cyan-50 p-3">
              <p className="text-xs font-semibold text-slate-800">Demo organisation</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-600">Preview data only. Nothing is saved.</p>
            </div>
          </aside>
          <main id="main-content" className="min-w-0 flex-1 px-5 py-8 lg:px-10">{children}</main>
        </div>
      </div>
    );
  }

  const { supabase, user } = await requireUser();
  const { data: memberships } = await supabase
    .from("organisation_members")
    .select("organisation_id, role, organisations(id, name)")
    .eq("user_id", user.id)
    .order("created_at");

  const organisations = (memberships ?? []).flatMap((membership) => {
    const organisation = membership.organisations as unknown as { id: string; name: string } | null;
    return organisation ? [{ ...organisation, role: membership.role }] : [];
  });

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold tracking-[0.15em] text-slate-900">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-xs text-cyan-300">T</span>TENDER.GATE.OS
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/onboarding" className="text-sm font-medium text-blue-800 hover:text-blue-950">
              New organisation
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 md:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Organisations</p>
          <nav className="space-y-1" aria-label="Organisations">
            {organisations.map((organisation) => (
              <Link
                key={organisation.id}
                href={`/dashboard/${organisation.id}`}
                className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100"
              >
                {organisation.name}
                <span className="ml-2 text-xs capitalize text-slate-600">{organisation.role}</span>
              </Link>
            ))}
            {organisations.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-600">Create an organisation to begin.</p>
            )}
          </nav>
        </aside>
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
