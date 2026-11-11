import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function MemberCoinHistoryPage() {
  const session = await requireRole("Member");
  const prisma = getPrismaClient();
  const [profile, transactions] = await Promise.all([
    prisma.member.findUnique({
      where: { ID_Member: session.userId },
      select: { ID_Member: true, Nama_Member: true },
    }),
    prisma.transaksi.findMany({
      where: { ID_Member: session.userId },
      orderBy: { Tgl_Jam_Transaksi: "desc" },
      select: {
        Kode_Transaksi: true,
        Tgl_Jam_Transaksi: true,
        Koin_Didapat: true,
        Koin_Ditukar: true,
        Catatan_Pakaian: true,
      },
    }),
  ]);
  if (!profile) throw new Error("Data Member pada sesi tidak ditemukan.");
  const balance = transactions.reduce(
    (total, transaction) =>
      total + (transaction.Koin_Didapat ?? 0) - (transaction.Koin_Ditukar ?? 0),
    0,
  );
  const history = transactions.flatMap((transaction) => [
    ...(transaction.Koin_Didapat
      ? [{
          key: `${transaction.Kode_Transaksi}-earned`,
          amount: transaction.Koin_Didapat,
          label: transaction.Catatan_Pakaian?.startsWith("Migrasi riwayat koin:")
            ? transaction.Catatan_Pakaian
            : transaction.Catatan_Pakaian?.startsWith("Penyesuaian saldo koin saat migrasi skema ERD.")
              ? transaction.Catatan_Pakaian
              : "Koin diperoleh",
          transaction,
        }]
      : []),
    ...(transaction.Koin_Ditukar
      ? [{
          key: `${transaction.Kode_Transaksi}-redeemed`,
          amount: -transaction.Koin_Ditukar,
          label: transaction.Catatan_Pakaian?.startsWith("Migrasi riwayat koin:")
            ? transaction.Catatan_Pakaian
            : transaction.Catatan_Pakaian?.startsWith("Penyesuaian saldo koin saat migrasi skema ERD.")
              ? transaction.Catatan_Pakaian
              : "Koin ditukarkan",
          transaction,
        }]
      : []),
  ]);

  return (
    <DashboardShell
      heading="Riwayat Koin"
      identity={`${profile.Nama_Member} · ${profile.ID_Member}`}
      role="Member"
    >
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <p className="text-sm text-[#64748b]">Saldo koin saat ini</p>
        <p className="mt-1 text-2xl font-bold">{balance} koin</p>
      </section>
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Aktivitas Koin</h2>
        <ul className="divide-y divide-[#e2e8f0]">
          {history.map((item) => (
            <li className="flex flex-wrap justify-between gap-3 py-3 text-sm" key={item.key}>
              <span>
                {item.label} · {item.transaction.Kode_Transaksi}
              </span>
              <span
                className={
                  item.amount > 0
                    ? "font-semibold text-emerald-700"
                    : "font-semibold text-red-600"
                }
              >
                {item.amount > 0 ? "+" : ""}
                {item.amount} koin
              </span>
              <time className="w-full text-xs text-[#64748b]">
                {item.transaction.Tgl_Jam_Transaksi.toLocaleString("id-ID")}
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
