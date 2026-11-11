import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function MemberProfilePage() {
  const session = await requireRole("Member");
  const profile = await getPrismaClient().member.findUnique({
    where: { ID_Member: session.userId },
    select: {
      ID_Member: true,
      Nama_Member: true,
      No_HP: true,
      Gender_Member: true,
      Tgl_Daftar: true,
    },
  });
  if (!profile) throw new Error("Data Member pada sesi tidak ditemukan.");

  const transactions = await getPrismaClient().transaksi.findMany({
    where: { ID_Member: profile.ID_Member },
    select: { Koin_Didapat: true, Koin_Ditukar: true },
  });
  const coinBalance = transactions.reduce(
    (total, transaction) =>
      total + (transaction.Koin_Didapat ?? 0) - (transaction.Koin_Ditukar ?? 0),
    0,
  );

  return (
    <DashboardShell
      heading="Profil Member"
      identity={`${profile.Nama_Member} · ${profile.ID_Member}`}
      activeHref="/member/profil"
      role="Member"
    >
      <section className="max-w-3xl rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">Informasi Keanggotaan</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#64748b]">ID Member</dt>
            <dd className="mt-1 font-semibold">{profile.ID_Member}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Nama lengkap</dt>
            <dd className="mt-1 font-semibold">{profile.Nama_Member}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Nomor HP</dt>
            <dd className="mt-1">{profile.No_HP ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Jenis kelamin</dt>
            <dd className="mt-1">{profile.Gender_Member ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Tanggal daftar</dt>
            <dd className="mt-1">{profile.Tgl_Daftar.toLocaleDateString("id-ID")}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Saldo Koin</dt>
            <dd className="mt-1">{coinBalance} koin</dd>
          </div>
        </dl>
      </section>
    </DashboardShell>
  );
}
