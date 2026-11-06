import { notFound } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { MemberForm } from "@/app/components/member-form";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

type PageProps = { params: Promise<{ id: string }> };

export default async function EditMemberPage({ params }: PageProps) {
  const cashier = await requireRole("Kasir");
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id) || id > 2_147_483_647) {
    notFound();
  }
  const member = await getPrismaClient().users.findUnique({
    where: { id_user: id },
    select: { id_user: true, nama: true, nomor_telepon: true, role: true },
  });
  if (!member || member.role.toLowerCase() !== "member") notFound();

  return (
    <DashboardShell
      heading="Ubah Data Member"
      identity={`${cashier.name} · Kasir`}
      activeHref="/kasir/member"
      role="Kasir"
    >
      <MemberForm member={member} />
    </DashboardShell>
  );
}
