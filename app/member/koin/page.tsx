import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function MemberCoinHistoryPage() {
  const session = await requireRole("Member");
  const [profile, history] = await Promise.all([
    getPrismaClient().users.findUnique({
      where: { id_user: session.userId },
      select: { nama: true, username: true, koin_saldo: true },
    }),
    getPrismaClient().riwayat_koin.findMany({
      where: { id_user: session.userId },
      orderBy: { dibuat_pada: "desc" },
      select: {
        id_riwayat_koin: true,
        jumlah: true,
        keterangan: true,
        dibuat_pada: true,
      },
    }),
  ]);
  if (!profile) throw new Error("Data Member pada sesi tidak ditemukan.");

  return (
    <DashboardShell
      heading="Riwayat Koin"
      identity={`${profile.nama} · ${profile.username}`}
      role="Member"
    >
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <p className="text-sm text-[#64748b]">Saldo koin saat ini</p>
        <p className="mt-1 text-2xl font-bold">{profile.koin_saldo} koin</p>
      </section>
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Aktivitas Koin</h2>
        <ul className="divide-y divide-[#e2e8f0]">
          {history.map((item) => (
            <li
              className="flex flex-wrap justify-between gap-3 py-3 text-sm"
              key={item.id_riwayat_koin}
            >
              <span>{item.keterangan}</span>
              <span className={item.jumlah > 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-600"}>
                {item.jumlah > 0 ? "+" : ""}{item.jumlah} koin
              </span>
              <time className="w-full text-xs text-[#64748b]">
                {item.dibuat_pada.toLocaleString("id-ID")}
              </time>
            </li>
          ))}
          {!history.length && (
            <li className="py-4 text-sm text-[#64748b]">Belum ada aktivitas koin.</li>
          )}
        </ul>
      </section>
    </DashboardShell>
  );
}
