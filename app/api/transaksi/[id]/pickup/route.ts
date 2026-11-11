import { authorizeApiRole } from "@/app/lib/api-auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { ensureLaundryStatuses } from "@/app/api/_lib/erd";

type RouteContext = { params: Promise<{ id: string }> };

function validTransactionCode(value: string) {
  return value.length > 0 && value.length <= 30 && !/[\u0000-\u001f]/.test(value)
    ? value
    : null;
}

export async function POST(_request: Request, { params }: RouteContext) {
  const authorization = await authorizeApiRole("Member");
  if (authorization.response) return authorization.response;
  const { id: rawId } = await params;
  const code = validTransactionCode(rawId);
  if (!code) return Response.json({ error: "ID transaksi tidak valid." }, { status: 400 });

  try {
    const prisma = getPrismaClient();
    const [transaction, statuses] = await Promise.all([
      prisma.transaksi.findFirst({
        where: { Kode_Transaksi: code, ID_Member: authorization.session.userId },
        include: { statusProses: { include: { status: true } } },
      }),
      ensureLaundryStatuses(prisma),
    ]);
    if (!transaction) return Response.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    const current = [...transaction.statusProses].sort(
      (a, b) => b.Waktu_Status.getTime() - a.Waktu_Status.getTime(),
    )[0]?.status.Nama_Status;
    if (current !== "Selesai") {
      return Response.json(
        { error: "Pengambilan hanya dapat diajukan setelah laundry selesai." },
        { status: 409 },
      );
    }
    const waiting = statuses.find(({ Nama_Status }) => Nama_Status === "Menunggu Pengambilan");
    if (!waiting) throw new Error("Status pengambilan belum tersedia.");
    await prisma.status_proses.create({
      data: { Kode_Transaksi: code, ID_Status: waiting.ID_Status },
    });
    return Response.json(
      { message: "Permintaan pengambilan berhasil dikirim ke Kasir." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Gagal mengajukan pengambilan:", error);
    return Response.json({ error: "Permintaan pengambilan gagal disimpan." }, { status: 500 });
  }
}
