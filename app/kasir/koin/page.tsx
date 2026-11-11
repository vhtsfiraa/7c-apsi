import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { CoinManagementForm } from "@/app/kasir/coin-management-form";

export const instant = false;

export default async function KasirCoinManagementPage() {
  const cashier = await requireRole("Kasir");
  const members = await getPrismaClient().member.findMany({
    orderBy: { Nama_Member: "asc" },
    include: {
      transactions: {
        orderBy: { Tgl_Jam_Transaksi: "desc" },
        select: {
          Kode_Transaksi: true,
          Tgl_Jam_Transaksi: true,
          Koin_Didapat: true,
          Koin_Ditukar: true,
          Catatan_Pakaian: true,
        },
      },
    },
  });
  const coinSummaries = members.map((member) => ({
    ID_Member: member.ID_Member,
    Nama_Member: member.Nama_Member,
    balance: member.transactions.reduce(
      (total, transaction) =>
        total + (transaction.Koin_Didapat ?? 0) - (transaction.Koin_Ditukar ?? 0),
      0,
    ),
    history: member.transactions.flatMap((transaction) => [
      ...(transaction.Koin_Didapat
        ? [{
            key: `${transaction.Kode_Transaksi}-earned`,
            label: transaction.Catatan_Pakaian?.startsWith("Migrasi riwayat koin:")
              ? transaction.Catatan_Pakaian
              : transaction.Catatan_Pakaian?.startsWith("Penyesuaian saldo koin saat migrasi skema ERD.")
                ? transaction.Catatan_Pakaian
                : "Koin diperoleh",
            amount: transaction.Koin_Didapat,
            transactionCode: transaction.Kode_Transaksi,
            date: transaction.Tgl_Jam_Transaksi.toISOString(),
          }]
        : []),
      ...(transaction.Koin_Ditukar
        ? [{
            key: `${transaction.Kode_Transaksi}-redeemed`,
            label: transaction.Catatan_Pakaian?.startsWith("Migrasi riwayat koin:")
              ? transaction.Catatan_Pakaian
              : transaction.Catatan_Pakaian?.startsWith("Penyesuaian saldo koin saat migrasi skema ERD.")
                ? transaction.Catatan_Pakaian
                : "Koin ditukarkan",
            amount: -transaction.Koin_Ditukar,
            transactionCode: transaction.Kode_Transaksi,
            date: transaction.Tgl_Jam_Transaksi.toISOString(),
          }]
        : []),
    ]),
  }));

  return (
    <DashboardShell
      heading="Koin Member"
      identity={`${cashier.name} · ${cashier.username}`}
      activeHref="/kasir/koin"
      role="Kasir"
    >
      <CoinManagementForm members={coinSummaries} />
    </DashboardShell>
  );
}
