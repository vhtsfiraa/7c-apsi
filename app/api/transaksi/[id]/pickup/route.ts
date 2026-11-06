import { authorizeApiRole } from "@/app/lib/api-auth";
import { getPrismaClient } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(value: string) {
  const id = Number(value);
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id) && id <= 2_147_483_647
    ? id
    : null;
}

export async function POST(_request: Request, { params }: RouteContext) {
  const authorization = await authorizeApiRole("Member");
  if (authorization.response) return authorization.response;
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ error: "ID transaksi tidak valid." }, { status: 400 });

  const prisma = getPrismaClient();
  const transaction = await prisma.transaksi.findFirst({
    where: { id_transaksi: id, id_user: authorization.session.userId },
    select: {
      id_transaksi: true,
      nama_barang: true,
      status_laundry: { select: { nama_status: true } },
      pengambilan: true,
    },
  });
  if (!transaction) return Response.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  if (transaction.status_laundry?.nama_status !== "Selesai") {
    return Response.json({ error: "Pengambilan hanya dapat diajukan setelah laundry selesai." }, { status: 409 });
  }
  if (transaction.pengambilan) {
    return Response.json({ error: "Permintaan pengambilan sudah diajukan." }, { status: 409 });
  }

  try {
    await prisma.pengambilan.create({
      data: {
        id_transaksi: id,
        diminta_oleh: authorization.session.userId,
      },
    });
    return Response.json({ message: "Permintaan pengambilan berhasil dikirim ke Kasir." }, { status: 201 });
  } catch (error) {
    console.error("Gagal mengajukan pengambilan:", error);
    return Response.json({ error: "Permintaan pengambilan gagal disimpan." }, { status: 500 });
  }
}
