import { redirect } from "next/navigation";
import { DEMO_ORG_ID, isLocalAuthBypassEnabled } from "@/lib/dev-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const organisationRoles = ["owner", "admin", "member", "viewer"] as const;
export type OrganisationRole = (typeof organisationRoles)[number];

const bypassUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "local-dev@tgos.local",
  app_metadata: {},
  user_metadata: { name: "Local preview" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

export async function requireUser() {
  if (isLocalAuthBypassEnabled()) {
    // No session required — product UI preview only.
    return { supabase: null as never, user: bypassUser as never, bypass: true as const };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return { supabase, user, bypass: false as const };
}

export async function requireOrganisationMembership(
  organisationId: string,
  permittedRoles: readonly OrganisationRole[] = organisationRoles,
) {
  if (isLocalAuthBypassEnabled()) {
    if (organisationId !== DEMO_ORG_ID) {
      redirect(`/dashboard/${DEMO_ORG_ID}`);
    }
    return {
      membership: { organisation_id: DEMO_ORG_ID, role: "owner" as OrganisationRole },
      supabase: null as never,
      user: bypassUser as never,
      bypass: true as const,
    };
  }

  const { supabase, user } = await requireUser();
  const { data: membership, error } = await supabase
    .from("organisation_members")
    .select("organisation_id, role")
    .eq("organisation_id", organisationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !membership || !permittedRoles.includes(membership.role as OrganisationRole)) {
    redirect("/dashboard");
  }

  return { membership, supabase, user, bypass: false as const };
}
