import { AppShell } from "@/components/app-shell";
import { signOut } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

type OrgLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ organisationId: string }>;
};

export default async function OrganisationLayout({ children, params }: OrgLayoutProps) {
  const { organisationId } = await params;

  if (isLocalAuthBypassEnabled() && organisationId === "demo") {
    return (
      <AppShell
        organisations={[{ id: "demo", name: "Demo organisation", role: "owner" }]}
        activeOrganisationId="demo"
        activeOrganisationName="Demo organisation"
        userLabel="Local preview"
        previewMode
        topContext="Priority workspace"
      >
        {children}
      </AppShell>
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
    return organisation ? [{ ...organisation, role: membership.role as string }] : [];
  });

  const active = organisations.find((organisation) => organisation.id === organisationId) ?? organisations[0];

  return (
    <AppShell
      organisations={organisations.length ? organisations : [{ id: organisationId, name: "Organisation" }]}
      activeOrganisationId={active?.id ?? organisationId}
      activeOrganisationName={active?.name ?? "Organisation"}
      userLabel={user.email ?? "Signed in"}
      signOutAction={signOut}
      topContext="Priority workspace"
    >
      {children}
    </AppShell>
  );
}
