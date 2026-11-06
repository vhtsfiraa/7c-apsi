import { DashboardShell } from "@/app/components/dashboard-shell";
import { MemberForm } from "@/app/components/member-form";
import { requireRole } from "@/app/lib/auth";

export const instant = false;

export default async function AddMemberPage() {
  const cashier = await requireRole("Kasir");
  return (
    <DashboardShell
      heading="Registrasi Member"
      identity={`${cashier.name} · Kasir`}
      activeHref="/kasir/member"
      role="Kasir"
    >
      <MemberForm />
    </DashboardShell>
  );
}
