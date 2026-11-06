import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { ensureLaundryStatuses } from "@/app/lib/laundry";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function LaundryStatusesPage() {
  const cashier = await requireRole("Kasir");
  const statuses = await ensureLaundryStatuses(getPrismaClient());
  const transactions = await getPrismaClient().transaksi.groupBy({
    by: ["status_id"],
    _count: { _all: true },
  });
  const counts = new Map(
    transactions.map((item) => [item.status_id, item._count._all]),
  );

  return (
    <DashboardShell
      heading="Data Status Laundry"
      identity={`${cashier.name} · Kasir`}
      activeHref="/kasir/status"
      role="Kasir"
    >
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Master Status Laundry</h2>
        <ul className="divide-y divide-[#e2e8f0]">
          {statuses.map((status) => (
            <li
              className="flex items-center justify-between gap-4 py-3 text-sm"
              key={status.id_status}
            >
              <span className="font-medium">{status.nama_status}</span>
              <span className="text-[#64748b]">
                {counts.get(status.id_status) ?? 0} transaksi
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[#64748b]">
          Status diperbarui dari daftar transaksi agar riwayat perubahan tetap tercatat.
        </p>
      </section>
    </DashboardShell>
  );
}
