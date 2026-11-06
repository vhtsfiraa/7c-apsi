import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { CoinManagementForm } from "@/app/kasir/coin-management-form";

export const instant = false;

export default async function KasirCoinManagementPage() {
  const cashier = await requireRole("Kasir");
  const members = await getPrismaClient().users.findMany({
    where: { role: { equals: "Member", mode: "insensitive" } },
    orderBy: { nama: "asc" },
    select: { id_user: true, nama: true, koin_saldo: true },
  });

  return (
    <DashboardShell
      heading="Kelola Koin Member"
      identity={`${cashier.name} · Kasir`}
      activeHref="/kasir/koin"
      role="Kasir"
    >
      <CoinManagementForm members={members} />
    </DashboardShell>
  );
}
