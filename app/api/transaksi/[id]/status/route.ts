import { authorizeApiRole } from "@/app/lib/api-auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { ensureLaundryStatuses } from "@/app/lib/laundry";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(value: string) {
  const id = Number(value);
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id) && id <= 2_147_483_647
    ? id
    : null;
}

export async function POST(request: Request, { params }: RouteContext) {
  const authorization = await authorizeApiRole("Kasir");
  if (authorization.response) return authorization.response;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ error: "ID transaksi tidak valid." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format request JSON tidak valid." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("nama_status" in body) ||
    typeof body.nama_status !== "string"
  ) {
    return Response.json({ error: "Pilih status laundry yang valid." }, { status: 400 });
  }

  const targetStatus = body.nama_status;
  if (!["Menunggu", "Diproses", "Selesai"].includes(targetStatus)) {
    return Response.json({ error: "Status pengambilan hanya dapat diubah melalui serah terima Kasir." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const statuses = await ensureLaundryStatuses(prisma);
    const target = statuses.find((status) => status.nama_status === targetStatus);
    const transaction = await prisma.transaksi.findUnique({
      where: { id_transaksi: id },
      include: { status_laundry: true },
    });
    if (!transaction || !target) {
      return Response.json({ error: "Transaksi atau status tidak ditemukan." }, { status: 404 });
    }

    const previousStatus = transaction.status_laundry?.nama_status ?? null;
    const allowedNext: Record<string, string> = {
      Menunggu: "Diproses",
      Diproses: "Selesai",
    };
    if (previousStatus === targetStatus) {
      return Response.json({ message: "Status transaksi tidak berubah." });
    }
    if (
      (previousStatus === null && targetStatus !== "Menunggu") ||
      (previousStatus !== null && allowedNext[previousStatus] !== targetStatus)
    ) {
      return Response.json(
        { error: "Perubahan status harus mengikuti urutan Menunggu → Diproses → Selesai." },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaksi.update({
        where: { id_transaksi: id },
        data: { status_id: target.id_status },
      });
      await tx.riwayat_status.create({
        data: {
          id_transaksi: id,
          status_id: target.id_status,
          status_sebelumnya: previousStatus,
          status_baru: target.nama_status,
          changed_by: authorization.session.userId,
        },
      });
      if (target.nama_status === "Selesai") {
        await tx.notifikasi.create({
          data: {
            id_user: transaction.id_user,
            id_transaksi: id,
            pesan: `Laundry ${transaction.nama_barang} telah selesai dan siap diambil.`,
          },
        });
      }
    });
    return Response.json({ message: "Status laundry berhasil diperbarui." });
  } catch (error) {
    console.error("Gagal memperbarui status laundry:", error);
    return Response.json({ error: "Status laundry gagal diperbarui." }, { status: 500 });
  }
}
