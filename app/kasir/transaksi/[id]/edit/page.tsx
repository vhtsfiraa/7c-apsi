import { notFound } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { TransactionEditForm } from "@/app/kasir/transaction-edit-form";

export const instant = false;

type PageProps = { params: Promise<{ id: string }> };

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

export default async function EditTransactionPage({ params }: PageProps) {
  const cashier = await requireRole("Kasir");
  const { id } = await params;
  if (!id || id.length > 30) notFound();
  const transaction = await getPrismaClient().transaksi.findFirst({
    where: {
      Kode_Transaksi: id,
      ...laundryTransactionFilter,
    },
    select: {
      Kode_Transaksi: true,
      Catatan_Pakaian: true,
      Total_Berat_Kg: true,
      Harga_Per_Kg: true,
    },
  });
  if (!transaction) notFound();
  const field = (name: string) =>
    transaction.Catatan_Pakaian?.match(new RegExp(`^${name}:\\s*(.*)$`, "m"))?.[1] ?? "";
  const quantity = Number(field("Jumlah"));

  return (
    <DashboardShell
      heading="Ubah Transaksi"
      identity={`${cashier.name} · ${cashier.username}`}
      activeHref="/kasir/transaksi"
      role="Kasir"
    >
      <TransactionEditForm
        transaction={{
          id_transaksi: transaction.Kode_Transaksi,
          nama_barang: field("Pakaian") || transaction.Catatan_Pakaian || "",
          jenis_layanan: field("Layanan") || null,
          jumlah: Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1,
          berat_kg: transaction.Total_Berat_Kg?.toString() ?? null,
          harga_satuan: String(transaction.Harga_Per_Kg ?? ""),
          catatan_pakaian: field("Catatan"),
        }}
      />
    </DashboardShell>
  );
}
