import { requireUser } from "@/lib/auth";
import { isLocalAuthBypassEnabled } from "@/lib/dev-auth";

export default async function DashboardGroupLayout({ children }: LayoutProps<"/">) {
  if (!isLocalAuthBypassEnabled()) {
    await requireUser();
  }
  return children;
}
