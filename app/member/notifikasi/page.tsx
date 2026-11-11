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

export default async function MemberNotificationsPage() {
  const member = await requireRole("Member");
  const prisma = getPrismaClient();
  const [profile, notifications] = await Promise.all([
    prisma.member.findUnique({
      where: { ID_Member: member.userId },
      select: { ID_Member: true, Nama_Member: true },
    }),
    prisma.transaksi.findMany({
      where: {
        AND: [
          { ID_Member: member.userId },
          laundryTransactionFilter,
          { Waktu_Notifikasi_Selesai: { not: null } },
        ],
      },
      orderBy: { Waktu_Notifikasi_Selesai: "desc" },
      select: {
        Kode_Transaksi: true,
        Catatan_Pakaian: true,
        Waktu_Notifikasi_Selesai: true,
      },
    }),
  ]);
  if (!profile) throw new Error("Data Member pada sesi tidak ditemukan.");

  return (
    <DashboardShell
      heading="Notifikasi Status Pakaian"
      identity={`${profile.Nama_Member} · ${profile.ID_Member}`}
      activeHref="/member/notifikasi"
      role="Member"
    >
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Notifikasi Terbaru</h2>
        {notifications.length ? (
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li
                className="rounded-lg bg-[#f4f7fb] px-4 py-3"
                key={notification.Kode_Transaksi}
              >
                <p className="text-sm font-medium">
                  Laundry selesai dan notifikasi telah dicatat.
                </p>
                <p className="mt-1 text-xs text-[#64748b]">
                  {notification.Kode_Transaksi} ·{" "}
                  {notification.Waktu_Notifikasi_Selesai?.toLocaleString("id-ID")}
                </p>
                {notification.Catatan_Pakaian && (
                  <p className="mt-1 text-xs text-[#64748b]">
                    {notification.Catatan_Pakaian}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#64748b]">Belum ada notifikasi laundry.</p>
        )}
        <p className="mt-4 text-xs text-[#64748b]">
          Status sudah dibaca tidak tersedia karena ERD tidak menyimpan informasi baca.
        </p>
      </section>
    </DashboardShell>
  );
}
