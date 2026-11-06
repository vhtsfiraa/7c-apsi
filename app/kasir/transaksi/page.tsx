import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { PickupConfirmationForm } from "@/app/components/pickup-confirmation-form";
import { StatusUpdateForm } from "@/app/components/status-update-form";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { KasirTransactionForm } from "@/app/kasir/transaction-form";

export const instant = false;

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default async function KasirTransactionPage() {
  const cashier = await requireRole("Kasir");
  const prisma = getPrismaClient();
  const [members, transactions] = await Promise.all([
    prisma.users.findMany({
      where: { role: { equals: "Member", mode: "insensitive" } },
      orderBy: { nama: "asc" },
      select: { id_user: true, nama: true, nomor_telepon: true },
    }),
    prisma.transaksi.findMany({
      orderBy: { tanggal: "desc" },
      take: 30,
      include: {
        users: { select: { nama: true, id_user: true } },
        status_laundry: { select: { nama_status: true } },
        pengambilan: true,
      },
    }),
  ]);

  return (
    <DashboardShell
      heading="Kelola Transaksi Laundry"
      identity={`${cashier.name} · ${cashier.username}`}
      activeHref="/kasir/transaksi"
      role="Kasir"
    >
      <section aria-labelledby="transaction-form-title">
        <h2
          className="mb-3 text-sm font-medium text-[#64748b]"
          id="transaction-form-title"
        >
          Buat transaksi laundry
        </h2>
        <KasirTransactionForm members={members} />
      </section>

      <section
        aria-labelledby="transactions-title"
        className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-5 sm:px-6"
      >
        <h2 className="mb-4 text-base font-semibold" id="transactions-title">
          Transaksi Terbaru
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-xs">
            <thead className="bg-[#f1f5f9] text-[#64748b]">
              <tr>
                <th className="px-3 py-3 font-medium">Kode</th>
                <th className="px-3 py-3 font-medium">Member</th>
                <th className="px-3 py-3 font-medium">Layanan / Barang</th>
                <th className="px-3 py-3 font-medium">Tanggal</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const total =
                  transaction.total_bayar ??
                  Number(transaction.harga_satuan) * transaction.jumlah;
                const status = transaction.status_laundry?.nama_status ?? null;
                return (
                  <tr
                    className="border-t border-[#e2e8f0] align-top"
                    key={transaction.id_transaksi}
                  >
                    <td className="px-3 py-3">
                      TRX-{String(transaction.id_transaksi).padStart(6, "0")}
                    </td>
                    <td className="px-3 py-3">
                      {transaction.users.nama}
                      <span className="block text-[#64748b]">
                        MBR-{String(transaction.users.id_user).padStart(3, "0")}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {transaction.jenis_layanan ?? transaction.nama_barang}
                      <span className="block text-[#64748b]">
                        {transaction.berat_kg
                          ? `${transaction.berat_kg.toString()} kg`
                          : `${transaction.jumlah} pcs`}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {transaction.tanggal.toLocaleDateString("id-ID")}
                      {transaction.estimasi_selesai && (
                        <span className="block text-[#64748b]">
                          Est. {transaction.estimasi_selesai.toLocaleDateString("id-ID")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">{status ?? "Belum ditetapkan"}</td>
                    <td className="px-3 py-3">{currency.format(Number(total))}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-2">
                        <Link
                          className="font-semibold text-[#2563eb] hover:underline"
                          href={`/kasir/transaksi/${transaction.id_transaksi}/edit`}
                        >
                          Ubah
                        </Link>
                        <Link
                          className="font-semibold text-[#2563eb] hover:underline"
                          href={`/kasir/nota/${transaction.id_transaksi}`}
                        >
                          Cetak Struk
                        </Link>
                        <StatusUpdateForm
                          currentStatus={status}
                          transactionId={transaction.id_transaksi}
                        />
                        {status === "Selesai" && transaction.pengambilan && (
                          <PickupConfirmationForm
                            transactionId={transaction.id_transaksi}
                          />
                        )}
                        {status === "Selesai" && !transaction.pengambilan && (
                          <span className="text-[#64748b]">
                            Menunggu permintaan pengambilan Member
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-[#64748b]"
                    colSpan={7}
                  >
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
