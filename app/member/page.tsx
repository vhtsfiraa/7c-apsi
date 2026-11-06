import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { DISCOUNT_REDEMPTION_COINS } from "@/app/lib/laundry";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function MemberPage() {
  const member = await requireRole("Member");
  const prisma = getPrismaClient();
  const [profile, transactions, unreadNotifications] = await Promise.all([
    prisma.users.findUnique({
      where: { id_user: member.userId },
      select: {
        id_user: true,
        nama: true,
        nomor_telepon: true,
        koin_saldo: true,
      },
    }),
    prisma.transaksi.findMany({
      where: { id_user: member.userId },
      orderBy: { tanggal: "desc" },
      take: 3,
      select: {
        id_transaksi: true,
        nama_barang: true,
        tanggal: true,
        status_laundry: { select: { nama_status: true } },
      },
    }),
    prisma.notifikasi.count({
      where: { id_user: member.userId, dibaca_pada: null },
    }),
  ]);
  if (!profile) throw new Error("Data Member pada sesi tidak ditemukan.");

  const memberCode = `MBR-${String(profile.id_user).padStart(3, "0")}`;

  return (
    <DashboardShell
      heading="Dashboard Member"
      identity={`${profile.nama} · ${memberCode}`}
      activeHref="/member"
      role="Member"
    >
      <section
        aria-label="Ringkasan keanggotaan"
        className="grid gap-4 md:grid-cols-2"
      >
        <article className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 sm:px-6">
          <h2 className="text-[13px] font-medium text-[#64748b]">Saldo Koin</h2>
          <p className="mt-2 text-xl font-bold">{profile.koin_saldo} koin</p>
        </article>
        <article className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 sm:px-6">
          <h2 className="text-[13px] font-medium text-[#64748b]">Status Diskon</h2>
          <p className="mt-2 text-xl font-bold">
            {profile.koin_saldo >= DISCOUNT_REDEMPTION_COINS
              ? "Berhak Diskon 25%"
              : "Koin Belum Cukup"}
          </p>
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
            <dd className="mt-1 font-semibold">{profile.nama}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">ID Member</dt>
            <dd className="mt-1 font-semibold">{memberCode}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">No. HP</dt>
            <dd className="mt-1 font-semibold">{profile.nomor_telepon ?? "—"}</dd>
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
              description: `${unreadNotifications} notifikasi belum dibaca.`,
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
                key={transaction.id_transaksi}
              >
                <span>{transaction.nama_barang}</span>
                <span className="font-medium text-[#64748b]">
                  {transaction.status_laundry?.nama_status ?? "Menunggu status"} ·{" "}
                  {transaction.tanggal.toLocaleDateString("id-ID")}
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
