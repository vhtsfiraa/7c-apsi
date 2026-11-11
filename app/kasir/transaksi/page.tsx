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

export default async function KasirTransactionPage() {
  const cashier = await requireRole("Kasir");
  const prisma = getPrismaClient();
  const [members, transactions] = await Promise.all([
    prisma.member.findMany({
      orderBy: { Nama_Member: "asc" },
      select: {
        ID_Member: true,
        Nama_Member: true,
        No_HP: true,
      },
    }),
    prisma.transaksi.findMany({
      where: laundryTransactionFilter,
      orderBy: { Tgl_Jam_Transaksi: "desc" },
      take: 30,
      include: {
        member: { select: { ID_Member: true, Nama_Member: true } },
        pegawaiKasir: { select: { Nama_Pegawai: true } },
        pegawaiSupervisor: { select: { Nama_Pegawai: true } },
        statusProses: {
          orderBy: { Waktu_Status: "desc" },
          take: 1,
          include: { status: true },
        },
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
                <th className="px-3 py-3 font-medium">Catatan Pakaian</th>
                <th className="px-3 py-3 font-medium">Tanggal</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const total =
                  Number(transaction.Total_Berat_Kg ?? 0) *
                  (transaction.Harga_Per_Kg ?? 0) *
                  (transaction.Koin_Ditukar ? 0.75 : 1);
                const status = transaction.statusProses[0]?.status.Nama_Status ?? null;
                return (
                  <tr
                    className="border-t border-[#e2e8f0] align-top"
                    key={transaction.Kode_Transaksi}
                  >
                    <td className="px-3 py-3">{transaction.Kode_Transaksi}</td>
                    <td className="px-3 py-3">
                      {transaction.member.Nama_Member}
                      <span className="block text-[#64748b]">
                        {transaction.member.ID_Member}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {transaction.Catatan_Pakaian ?? "—"}
                      <span className="block text-[#64748b]">
                        {transaction.Total_Berat_Kg
                          ? `${transaction.Total_Berat_Kg.toString()} kg`
                          : ""}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {transaction.Tgl_Jam_Transaksi.toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-3 py-3">
                      {status ?? "Belum ditetapkan"}
                      <span className="block text-[#64748b]">
                        Kasir: {transaction.pegawaiKasir.Nama_Pegawai}
                      </span>
                      {transaction.pegawaiSupervisor && (
                        <span className="block text-[#64748b]">
                          Supervisor: {transaction.pegawaiSupervisor.Nama_Pegawai}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">{currency.format(total)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-2">
                        <Link
                          className="font-semibold text-[#2563eb] hover:underline"
                          href={`/kasir/transaksi/${encodeURIComponent(transaction.Kode_Transaksi)}/edit`}
                        >
                          Ubah
                        </Link>
                        <Link
                          className="font-semibold text-[#2563eb] hover:underline"
                          href={`/kasir/nota/${encodeURIComponent(transaction.Kode_Transaksi)}`}
                        >
                          Cetak Struk
                        </Link>
                        <StatusUpdateForm
                          currentStatus={status}
                          transactionId={transaction.Kode_Transaksi}
                        />
                        {status === "Menunggu Pengambilan" && (
                          <PickupConfirmationForm
                            transactionId={transaction.Kode_Transaksi}
                          />
                        )}
                        {status === "Selesai" && (
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
