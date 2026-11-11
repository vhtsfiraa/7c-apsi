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

export default async function CashierNotificationsPage() {
  const cashier = await requireRole("Kasir");
  const notifications = await getPrismaClient().transaksi.findMany({
    where: {
      AND: [
        laundryTransactionFilter,
        { Waktu_Notifikasi_Selesai: { not: null } },
      ],
    },
    orderBy: { Waktu_Notifikasi_Selesai: "desc" },
    take: 100,
    select: {
      Kode_Transaksi: true,
      Waktu_Notifikasi_Selesai: true,
      member: { select: { ID_Member: true, Nama_Member: true } },
      Catatan_Pakaian: true,
    },
  });

  return (
    <DashboardShell
      heading="Notifikasi Laundry"
      identity={`${cashier.name} · Kasir`}
      activeHref="/kasir/notifikasi"
      role="Kasir"
    >
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Notifikasi Status Selesai</h2>
        <ul className="divide-y divide-[#e2e8f0]">
          {notifications.map((notification) => (
            <li className="py-3 text-sm" key={notification.Kode_Transaksi}>
              <p>
                Laundry {notification.Kode_Transaksi} selesai; notifikasi tercatat.
              </p>
              <p className="mt-1 text-xs text-[#64748b]">
                {notification.member.ID_Member} · {notification.member.Nama_Member} ·{" "}
                {notification.Waktu_Notifikasi_Selesai?.toLocaleString("id-ID")}
              </p>
              {notification.Catatan_Pakaian && (
                <p className="mt-1 text-xs text-[#64748b]">
                  {notification.Catatan_Pakaian}
                </p>
              )}
            </li>
          ))}
          {!notifications.length && (
            <li className="py-4 text-sm text-[#64748b]">
              Belum ada notifikasi status laundry.
            </li>
          )}
        </ul>
        <p className="mt-4 text-xs text-[#64748b]">
          Informasi status baca tidak tersedia pada ERD.
        </p>
      </section>
    </DashboardShell>
  );
}
