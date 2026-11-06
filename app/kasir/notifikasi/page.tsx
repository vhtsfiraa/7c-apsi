import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function CashierNotificationsPage() {
  const cashier = await requireRole("Kasir");
  const notifications = await getPrismaClient().notifikasi.findMany({
    orderBy: { dibuat_pada: "desc" },
    take: 100,
    include: {
      users: { select: { nama: true, id_user: true } },
      transaksi: { select: { id_transaksi: true, nama_barang: true } },
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
            <li className="py-3 text-sm" key={notification.id_notifikasi}>
              <p>{notification.pesan}</p>
              <p className="mt-1 text-xs text-[#64748b]">
                MBR-{String(notification.users.id_user).padStart(3, "0")} ·{" "}
                {notification.users.nama} · TRX-
                {String(notification.transaksi.id_transaksi).padStart(6, "0")} ·{" "}
                {notification.dibuat_pada.toLocaleString("id-ID")}
              </p>
            </li>
          ))}
          {!notifications.length && (
            <li className="py-4 text-sm text-[#64748b]">
              Belum ada notifikasi status laundry.
            </li>
          )}
        </ul>
      </section>
    </DashboardShell>
  );
}
