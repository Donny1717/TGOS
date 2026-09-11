import Link from "next/link";
import { requireOrganisationMembership } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

type DashboardPageProps = {
  params: Promise<{ organisationId: string }>;
};

export default async function OrganisationDashboardPage({ params }: DashboardPageProps) {
  const { organisationId } = await params;
  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Monday, 8 September 2026</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Good morning, Northstar.</h1><p className="mt-2 text-sm text-slate-500">Here’s the health of your tender pipeline.</p></div><Link href={`/dashboard/${organisationId}/tenders`} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ New tender</Link></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["08", "Active tenders", "↑ 2 this month", "text-slate-900"], ["94%", "Evidence coverage", "↑ 8% this month", "text-cyan-700"], ["03", "Needs review", "2 due this week", "text-amber-600"], ["12", "Team activity", "↑ 18% this week", "text-emerald-700"]].map(([value, label, detail, color]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className={`text-3xl font-semibold ${color}`}>{value}</p><p className="mt-2 text-sm font-medium text-slate-700">{label}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>)}</div>
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"><div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Tender health</h2><p className="mt-1 text-xs text-slate-500">Evidence coverage across active workspaces</p></div><Link href={`/dashboard/${organisationId}/tenders`} className="text-xs font-semibold text-cyan-700">View all →</Link></div><div className="mt-7 flex h-40 items-end gap-3 border-b border-slate-100 pb-0">{[48,60,55,73,68,78,88,83,94,90,96,94].map((height, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-md ${i > 8 ? "bg-cyan-500" : "bg-cyan-200"}`} style={{ height: `${height}%` }} /><span className="text-[10px] text-slate-400">{["Oct", "", "Dec", "", "Feb", "", "Apr", "", "Jun", "", "Aug", ""][i]}</span></div>)}</div></div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">Upcoming deadlines</h2><span className="text-xs text-slate-400">Next 14 days</span></div><div className="mt-5 space-y-4">{[["Civic Digital Services Framework", "12 Sep", "3 days"], ["Westshire FM Contract", "18 Sep", "9 days"], ["NHS Data Platform", "22 Sep", "13 days"]].map(([name, date, days]) => <div key={name} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700">◷</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{name}</p><p className="mt-1 text-[11px] text-slate-400">{date}</p></div><span className="text-[11px] font-medium text-slate-400">{days}</span></div>)}</div></div></div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Recent activity</h2><p className="mt-1 text-xs text-slate-500">A live view of your team’s workspace</p></div><span className="text-xs font-semibold text-slate-400">All activity →</span></div><div className="mt-5 grid gap-4 md:grid-cols-3">{[["JR", "Jamie reviewed 6 requirements", "Civic Digital Services · 24 min ago", "bg-violet-100 text-violet-700"], ["AM", "Alex added a source document", "Westshire FM Contract · 2 hrs ago", "bg-emerald-100 text-emerald-700"], ["SK", "Sam updated Company Passport", "Northstar Infrastructure · Yesterday", "bg-cyan-100 text-cyan-700"]].map(([initials, action, detail, color]) => <div key={action} className="flex gap-3 rounded-lg bg-slate-50 p-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold ${color}`}>{initials}</span><div><p className="text-xs font-semibold text-slate-700">{action}</p><p className="mt-1 text-[11px] text-slate-400">{detail}</p></div></div>)}</div></div>
      </section>
    );
  }

  const { supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: organisation }, { data: passport }, { count: tenderCount }] = await Promise.all([
    supabase.from("organisations").select("id, name, slug").eq("id", organisationId).single(),
    supabase.from("company_passports").select("id, legal_name, updated_at").eq("organisation_id", organisationId).maybeSingle(),
    supabase.from("tenders").select("id", { count: "exact", head: true }).eq("organisation_id", organisationId),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-700">Organisation dashboard</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{organisation?.name}</h1>
        <p className="mt-2 text-slate-600">
          Build controlled evidence for bids. This platform assists compliance work and does not certify submissions.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Tender workspaces</h2>
        <p className="mt-2 text-sm text-slate-600">
          {tenderCount ?? 0} workspace{tenderCount === 1 ? "" : "s"} for this organisation.
        </p>
        <Link
          href={`/dashboard/${organisationId}/tenders`}
          className="mt-5 inline-flex rounded-md border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          Open tender workspaces
        </Link>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Company Passport</h2>
        <p className="mt-2 text-sm text-slate-600">
          {passport
            ? `Last updated ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(passport.updated_at))}.`
            : "No Company Passport has been created yet."}
        </p>
        <Link
          href={`/dashboard/${organisationId}/passport`}
          className="mt-5 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          {passport ? "Manage Company Passport" : "Create Company Passport"}
        </Link>
      </div>
    </section>
  );
}
