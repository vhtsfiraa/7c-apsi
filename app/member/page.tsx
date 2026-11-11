import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

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

export default async function MemberPage() {
  const session = await requireRole("Member");
  const prisma = getPrismaClient();
  const [profile, coinTransactions, transactions, transactionCount, completedNotifications] = await Promise.all([
    prisma.member.findUnique({
      where: { ID_Member: session.userId },
      select: { ID_Member: true, Nama_Member: true, No_HP: true },
    }),
    prisma.transaksi.findMany({
      where: { ID_Member: session.userId },
      select: { Koin_Didapat: true, Koin_Ditukar: true },
    }),
    prisma.transaksi.findMany({
      where: { AND: [{ ID_Member: session.userId }, laundryTransactionFilter] },
      orderBy: { Tgl_Jam_Transaksi: "desc" },
      take: 3,
      select: {
        Kode_Transaksi: true,
        Tgl_Jam_Transaksi: true,
        statusProses: {
          orderBy: { Waktu_Status: "desc" },
          take: 1,
          select: { status: { select: { Nama_Status: true } } },
        },
      },
    }),
    prisma.transaksi.count({
      where: { AND: [{ ID_Member: session.userId }, laundryTransactionFilter] },
    }),
    prisma.transaksi.count({
      where: {
        AND: [
          { ID_Member: session.userId },
          laundryTransactionFilter,
          { Waktu_Notifikasi_Selesai: { not: null } },
        ],
      },
    }),
  ]);
  if (!profile) throw new Error("Data Member pada sesi tidak ditemukan.");

  const coinBalance = coinTransactions.reduce(
    (total, transaction) =>
      total + (transaction.Koin_Didapat ?? 0) - (transaction.Koin_Ditukar ?? 0),
    0,
  );

  return (
    <DashboardShell
      heading="Dashboard Member"
      identity={`${profile.Nama_Member} · ${profile.ID_Member}`}
      activeHref="/member"
      role="Member"
    >
      <section
        aria-label="Ringkasan keanggotaan"
        className="grid gap-4 md:grid-cols-2"
      >
        <article className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 sm:px-6">
          <h2 className="text-[13px] font-medium text-[#64748b]">Saldo Koin</h2>
          <p className="mt-2 text-xl font-bold">{coinBalance} koin</p>
        </article>
        <article className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 sm:px-6">
          <h2 className="text-[13px] font-medium text-[#64748b]">Transaksi Laundry</h2>
          <p className="mt-2 text-xl font-bold">{transactionCount} transaksi</p>
        </article>
      </section>

      <section
        aria-labelledby="membership-title"
        className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 sm:px-6"
      >
        <h2 className="text-[13px] font-medium text-[#64748b]" id="membership-title">
          Informasi Keanggotaan
        </h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-[#64748b]">Nama Member</dt>
            <dd className="mt-1 font-semibold">{profile.Nama_Member}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">ID Member</dt>
            <dd className="mt-1 font-semibold">{profile.ID_Member}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">No. HP</dt>
            <dd className="mt-1 font-semibold">{profile.No_HP ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="member-features-title">
        <h2
          className="mb-3 text-sm font-medium text-[#64748b]"
          id="member-features-title"
        >
          Pilih fitur
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Riwayat Transaksi",
              description: "Lihat transaksi dan perkembangan status laundry Anda.",
              href: "/member/riwayat",
            },
            {
              title: "Riwayat Koin",
              description: "Lihat koin yang diperoleh dan ditukarkan.",
              href: "/member/koin",
            },
            {
              title: "Notifikasi Status Pakaian",
              description: `${completedNotifications} transaksi telah mencatat notifikasi selesai.`,
              href: "/member/notifikasi",
            },
          ].map((feature) => (
            <article
              className="flex flex-col items-start gap-3.5 rounded-xl border border-[#e2e8f0] bg-white px-6 py-5"
              key={feature.title}
            >
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="text-[13px] leading-relaxed text-[#64748b]">
                {feature.description}
              </p>
              <Link
                className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
                href={feature.href}
              >
                Buka
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="recent-laundry-title"
        className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 sm:px-6"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold" id="recent-laundry-title">
            Status Laundry Terakhir
          </h2>
          <Link className="text-xs font-semibold text-[#2563eb]" href="/member/riwayat">
            Lihat Riwayat
          </Link>
        </div>
        {transactions.length ? (
          <ul className="divide-y divide-[#e2e8f0]">
            {transactions.map((transaction) => (
              <li
                className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                key={transaction.Kode_Transaksi}
              >
                <span>{transaction.Kode_Transaksi}</span>
                <span className="font-medium text-[#64748b]">
                  {transaction.statusProses[0]?.status.Nama_Status ?? "Belum ditetapkan"} ·{" "}
                  {transaction.Tgl_Jam_Transaksi.toLocaleDateString("id-ID")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#64748b]">Belum ada transaksi laundry.</p>
        )}
      </section>
    </DashboardShell>
  );
}
