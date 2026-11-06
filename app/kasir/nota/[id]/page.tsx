import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/app/components/print-button";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type ReceiptPageProps = {
  params: Promise<{ id: string }>;
};

export default async function KasirReceiptPage({ params }: ReceiptPageProps) {
  const cashier = await requireRole("Kasir");
  const { id } = await params;
  const transactionId = Number(id);
  if (
    !/^[1-9]\d*$/.test(id) ||
    !Number.isSafeInteger(transactionId) ||
    transactionId > 2_147_483_647
  ) {
    notFound();
  }

  const transaction = await getPrismaClient().transaksi.findUnique({
    where: { id_transaksi: transactionId },
    select: {
      id_transaksi: true,
      nama_barang: true,
      jumlah: true,
      berat_kg: true,
      harga_satuan: true,
      total_bayar: true,
      diskon_persen: true,
      koin_dipakai: true,
      tanggal: true,
      users: {
        select: {
          nama: true,
          username: true,
        },
      },
    },
  });
  if (!transaction) notFound();

  const total =
    transaction.total_bayar ??
    Number(transaction.harga_satuan) *
      (transaction.berat_kg ? Number(transaction.berat_kg) : transaction.jumlah);

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-[#0f172a] sm:px-8">
      <section
        aria-labelledby="receipt-title"
        className="mx-auto max-w-xl rounded-xl border border-[#e2e8f0] bg-white p-6 sm:p-8"
      >
        <p className="text-sm font-medium text-[#64748b]">Job Laundry</p>
        <h1 className="mt-1 text-xl font-bold" id="receipt-title">
          Nota Transaksi
        </h1>
        <p className="mt-1 text-sm text-[#64748b]">
          TRX-{String(transaction.id_transaksi).padStart(6, "0")}
        </p>

        <dl className="mt-6 grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 border-y border-dashed border-[#cbd5e1] py-5 text-sm">
          <dt className="text-[#64748b]">Tanggal</dt>
          <dd className="text-right">
            {transaction.tanggal.toLocaleString("id-ID")}
          </dd>
          <dt className="text-[#64748b]">Member</dt>
          <dd className="text-right">
            {transaction.users.nama} ({transaction.users.username})
          </dd>
          <dt className="text-[#64748b]">Pakaian / Paket</dt>
          <dd className="text-right">{transaction.nama_barang}</dd>
          <dt className="text-[#64748b]">Jumlah</dt>
          <dd className="text-right">
            {transaction.berat_kg
              ? `${transaction.berat_kg.toString()} kg`
              : `${transaction.jumlah} pcs`}
          </dd>
          <dt className="text-[#64748b]">Harga Satuan</dt>
          <dd className="text-right">
            {currency.format(Number(transaction.harga_satuan))}
          </dd>
          {transaction.diskon_persen > 0 && (
            <>
              <dt className="text-[#64748b]">
                Diskon {transaction.diskon_persen}% ({transaction.koin_dipakai} koin)
              </dt>
              <dd className="text-right text-emerald-700">
                Koin ditukarkan
              </dd>
            </>
          )}
          <dt className="font-semibold">Total</dt>
          <dd className="text-right font-semibold">
            {currency.format(Number(total))}
          </dd>
        </dl>

        <p className="mt-5 text-xs text-[#64748b]">
          Dilayani oleh {cashier.name}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 print:hidden">
          <PrintButton />
          <Link
            className="text-sm font-medium text-[#2563eb] hover:underline"
            href="/kasir/nota"
          >
            Kembali ke Nota
          </Link>
        </div>
      </section>
    </main>
  );
}
