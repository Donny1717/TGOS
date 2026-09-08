import Link from "next/link";
import { requireOrganisationMembership } from "@/lib/auth";

type DashboardPageProps = {
  params: Promise<{ organisationId: string }>;
};

export default async function OrganisationDashboardPage({ params }: DashboardPageProps) {
  const { organisationId } = await params;
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
