import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function KasirReceiptListPage() {
  const cashier = await requireRole("Kasir");
  const transactions = await getPrismaClient().transaksi.findMany({
    orderBy: { tanggal: "desc" },
    select: {
      id_transaksi: true,
      nama_barang: true,
      tanggal: true,
      users: { select: { nama: true } },
    },
  });

  return (
    <DashboardShell
      heading="Cetak Nota"
      identity={`${cashier.name} · ${cashier.username}`}
      role="Kasir"
    >
      <section
        aria-labelledby="receipt-list-title"
        className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-5 sm:px-6"
      >
        <h2 className="mb-4 text-base font-semibold" id="receipt-list-title">
          Pilih Transaksi
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-xs">
            <thead className="bg-[#f1f5f9] text-[#64748b]">
              <tr>
                <th className="px-3 py-3 font-medium">Kode</th>
                <th className="px-3 py-3 font-medium">Tanggal</th>
                <th className="px-3 py-3 font-medium">Member</th>
                <th className="px-3 py-3 font-medium">Paket</th>
                <th className="px-3 py-3 font-medium">Nota</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  className="border-t border-[#e2e8f0]"
                  key={transaction.id_transaksi}
                >
                  <td className="px-3 py-3">
                    TRX-{String(transaction.id_transaksi).padStart(6, "0")}
                  </td>
                  <td className="px-3 py-3">
                    {transaction.tanggal.toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-3">{transaction.users.nama}</td>
                  <td className="px-3 py-3">{transaction.nama_barang}</td>
                  <td className="px-3 py-3">
                    <Link
                      className="font-semibold text-[#2563eb] hover:underline"
                      href={`/kasir/nota/${transaction.id_transaksi}`}
                    >
                      Buka Nota
                    </Link>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-[#64748b]"
                    colSpan={5}
                  >
                    Belum ada transaksi untuk dicetak.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Link
        className="text-sm font-medium text-[#2563eb] hover:underline"
        href="/kasir"
      >
        Kembali ke Dashboard
      </Link>
    </DashboardShell>
  );
}
