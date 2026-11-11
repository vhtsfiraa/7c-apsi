import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

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

export default async function MemberTransactionHistoryPage() {
  const member = await requireRole("Member");
  const prisma = getPrismaClient();
  const [profile, transactions] = await Promise.all([
    prisma.member.findUnique({
      where: { ID_Member: member.userId },
      select: { ID_Member: true, Nama_Member: true },
    }),
    prisma.transaksi.findMany({
      where: { AND: [{ ID_Member: member.userId }, laundryTransactionFilter] },
      orderBy: { Tgl_Jam_Transaksi: "desc" },
      include: {
        statusProses: {
          orderBy: { Waktu_Status: "desc" },
          take: 1,
          include: { status: true },
        },
      },
    }),
  ]);
  if (!profile) throw new Error("Data Member pada sesi tidak ditemukan.");

  return (
    <DashboardShell
      heading="Riwayat Transaksi"
      identity={`${profile.Nama_Member} · ${profile.ID_Member}`}
      activeHref="/member/riwayat"
      role="Member"
    >
      <section
        aria-labelledby="transaction-history-title"
        className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-5 sm:px-6"
      >
        <h2 className="mb-4 text-base font-semibold" id="transaction-history-title">
          Riwayat Laundry Anda
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead className="bg-[#f1f5f9] text-[#64748b]">
              <tr>
                <th className="px-3 py-3 font-medium">Kode</th>
                <th className="px-3 py-3 font-medium">Tanggal</th>
                <th className="px-3 py-3 font-medium">Catatan Pakaian</th>
                <th className="px-3 py-3 font-medium">Berat</th>
                <th className="px-3 py-3 font-medium">Total Bayar</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Rincian</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const total =
                  Number(transaction.Total_Berat_Kg ?? 0) *
                  (transaction.Harga_Per_Kg ?? 0) *
                  (transaction.Koin_Ditukar ? 0.75 : 1);
                return (
                  <tr
                    className="border-t border-[#e2e8f0]"
                    key={transaction.Kode_Transaksi}
                  >
                    <td className="px-3 py-3">{transaction.Kode_Transaksi}</td>
                    <td className="px-3 py-3">
                      {transaction.Tgl_Jam_Transaksi.toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-3 py-3">
                      {transaction.Catatan_Pakaian ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {transaction.Total_Berat_Kg
                        ? `${transaction.Total_Berat_Kg.toString()} kg`
                        : "—"}
                    </td>
                    <td className="px-3 py-3">{currency.format(total)}</td>
                    <td className="px-3 py-3">
                      {transaction.statusProses[0]?.status.Nama_Status ??
                        "Belum ditetapkan"}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        className="font-semibold text-[#2563eb] hover:underline"
                        href={`/member/transaksi/${encodeURIComponent(transaction.Kode_Transaksi)}`}
                      >
                        Lihat Status
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-[#64748b]" colSpan={7}>
                    Belum ada transaksi laundry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
