import { notFound } from "next/navigation";
import { ApiActionButton } from "@/app/components/api-action-button";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

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

export default async function MemberTransactionDetailPage({ params }: PageProps) {
  const member = await requireRole("Member");
  const { id } = await params;
  if (!id || id.length > 30) notFound();

  const prisma = getPrismaClient();
  const [profile, transaction] = await Promise.all([
    prisma.member.findUnique({
      where: { ID_Member: member.userId },
      select: { Nama_Member: true, ID_Member: true },
    }),
    prisma.transaksi.findFirst({
      where: {
        AND: [
          { Kode_Transaksi: id, ID_Member: member.userId },
          laundryTransactionFilter,
        ],
      },
      include: {
        statusProses: {
          orderBy: { Waktu_Status: "desc" },
          include: { status: true },
        },
      },
    }),
  ]);
  if (!transaction || !profile) notFound();

  const currentStatus = transaction.statusProses[0]?.status.Nama_Status ?? null;

  return (
    <DashboardShell
      heading="Detail Status Laundry"
      identity={`${profile.Nama_Member} · ${profile.ID_Member}`}
      activeHref="/member/riwayat"
      role="Member"
    >
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">{transaction.Kode_Transaksi}</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#64748b]">Catatan Pakaian</dt>
            <dd className="mt-1 font-medium">{transaction.Catatan_Pakaian ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Status saat ini</dt>
            <dd className="mt-1 font-medium">{currentStatus ?? "Belum ditetapkan"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Dibuat</dt>
            <dd className="mt-1">
              {transaction.Tgl_Jam_Transaksi.toLocaleString("id-ID")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Berat</dt>
            <dd className="mt-1">
              {transaction.Total_Berat_Kg
                ? `${transaction.Total_Berat_Kg.toString()} kg`
                : "Belum tersedia"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Riwayat Perubahan Status</h2>
        {transaction.statusProses.length > 0 ? (
          <ol className="space-y-3">
            {transaction.statusProses.map((history) => (
              <li
                className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#f4f7fb] px-4 py-3 text-sm"
                key={`${history.ID_Status}-${history.Waktu_Status.toISOString()}`}
              >
                <span>{history.status.Nama_Status}</span>
                <time className="text-xs text-[#64748b]">
                  {history.Waktu_Status.toLocaleString("id-ID")}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-[#64748b]">Belum ada riwayat status.</p>
        )}
      </section>

      {(currentStatus === "Selesai" ||
        currentStatus === "Menunggu Pengambilan" ||
        currentStatus === "Sudah Diambil") && (
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">Pengambilan Pakaian</h2>
          {currentStatus === "Sudah Diambil" ? (
            <p className="mt-3 text-sm text-[#64748b]">
              Pesanan ini telah ditandai Sudah Diambil.
            </p>
          ) : currentStatus === "Menunggu Pengambilan" ? (
            <p className="mt-3 text-sm text-[#64748b]">
              Permintaan pengambilan tercatat. Serah terima final dilakukan Kasir.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-[#64748b]">
                Laundry siap diambil. Ajukan permintaan agar Kasir dapat menyiapkan serah terima.
              </p>
              <div className="mt-4">
                <ApiActionButton
                  endpoint={`/api/transaksi/${encodeURIComponent(transaction.Kode_Transaksi)}/pickup`}
                  label="Ajukan Pengambilan"
                />
              </div>
            </>
          )}
        </section>
      )}
    </DashboardShell>
  );
}
