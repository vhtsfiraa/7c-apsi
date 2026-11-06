import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function MemberProfilePage() {
  const session = await requireRole("Member");
  const profile = await getPrismaClient().users.findUnique({
    where: { id_user: session.userId },
    select: {
      id_user: true,
      nama: true,
      username: true,
      nomor_telepon: true,
      koin_saldo: true,
    },
  });
  if (!profile) throw new Error("Data Member pada sesi tidak ditemukan.");

  return (
    <DashboardShell
      heading="Profil Member"
      identity={`${profile.nama} · MBR-${String(profile.id_user).padStart(3, "0")}`}
      activeHref="/member/profil"
      role="Member"
    >
      <section className="max-w-3xl rounded-xl border border-[#e2e8f0] bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">Informasi Keanggotaan</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#64748b]">ID Member</dt>
            <dd className="mt-1 font-semibold">
              MBR-{String(profile.id_user).padStart(3, "0")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Nama lengkap</dt>
            <dd className="mt-1 font-semibold">{profile.nama}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Username</dt>
            <dd className="mt-1">{profile.username}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Nomor HP</dt>
            <dd className="mt-1">{profile.nomor_telepon ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748b]">Saldo Koin</dt>
            <dd className="mt-1">{profile.koin_saldo} koin</dd>
          </div>
        </dl>
      </section>
    </DashboardShell>
  );
}
