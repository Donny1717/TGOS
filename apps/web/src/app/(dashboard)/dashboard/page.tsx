import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { DEMO_ORG_ID, isLocalAuthBypassEnabled } from "@/lib/dev-auth";

export default async function DashboardPage() {
  if (isLocalAuthBypassEnabled()) {
    redirect(`/dashboard/${DEMO_ORG_ID}`);
  }

  const { supabase, user } = await requireUser();
  const { data: membership } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  redirect(membership ? `/dashboard/${membership.organisation_id}` : "/onboarding");
}
