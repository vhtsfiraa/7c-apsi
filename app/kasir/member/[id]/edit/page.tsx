import { notFound } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { MemberForm } from "@/app/components/member-form";
import { requireRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export const instant = false;

type PageProps = { params: Promise<{ id: string }> };

export default async function EditMemberPage({ params }: PageProps) {
  const cashier = await requireRole("Kasir");
  const { id } = await params;
  if (!id || id.length > 20) notFound();
  const member = await getPrismaClient().member.findUnique({
    where: { ID_Member: id },
    select: {
      ID_Member: true,
      Nama_Member: true,
      No_HP: true,
    },
  });
  if (!member) notFound();

  return (
    <DashboardShell
      heading="Ubah Data Member"
      identity={`${cashier.name} · Kasir`}
      activeHref="/kasir/member"
      role="Kasir"
    >
      <MemberForm
        member={{
          id_member: member.ID_Member,
          nama: member.Nama_Member,
          nomor_telepon: member.No_HP,
        }}
      />
    </DashboardShell>
  );
}
