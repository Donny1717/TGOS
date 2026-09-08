import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-slate-900">
            TENDER.GATE.OS
          </Link>
          <Link href="/onboarding" className="text-sm font-medium text-blue-700 hover:text-blue-900">
            New organisation
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Organisations</p>
          <nav className="space-y-1" aria-label="Organisations">
            {organisations.map((organisation) => (
              <Link
                key={organisation.id}
                href={`/dashboard/${organisation.id}`}
                className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100"
              >
                {organisation.name}
                <span className="ml-2 text-xs capitalize text-slate-500">{organisation.role}</span>
              </Link>
            ))}
            {organisations.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-500">Create an organisation to begin.</p>
            )}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
