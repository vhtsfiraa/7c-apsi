import { getSession } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { serializeTransaction } from "@/app/api/_lib/erd";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }
  try {
    const records = await getPrismaClient().transaksi.findMany({
      where: {
        Waktu_Notifikasi_Selesai: { not: null },
        ...(session.role === "Member" ? { ID_Member: session.userId } : {}),
      },
      orderBy: { Waktu_Notifikasi_Selesai: "desc" },
      include: { member: true, statusProses: { include: { status: true } } },
    });
    const notifications = records.map((record) => {
      const transaction = serializeTransaction(record);
      return {
        id_notifikasi: record.Kode_Transaksi,
        id_transaksi: record.Kode_Transaksi,
        pesan: `Laundry ${transaction.nama_barang} telah selesai dan siap diambil.`,
        dibuat_pada: record.Waktu_Notifikasi_Selesai,
        transaksi: {
          nama_barang: transaction.nama_barang,
          status_laundry: transaction.status_laundry,
        },
      };
    });
    return Response.json({ notifications });
  } catch (error) {
    console.error("Gagal membaca notifikasi:", error);
    return Response.json({ error: "Notifikasi tidak dapat dimuat." }, { status: 500 });
  }
}

export async function PATCH() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }
  return Response.json(
    { error: "Status baca notifikasi tidak tersedia pada skema database saat ini." },
    { status: 409 },
  );
}
