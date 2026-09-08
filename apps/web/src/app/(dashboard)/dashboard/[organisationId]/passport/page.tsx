import Link from "next/link";
import { deleteCompanyPassport, saveCompanyPassport } from "@/app/actions";
import { requireOrganisationMembership } from "@/lib/auth";

type PassportPageProps = {
  params: Promise<{ organisationId: string }>;
};

type NamedItem = { name?: string };
type Contact = { email?: string | null; name?: string | null; phone?: string | null };

function namedItemsToLines(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => (typeof item === "object" && item ? (item as NamedItem).name : null))
    .filter((name): name is string => Boolean(name))
    .join("\n");
}

function moneyToInput(value: unknown) {
  if (value === null || value === undefined) return "";
  const pence = BigInt(String(value));
  return `${pence / 100n}.${String(pence % 100n).padStart(2, "0")}`;
}

export default async function CompanyPassportPage({ params }: PassportPageProps) {
  const { organisationId } = await params;
  const { membership, supabase } = await requireOrganisationMembership(organisationId);
  const [{ data: organisation }, { data: passport }] = await Promise.all([
    supabase.from("organisations").select("name").eq("id", organisationId).single(),
    supabase.from("company_passports").select("*").eq("organisation_id", organisationId).maybeSingle(),
  ]);

  const canManage = membership.role === "owner" || membership.role === "admin";
  const address = (passport?.registered_address ?? {}) as Record<string, string | null>;
  const contact = Array.isArray(passport?.contacts) ? (passport.contacts[0] as Contact | undefined) : undefined;
  const savePassport = saveCompanyPassport.bind(null, organisationId);
  const removePassport = deleteCompanyPassport.bind(null, organisationId);

  return (
    <section className="space-y-6">
      <div>
        <Link href={`/dashboard/${organisationId}`} className="text-sm font-medium text-blue-700 hover:text-blue-900">
          ← {organisation?.name}
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Company Passport</h1>
        <p className="mt-2 text-slate-600">Controlled company information reused across tender workspaces.</p>
      </div>
      {!canManage && (
        <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">
          Your {membership.role} role can view this passport but cannot change it.
        </p>
      )}
      <form action={savePassport} className="space-y-6">
        <fieldset disabled={!canManage} className="space-y-6 disabled:opacity-70">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Legal identity</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium md:col-span-2">Legal name
                <input name="legalName" required defaultValue={passport?.legal_name ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">Trading name
                <input name="tradingName" defaultValue={passport?.trading_name ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">Company number
                <input name="companyNumber" defaultValue={passport?.company_number ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium md:col-span-2">VAT number
                <input name="vatNumber" defaultValue={passport?.vat_number ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium md:col-span-2">Address line 1
                <input name="addressLine1" defaultValue={address.line1 ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium md:col-span-2">Address line 2
                <input name="addressLine2" defaultValue={address.line2 ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">Town or city
                <input name="townOrCity" defaultValue={address.townOrCity ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">Postcode
                <input name="postcode" defaultValue={address.postcode ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Financial profile</h2>
            <p className="mt-1 text-sm text-slate-600">Enter money in pounds; it is stored as integer pence.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium">Financial year end
                <input name="financialYearEnd" type="date" defaultValue={passport?.financial_year_end ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">Annual turnover (£)
                <input name="annualTurnover" inputMode="decimal" defaultValue={moneyToInput(passport?.annual_turnover_pence)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">Net assets (£)
                <input name="netAssets" inputMode="decimal" defaultValue={moneyToInput(passport?.net_assets_pence)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Policies and certifications</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">Policies
                <textarea name="policies" rows={6} defaultValue={namedItemsToLines(passport?.policies)} placeholder="One policy per line" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">Certifications
                <textarea name="certifications" rows={6} defaultValue={namedItemsToLines(passport?.certifications)} placeholder="One certification per line" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Primary contact</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium">Name
                <input name="primaryContactName" defaultValue={contact?.name ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">Email
                <input name="primaryContactEmail" type="email" defaultValue={contact?.email ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="block text-sm font-medium">Phone
                <input name="primaryContactPhone" type="tel" defaultValue={contact?.phone ?? ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
            </div>
          </section>
        </fieldset>
        {canManage && <button className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800">Save Company Passport</button>}
      </form>
      {canManage && passport && (
        <form action={removePassport}>
          <button className="text-sm font-semibold text-red-700 hover:text-red-900">Delete Company Passport</button>
        </form>
      )}
    </section>
  );
}
