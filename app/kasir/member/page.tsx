import Link from "next/link";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

export default async function KasirMembersPage() {
  const cashier = await requireRole("Kasir");
  const members = await getPrismaClient().users.findMany({
    where: { role: { equals: "Member", mode: "insensitive" } },
    orderBy: { nama: "asc" },
    select: {
      id_user: true,
      nama: true,
      username: true,
      nomor_telepon: true,
      koin_saldo: true,
    },
  });

  return (
    <DashboardShell
      heading="Data Member"
      identity={`${cashier.name} · Kasir`}
      activeHref="/kasir/member"
      role="Kasir"
    >
      <section
        aria-labelledby="members-title"
        className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-5 sm:px-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold" id="members-title">
            Member Terdaftar
          </h2>
          <Link
            className="rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            href="/kasir/member/tambah"
          >
            Tambah Member
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead className="bg-[#f1f5f9] text-[#64748b]">
              <tr>
                <th className="px-3 py-3 font-medium">ID Member</th>
                <th className="px-3 py-3 font-medium">Nama</th>
                <th className="px-3 py-3 font-medium">Username</th>
                <th className="px-3 py-3 font-medium">No. Telepon</th>
                <th className="px-3 py-3 font-medium">Saldo Koin</th>
                <th className="px-3 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr className="border-t border-[#e2e8f0]" key={member.id_user}>
                  <td className="px-3 py-3">
                    MBR-{String(member.id_user).padStart(3, "0")}
                  </td>
                  <td className="px-3 py-3">{member.nama}</td>
                  <td className="px-3 py-3">{member.username}</td>
                  <td className="px-3 py-3">{member.nomor_telepon ?? "—"}</td>
                  <td className="px-3 py-3">{member.koin_saldo}</td>
                  <td className="px-3 py-3">
                    <Link
                      className="font-semibold text-[#2563eb] hover:underline"
                      href={`/kasir/member/${member.id_user}/edit`}
                    >
                      Ubah
                    </Link>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-[#64748b]" colSpan={6}>
                    Belum ada member terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
