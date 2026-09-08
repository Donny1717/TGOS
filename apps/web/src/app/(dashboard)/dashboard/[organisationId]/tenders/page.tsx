import Link from "next/link";
import { createTender } from "@/app/actions";
import { requireOrganisationMembership } from "@/lib/auth";

type TendersPageProps = {
  params: Promise<{ organisationId: string }>;
};

type Tender = {
  id: string;
  title: string;
  buyer_name: string;
  reference: string | null;
  status: string;
  submission_deadline: string | null;
};

function formatDeadline(value: string | null) {
  if (!value) return "No submission deadline";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export default async function TendersPage({ params }: TendersPageProps) {
  const { organisationId } = await params;
  const { membership, supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: organisation }, { data: tenders, error }] = await Promise.all([
    supabase.from("organisations").select("name").eq("id", organisationId).single(),
    supabase
      .from("tenders")
      .select("id, title, buyer_name, reference, status, submission_deadline")
      .eq("organisation_id", organisationId)
      .order("submission_deadline", { ascending: true, nullsFirst: false }),
  ]);

  if (error) throw new Error("Tender workspaces could not be loaded.");

  const canCreate = membership.role !== "viewer";
  const saveTender = createTender.bind(null, organisationId);

  return (
    <section className="space-y-6">
      <div>
        <Link href={`/dashboard/${organisationId}`} className="text-sm font-medium text-blue-700 hover:text-blue-900">
          ← {organisation?.name}
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Tender workspaces</h1>
        <p className="mt-2 text-slate-600">
          Keep tender metadata, deadlines, owners and source records together. Dates are stored in UTC and shown in Europe/London.
        </p>
      </div>

      {canCreate && (
        <form action={saveTender} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Create a tender workspace</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">
              Tender title
              <input name="title" required minLength={2} maxLength={200} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">
              Buyer
              <input name="buyerName" required minLength={2} maxLength={200} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">
              Reference
              <input name="reference" maxLength={120} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">
              Submission deadline (Europe/London)
              <input name="submissionDeadline" type="datetime-local" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">
              Contract start date
              <input name="contractStartDate" type="date" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium">
              Notice URL
              <input name="noticeUrl" type="url" placeholder="https://" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium md:col-span-2">
              Description
              <textarea name="description" rows={3} maxLength={10000} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <button className="mt-5 rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">
            Create tender workspace
          </button>
        </form>
      )}

      <div className="space-y-3">
        {(tenders as Tender[] | null)?.map((tender) => (
          <Link
            key={tender.id}
            href={`/dashboard/${organisationId}/tenders/${tender.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{tender.title}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {tender.buyer_name}
                  {tender.reference ? ` · ${tender.reference}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                {tender.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-600">{formatDeadline(tender.submission_deadline)}</p>
          </Link>
        ))}
        {(tenders ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No tender workspaces yet.
          </p>
        )}
      </div>
    </section>
  );
}
