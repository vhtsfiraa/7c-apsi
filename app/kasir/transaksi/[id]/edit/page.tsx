import { notFound } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { TransactionEditForm } from "@/app/kasir/transaction-edit-form";

export const instant = false;

type PageProps = { params: Promise<{ id: string }> };

export default async function EditTransactionPage({ params }: PageProps) {
  const cashier = await requireRole("Kasir");
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id) || id > 2_147_483_647) {
    notFound();
  }
  const transaction = await getPrismaClient().transaksi.findUnique({
    where: { id_transaksi: id },
    select: {
      id_transaksi: true,
      nama_barang: true,
      jenis_layanan: true,
      jumlah: true,
      berat_kg: true,
      harga_satuan: true,
      estimasi_selesai: true,
    },
  });
  if (!transaction) notFound();

  return (
    <DashboardShell
      heading="Ubah Transaksi"
      identity={`${cashier.name} · ${cashier.username}`}
      activeHref="/kasir/transaksi"
      role="Kasir"
    >
      <TransactionEditForm
        transaction={{
          ...transaction,
          berat_kg: transaction.berat_kg?.toString() ?? null,
          harga_satuan: transaction.harga_satuan.toString(),
          estimasi_selesai: transaction.estimasi_selesai?.toISOString() ?? null,
        }}
      />
    </DashboardShell>
  );
}
