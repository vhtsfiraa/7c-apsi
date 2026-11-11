import { authorizeApiRole } from "@/app/lib/api-auth";
import { getSession } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";
import {
  makeTransactionNote,
  parseTransactionNote,
  serializeTransaction,
} from "@/app/api/_lib/erd";

type RouteContext = { params: Promise<{ id: string }> };

function validTransactionCode(value: string) {
  return value.length > 0 && value.length <= 30 && !/[\u0000-\u001f]/.test(value)
    ? value
    : null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }
  const { id: rawId } = await params;
  const code = validTransactionCode(rawId);
  if (!code) return Response.json({ error: "ID transaksi tidak valid." }, { status: 400 });

  try {
    const transaction = await getPrismaClient().transaksi.findUnique({
      where: { Kode_Transaksi: code },
      include: { member: true, statusProses: { include: { status: true } } },
    });
    if (!transaction) return Response.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    if (session.role === "Member" && transaction.ID_Member !== session.userId) {
      return Response.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    }
    return Response.json({ transaction: serializeTransaction(transaction) });
  } catch (error) {
    console.error("Gagal membaca transaksi:", error);
    return Response.json({ error: "Data transaksi tidak dapat dimuat." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
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
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Data transaksi harus berupa objek." }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const name = typeof data.nama_barang === "string" ? data.nama_barang.trim() : "";
  const service = typeof data.jenis_layanan === "string" ? data.jenis_layanan.trim() : "";
  const weightValue = data.berat_kg ?? data.Total_Berat_Kg;
  const weightText = weightValue === undefined || weightValue === null || weightValue === ""
    ? ""
    : String(weightValue);
  const weight = weightText ? Number(weightText) : null;
  const priceValue = data.harga_satuan ?? data.Harga_Per_Kg;
  const priceText = typeof priceValue === "number" || typeof priceValue === "string"
    ? String(priceValue)
    : "";
  const price = /^\d{1,10}$/.test(priceText) ? Number(priceText) : 0;
  const noteValue = data.catatan_pakaian ?? data.Catatan_Pakaian;
  const extraNote = typeof noteValue === "string"
    ? noteValue.trim()
    : "";

  if ((name && name.length > 100) || service.length > 100 || extraNote.length > 10000) {
    return Response.json(
      { error: "Nama pakaian atau jenis layanan tidak valid; catatan maksimal 10000 karakter." },
      { status: 400 },
    );
  }
  if (
    weight !== null &&
    (!Number.isFinite(weight) || weight <= 0 || weight > 999.99 || !/^\d+(?:\.\d{1,2})?$/.test(weightText))
  ) {
    return Response.json({ error: "Berat tidak valid." }, { status: 400 });
  }
  if (!Number.isSafeInteger(price) || price <= 0 || price > 2_147_483_647) {
    return Response.json({ error: "Harga per kg tidak valid." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const transaction = await prisma.transaksi.findUnique({
      where: { Kode_Transaksi: code },
      include: { statusProses: { include: { status: true } } },
    });
    if (!transaction) return Response.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    const currentStatus = [...transaction.statusProses]
      .sort((a, b) => b.Waktu_Status.getTime() - a.Waktu_Status.getTime())[0]
      ?.status.Nama_Status;
    if (currentStatus === "Sudah Diambil" || currentStatus === "Menunggu Pengambilan") {
      return Response.json({ error: "Transaksi yang menunggu atau sudah diambil tidak dapat diubah." }, { status: 409 });
    }

    const oldNote = parseTransactionNote(transaction.Catatan_Pakaian);
    const quantityValue = data.jumlah ?? oldNote.jumlah;
    if (
      !Number.isSafeInteger(quantityValue) ||
      Number(quantityValue) < 1 ||
      Number(quantityValue) > 2_147_483_647
    ) {
      return Response.json({ error: "Jumlah harus berupa bilangan bulat positif." }, { status: 400 });
    }
    const note = name
      ? makeTransactionNote({
          name,
          service: service || oldNote.jenis_layanan,
          quantity: Number(quantityValue),
          note: extraNote || undefined,
        })
      : extraNote || null;
    await prisma.transaksi.update({
      where: { Kode_Transaksi: code },
      data: {
        Catatan_Pakaian: note,
        Total_Berat_Kg: weight,
        Harga_Per_Kg: price,
      },
    });
    return Response.json({ message: "Informasi transaksi berhasil diperbarui." });
  } catch (error) {
    console.error("Gagal memperbarui transaksi:", error);
    return Response.json({ error: "Informasi transaksi gagal diperbarui." }, { status: 500 });
  }
}
