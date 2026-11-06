import { getSession } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  try {
    const notifications = await getPrismaClient().notifikasi.findMany({
      where: session.role === "Member" ? { id_user: session.userId } : undefined,
      orderBy: { dibuat_pada: "desc" },
      include: {
        transaksi: {
          select: {
            nama_barang: true,
            status_laundry: { select: { nama_status: true } },
          },
        },
      },
    });
    return Response.json({ notifications });
  } catch (error) {
    console.error("Gagal membaca notifikasi:", error);
    return Response.json({ error: "Notifikasi tidak dapat dimuat." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (session.role !== "Member") {
    return Response.json({ error: "Hanya Member yang dapat mengubah status baca notifikasinya." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format request tidak valid." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("id_notifikasi" in body) ||
    !Number.isSafeInteger(body.id_notifikasi) ||
    Number(body.id_notifikasi) <= 0
  ) {
    return Response.json({ error: "ID notifikasi tidak valid." }, { status: 400 });
  }

  try {
    const updated = await getPrismaClient().notifikasi.updateMany({
      where: {
        id_notifikasi: Number(body.id_notifikasi),
        id_user: session.userId,
        dibaca_pada: null,
      },
      data: { dibaca_pada: new Date() },
    });
    if (!updated.count) {
      return Response.json({ error: "Notifikasi tidak ditemukan atau sudah dibaca." }, { status: 404 });
    }
    return Response.json({ message: "Notifikasi ditandai telah dibaca." });
  } catch (error) {
    console.error("Gagal menandai notifikasi:", error);
    return Response.json({ error: "Notifikasi gagal diperbarui." }, { status: 500 });
  }
}
