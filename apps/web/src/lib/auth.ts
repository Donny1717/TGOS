import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const organisationRoles = ["owner", "admin", "member", "viewer"] as const;
export type OrganisationRole = (typeof organisationRoles)[number];

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return { supabase, user };
}

export async function requireOrganisationMembership(
  organisationId: string,
  permittedRoles: readonly OrganisationRole[] = organisationRoles,
) {
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

  return { membership, supabase, user };
}
