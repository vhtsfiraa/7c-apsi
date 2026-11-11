import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

const laundryTransactionFilter = {
  OR: [
    { Catatan_Pakaian: null },
    {
      AND: [
        { NOT: { Catatan_Pakaian: { startsWith: "Migrasi riwayat koin:" } } },
        { NOT: { Catatan_Pakaian: { startsWith: "Penyesuaian saldo koin saat migrasi skema ERD." } } },
      ],
    },
  ],
};

export default async function LaundryStatusesPage() {
  const cashier = await requireRole("Kasir");
  const prisma = getPrismaClient();
  const [statuses, transactions] = await Promise.all([
    prisma.status.findMany({ orderBy: { Nama_Status: "asc" } }),
    prisma.transaksi.findMany({
      where: laundryTransactionFilter,
      select: {
        statusProses: {
          orderBy: { Waktu_Status: "desc" },
          take: 1,
          select: { ID_Status: true },
        },
      },
    }),
  ]);
  const counts = new Map<string, number>();
  for (const transaction of transactions) {
    const statusId = transaction.statusProses[0]?.ID_Status;
    if (statusId) counts.set(statusId, (counts.get(statusId) ?? 0) + 1);
  }

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
              key={status.ID_Status}
            >
              <span className="font-medium">{status.Nama_Status}</span>
              <span className="text-[#64748b]">
                {counts.get(status.ID_Status) ?? 0} transaksi
              </span>
            </li>
          ))}
          {!statuses.length && (
            <li className="py-4 text-sm text-[#64748b]">
              Belum ada status yang terdaftar.
            </li>
          )}
        </ul>
        <p className="mt-4 text-xs text-[#64748b]">
          Status ditampilkan dari tabel STATUS; perubahan tiap transaksi tercatat di STATUS_PROSES.
        </p>
      </section>
    </DashboardShell>
  );
}
