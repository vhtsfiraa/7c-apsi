import { ApiActionButton } from "@/app/components/api-action-button";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function MemberNotificationsPage() {
  const member = await requireRole("Member");
  const notifications = await getPrismaClient().notifikasi.findMany({
    where: { id_user: member.userId },
    orderBy: { dibuat_pada: "desc" },
    include: {
      transaksi: { select: { id_transaksi: true, nama_barang: true } },
    },
  });

  return (
    <DashboardShell
      heading="Notifikasi Status Pakaian"
      identity={`${member.name} · ${member.username}`}
      activeHref="/member/notifikasi"
      role="Member"
    >
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Notifikasi Terbaru</h2>
        {notifications.length ? (
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li
                className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-[#f4f7fb] px-4 py-3"
                key={notification.id_notifikasi}
              >
                <div>
                  <p className="text-sm font-medium">{notification.pesan}</p>
                  <p className="mt-1 text-xs text-[#64748b]">
                    TRX-{String(notification.transaksi.id_transaksi).padStart(6, "0")} ·{" "}
                    {notification.dibuat_pada.toLocaleString("id-ID")}
                  </p>
                  <p className="mt-1 text-xs text-[#64748b]">
                    {notification.dibaca_pada ? "Sudah dibaca" : "Belum dibaca"}
                  </p>
                </div>
                {!notification.dibaca_pada && (
                  <ApiActionButton
                    body={{ id_notifikasi: notification.id_notifikasi }}
                    endpoint="/api/notifikasi"
                    label="Tandai Dibaca"
                    method="PATCH"
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#64748b]">Belum ada notifikasi laundry.</p>
        )}
      </section>
    </DashboardShell>
  );
}
