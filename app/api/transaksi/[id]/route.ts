import { authorizeApiRole } from "@/app/lib/api-auth";
import { getPrismaClient } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(value: string) {
  const id = Number(value);
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id) && id <= 2_147_483_647
    ? id
    : null;
}

export async function PATCH(request: Request, { params }: RouteContext) {
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
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Data transaksi harus berupa objek." }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const name = typeof data.nama_barang === "string" ? data.nama_barang.trim() : "";
  const service = typeof data.jenis_layanan === "string" ? data.jenis_layanan.trim() : "";
  const quantity = data.jumlah;
  const weightText = data.berat_kg === undefined || data.berat_kg === null || data.berat_kg === ""
    ? ""
    : String(data.berat_kg);
  const weight = weightText ? Number(weightText) : null;
  const priceText = typeof data.harga_satuan === "number" || typeof data.harga_satuan === "string"
    ? String(data.harga_satuan)
    : "";
  const priceCents = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(priceText)
    ? Math.round(Number(priceText) * 100)
    : 0;
  const estimateText = data.estimasi_selesai;
  const estimate = estimateText === "" || estimateText === null
    ? null
    : typeof estimateText === "string"
      ? new Date(estimateText)
      : undefined;

  if (!name || name.length > 100 || service.length > 100) {
    return Response.json({ error: "Nama pakaian wajib diisi; jenis layanan maksimal 100 karakter." }, { status: 400 });
  }
  if (!Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 2_147_483_647) {
    return Response.json({ error: "Jumlah harus berupa bilangan bulat positif." }, { status: 400 });
  }
  if (weight !== null && (!Number.isFinite(weight) || weight <= 0 || weight > 9999)) {
    return Response.json({ error: "Berat tidak valid." }, { status: 400 });
  }
  if (!priceCents || priceCents > 999_999_999_999 || estimate === undefined || (estimate && Number.isNaN(estimate.getTime()))) {
    return Response.json({ error: "Harga atau estimasi selesai tidak valid." }, { status: 400 });
  }

  const grossCents = Math.round(priceCents * (weight ?? Number(quantity)));
  if (!Number.isSafeInteger(grossCents) || grossCents > 999_999_999_999) {
    return Response.json({ error: "Total transaksi terlalu besar." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const transaction = await prisma.transaksi.findUnique({
      where: { id_transaksi: id },
      select: {
        status_laundry: { select: { nama_status: true } },
        diskon_persen: true,
      },
    });
    if (!transaction) return Response.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    if (transaction.status_laundry?.nama_status === "Sudah Diambil") {
      return Response.json({ error: "Transaksi yang sudah diambil tidak dapat diubah." }, { status: 409 });
    }
    const totalCents = Math.round(
      (grossCents * (100 - transaction.diskon_persen)) / 100,
    );

    await prisma.transaksi.update({
      where: { id_transaksi: id },
      data: {
        nama_barang: name,
        jenis_layanan: service || null,
        jumlah: weight === null ? Number(quantity) : 1,
        berat_kg: weight,
        harga_satuan: (priceCents / 100).toFixed(2),
        total_bayar: (totalCents / 100).toFixed(2),
        estimasi_selesai: estimate,
      },
    });
    return Response.json({ message: "Informasi transaksi berhasil diperbarui." });
  } catch (error) {
    console.error("Gagal memperbarui transaksi:", error);
    return Response.json({ error: "Informasi transaksi gagal diperbarui." }, { status: 500 });
  }
}
