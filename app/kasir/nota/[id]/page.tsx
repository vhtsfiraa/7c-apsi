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

export default async function KasirReceiptPage({ params }: ReceiptPageProps) {
  await requireRole("Kasir");
  const { id } = await params;
  if (!id || id.length > 30) notFound();

  const transaction = await getPrismaClient().transaksi.findFirst({
    where: { AND: [{ Kode_Transaksi: id }, laundryTransactionFilter] },
    select: {
      Kode_Transaksi: true,
      Catatan_Pakaian: true,
      Total_Berat_Kg: true,
      Harga_Per_Kg: true,
      Koin_Didapat: true,
      Koin_Ditukar: true,
      Nilai_Per_Koin: true,
      Tgl_Jam_Transaksi: true,
      member: {
        select: {
          ID_Member: true,
          Nama_Member: true,
          No_HP: true,
        },
      },
      pegawaiKasir: { select: { Nama_Pegawai: true } },
      pegawaiSupervisor: { select: { Nama_Pegawai: true } },
    },
  });
  if (!transaction) notFound();

  const total =
    Number(transaction.Total_Berat_Kg ?? 0) *
    (transaction.Harga_Per_Kg ?? 0) *
    (transaction.Koin_Ditukar ? 0.75 : 1);

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
        <p className="mt-1 text-sm text-[#64748b]">{transaction.Kode_Transaksi}</p>

        <dl className="mt-6 grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 border-y border-dashed border-[#cbd5e1] py-5 text-sm">
          <dt className="text-[#64748b]">Tanggal</dt>
          <dd className="text-right">
            {transaction.Tgl_Jam_Transaksi.toLocaleString("id-ID")}
          </dd>
          <dt className="text-[#64748b]">Member</dt>
          <dd className="text-right">
            {transaction.member.Nama_Member} ({transaction.member.ID_Member})
          </dd>
          <dt className="text-[#64748b]">No. HP</dt>
          <dd className="text-right">{transaction.member.No_HP ?? "—"}</dd>
          <dt className="text-[#64748b]">Catatan Pakaian</dt>
          <dd className="text-right">{transaction.Catatan_Pakaian ?? "—"}</dd>
          <dt className="text-[#64748b]">Berat</dt>
          <dd className="text-right">
            {transaction.Total_Berat_Kg
              ? `${transaction.Total_Berat_Kg.toString()} kg`
              : "—"}
          </dd>
          <dt className="text-[#64748b]">Harga per Kg</dt>
          <dd className="text-right">
            {transaction.Harga_Per_Kg === null
              ? "—"
              : currency.format(transaction.Harga_Per_Kg)}
          </dd>
          <dt className="font-semibold">Total</dt>
          <dd className="text-right font-semibold">{currency.format(total)}</dd>
          <dt className="text-[#64748b]">Koin diperoleh</dt>
          <dd className="text-right">{transaction.Koin_Didapat ?? 0}</dd>
          <dt className="text-[#64748b]">Koin ditukarkan</dt>
          <dd className="text-right">{transaction.Koin_Ditukar ?? 0}</dd>
          <dt className="text-[#64748b]">Nilai per Koin</dt>
          <dd className="text-right">
            {transaction.Nilai_Per_Koin === null
              ? "—"
              : currency.format(transaction.Nilai_Per_Koin)}
          </dd>
        </dl>

        <p className="mt-5 text-xs text-[#64748b]">
          Dilayani oleh {transaction.pegawaiKasir.Nama_Pegawai}
        </p>
        {transaction.pegawaiSupervisor && (
          <p className="mt-1 text-xs text-[#64748b]">
            Supervisor: {transaction.pegawaiSupervisor.Nama_Pegawai}
          </p>
        )}
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
