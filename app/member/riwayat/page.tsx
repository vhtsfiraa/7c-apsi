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

export default async function MemberTransactionHistoryPage() {
  const member = await requireRole("Member");
  const [profile, transactions] = await Promise.all([
    getPrismaClient().users.findUnique({
      where: { id_user: member.userId },
      select: { id_user: true, nama: true },
    }),
    getPrismaClient().transaksi.findMany({
      where: { id_user: member.userId },
      orderBy: { tanggal: "desc" },
      include: {
        status_laundry: { select: { nama_status: true } },
        pengambilan: true,
      },
    }),
  ]);
  if (!profile) throw new Error("Data Member pada sesi tidak ditemukan.");

  return (
    <DashboardShell
      heading="Riwayat Transaksi"
      identity={`${profile.nama} · MBR-${String(profile.id_user).padStart(3, "0")}`}
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
                <th className="px-3 py-3 font-medium">Layanan / Barang</th>
                <th className="px-3 py-3 font-medium">Berat / Jumlah</th>
                <th className="px-3 py-3 font-medium">Total Bayar</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Rincian</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const total =
                  transaction.total_bayar ??
                  Number(transaction.harga_satuan) * transaction.jumlah;
                return (
                  <tr className="border-t border-[#e2e8f0]" key={transaction.id_transaksi}>
                    <td className="px-3 py-3">
                      TRX-{String(transaction.id_transaksi).padStart(6, "0")}
                    </td>
                    <td className="px-3 py-3">
                      {transaction.tanggal.toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-3 py-3">
                      {transaction.jenis_layanan ?? transaction.nama_barang}
                    </td>
                    <td className="px-3 py-3">
                      {transaction.berat_kg
                        ? `${transaction.berat_kg.toString()} kg`
                        : `${transaction.jumlah} pcs`}
                    </td>
                    <td className="px-3 py-3">{currency.format(Number(total))}</td>
                    <td className="px-3 py-3">
                      {transaction.status_laundry?.nama_status ?? "Belum ditetapkan"}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        className="font-semibold text-[#2563eb] hover:underline"
                        href={`/member/transaksi/${transaction.id_transaksi}`}
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
