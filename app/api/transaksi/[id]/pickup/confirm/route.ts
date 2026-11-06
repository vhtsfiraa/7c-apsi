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
    return Response.json({ error: "Format request tidak valid." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("identityVerified" in body) ||
    body.identityVerified !== true
  ) {
    return Response.json({ error: "Kasir harus mengonfirmasi verifikasi identitas Member." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const statuses = await ensureLaundryStatuses(prisma);
    const complete = statuses.find((status) => status.nama_status === "Selesai");
    const pickedUp = statuses.find((status) => status.nama_status === "Sudah Diambil");
    if (!complete || !pickedUp) throw new Error("Status pengambilan belum tersedia.");

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaksi.findUnique({
        where: { id_transaksi: id },
        include: { pengambilan: true, status_laundry: true },
      });
      if (!transaction) return { error: "Transaksi tidak ditemukan.", status: 404 };
      if (transaction.status_laundry?.nama_status !== "Selesai") {
        return { error: "Laundry belum selesai dan tidak dapat diserahkan.", status: 409 };
      }
      if (!transaction.pengambilan) {
        return { error: "Member belum mengajukan pengambilan.", status: 409 };
      }
      if (transaction.pengambilan.diserahkan_pada) {
        return { error: "Pakaian sudah diserahterimakan.", status: 409 };
      }

      await tx.transaksi.update({
        where: { id_transaksi: id },
        data: { status_id: pickedUp.id_status },
      });
      await tx.riwayat_status.create({
        data: {
          id_transaksi: id,
          status_id: pickedUp.id_status,
          status_sebelumnya: complete.nama_status,
          status_baru: pickedUp.nama_status,
          changed_by: authorization.session.userId,
        },
      });
      await tx.pengambilan.update({
        where: { id_transaksi: id },
        data: {
          diproses_oleh: authorization.session.userId,
          diserahkan_pada: new Date(),
        },
      });
      return { status: 200 };
    });

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({ message: "Serah terima berhasil dicatat." });
  } catch (error) {
    console.error("Gagal menyelesaikan serah terima:", error);
    return Response.json({ error: "Serah terima gagal dicatat." }, { status: 500 });
  }
}
