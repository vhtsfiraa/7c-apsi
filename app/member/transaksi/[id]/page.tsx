import { notFound } from "next/navigation";
import { ApiActionButton } from "@/app/components/api-action-button";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

type PageProps = { params: Promise<{ id: string }> };

export default async function MemberTransactionDetailPage({ params }: PageProps) {
  const member = await requireRole("Member");
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id) || id > 2_147_483_647) {
    notFound();
  }
  const transaction = await getPrismaClient().transaksi.findFirst({
    where: { id_transaksi: id, id_user: member.userId },
    include: {
      status_laundry: { select: { nama_status: true } },
      riwayat_status: {
        orderBy: { berubah_pada: "desc" },
        select: {
          status_sebelumnya: true,
          status_baru: true,
          berubah_pada: true,
        },
      },
      pengambilan: true,
    },
  });
  if (!transaction) notFound();

  return (
    <DashboardShell
      heading="Detail Status Laundry"
      identity={`${member.name} · ${member.username}`}
      activeHref="/member/riwayat"
      role="Member"
    >
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">
          TRX-{String(transaction.id_transaksi).padStart(6, "0")}
        </h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#64748b]">Layanan / Barang</dt>
            <dd className="mt-1 font-medium">
              {transaction.jenis_layanan ?? transaction.nama_barang}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Status saat ini</dt>
            <dd className="mt-1 font-medium">
              {transaction.status_laundry?.nama_status ?? "Belum ditetapkan"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Dibuat</dt>
            <dd className="mt-1">{transaction.tanggal.toLocaleString("id-ID")}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Estimasi Selesai</dt>
            <dd className="mt-1">
              {transaction.estimasi_selesai?.toLocaleString("id-ID") ?? "Belum tersedia"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold">Riwayat Perubahan Status</h2>
        {transaction.riwayat_status.length > 0 ? (
          <ol className="space-y-3">
            {transaction.riwayat_status.map((history) => (
              <li
                className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#f4f7fb] px-4 py-3 text-sm"
                key={`${history.status_baru}-${history.berubah_pada.toISOString()}`}
              >
                <span>
                  {history.status_sebelumnya
                    ? `${history.status_sebelumnya} → ${history.status_baru}`
                    : history.status_baru}
                </span>
                <time className="text-xs text-[#64748b]">
                  {history.berubah_pada.toLocaleString("id-ID")}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-[#64748b]">Belum ada riwayat status.</p>
        )}
      </section>

      {transaction.status_laundry?.nama_status === "Selesai" && (
        <section className="rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">Pengambilan Pakaian</h2>
          {transaction.pengambilan?.diserahkan_pada ? (
            <p className="mt-3 text-sm text-[#64748b]">
              Sudah diserahterimakan pada{" "}
              {transaction.pengambilan.diserahkan_pada.toLocaleString("id-ID")}.
            </p>
          ) : transaction.pengambilan ? (
            <p className="mt-3 text-sm text-[#64748b]">
              Permintaan Anda telah tercatat. Serah terima final dilakukan Kasir.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-[#64748b]">
                Laundry siap diambil. Ajukan permintaan agar Kasir dapat menyiapkan serah terima.
              </p>
              <div className="mt-4">
                <ApiActionButton
                  endpoint={`/api/transaksi/${transaction.id_transaksi}/pickup`}
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
