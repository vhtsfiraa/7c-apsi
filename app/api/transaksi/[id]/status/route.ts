import { authorizeApiRole } from "@/app/lib/api-auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { ensureLaundryStatuses } from "@/app/api/_lib/erd";

type RouteContext = { params: Promise<{ id: string }> };
const ALLOWED_NEXT: Record<string, string[]> = {
  Menunggu: ["Diproses"],
  Diproses: ["Dicuci", "Selesai"],
  Dicuci: ["Dikeringkan", "Selesai"],
  Dikeringkan: ["Disetrika", "Selesai"],
  Disetrika: ["Selesai"],
};

function validTransactionCode(value: string) {
  return value.length > 0 && value.length <= 30 && !/[\u0000-\u001f]/.test(value)
    ? value
    : null;
}

export async function POST(request: Request, { params }: RouteContext) {
  const authorization = await authorizeApiRole("Kasir");
  if (authorization.response) return authorization.response;
  const { id: rawId } = await params;
  const code = validTransactionCode(rawId);
  if (!code) return Response.json({ error: "ID transaksi tidak valid." }, { status: 400 });

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
  const targetName = body.nama_status;
  if (!Object.hasOwn(ALLOWED_NEXT, targetName) && targetName !== "Menunggu") {
    return Response.json(
      { error: "Status pengambilan hanya dapat diubah melalui serah terima Kasir." },
      { status: 400 },
    );
  }

  try {
    const prisma = getPrismaClient();
    const [transaction, statuses] = await Promise.all([
      prisma.transaksi.findUnique({
        where: { Kode_Transaksi: code },
        include: { statusProses: { include: { status: true } } },
      }),
      ensureLaundryStatuses(prisma),
    ]);
    if (!transaction) return Response.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    const history = [...transaction.statusProses].sort(
      (a, b) => b.Waktu_Status.getTime() - a.Waktu_Status.getTime(),
    );
    const previousName = history[0]?.status.Nama_Status ?? null;
    if (previousName === targetName) {
      return Response.json({ message: "Status transaksi tidak berubah." });
    }
    const canSetInitial = previousName === null && targetName === "Menunggu";
    if (!canSetInitial && !ALLOWED_NEXT[previousName ?? ""]?.includes(targetName)) {
      return Response.json(
        { error: "Perubahan status harus mengikuti urutan proses laundry." },
        { status: 409 },
      );
    }
    const target = statuses.find(({ Nama_Status }) => Nama_Status === targetName);
    if (!target) return Response.json({ error: "Status tidak ditemukan." }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.status_proses.create({
        data: { Kode_Transaksi: code, ID_Status: target.ID_Status },
      });
      if (targetName === "Selesai") {
        await tx.transaksi.update({
          where: { Kode_Transaksi: code },
          data: { Waktu_Notifikasi_Selesai: new Date() },
        });
      }
    });
    return Response.json({ message: "Status laundry berhasil diperbarui." });
  } catch (error) {
    console.error("Gagal memperbarui status laundry:", error);
    return Response.json({ error: "Status laundry gagal diperbarui." }, { status: 500 });
  }
}
