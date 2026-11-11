import { authorizeApiRole } from "@/app/lib/api-auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { ensureLaundryStatuses } from "@/app/api/_lib/erd";

type RouteContext = { params: Promise<{ id: string }> };

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
    return Response.json({ error: "Format request tidak valid." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("identityVerified" in body) ||
    body.identityVerified !== true
  ) {
    return Response.json(
      { error: "Kasir harus mengonfirmasi verifikasi identitas Member." },
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
    const current = [...transaction.statusProses].sort(
      (a, b) => b.Waktu_Status.getTime() - a.Waktu_Status.getTime(),
    )[0]?.status.Nama_Status;
    if (current !== "Menunggu Pengambilan") {
      return Response.json(
        { error: current === "Sudah Diambil" ? "Pakaian sudah diserahterimakan." : "Member belum mengajukan pengambilan." },
        { status: 409 },
      );
    }
    const pickedUp = statuses.find(({ Nama_Status }) => Nama_Status === "Sudah Diambil");
    if (!pickedUp) throw new Error("Status pengambilan belum tersedia.");
    await prisma.status_proses.create({
      data: { Kode_Transaksi: code, ID_Status: pickedUp.ID_Status },
    });
    return Response.json({ message: "Serah terima berhasil dicatat." });
  } catch (error) {
    console.error("Gagal menyelesaikan serah terima:", error);
    return Response.json({ error: "Serah terima gagal dicatat." }, { status: 500 });
  }
}
