import { getSession } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";
import {
  COIN_ADJUSTMENT_PREFIX,
  COINS_PER_FIVE_KG,
  createRecordId,
  DISCOUNT_PERCENT,
  DISCOUNT_REDEMPTION_COINS,
  ensureLaundryStatuses,
  getMemberCoinBalance,
  makeTransactionNote,
  serializeTransaction,
} from "@/app/api/_lib/erd";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEstimate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }
  try {
    const records = await getPrismaClient().transaksi.findMany({
      where: session.role === "Member" ? { ID_Member: session.userId } : undefined,
      orderBy: { Tgl_Jam_Transaksi: "desc" },
      include: {
        member: true,
        statusProses: { include: { status: true } },
      },
    });
    const transactions = records
      .filter((record) => !record.Catatan_Pakaian?.startsWith(COIN_ADJUSTMENT_PREFIX))
      .map(serializeTransaction);
    return Response.json({ transactions });
  } catch (error) {
    console.error("Gagal membaca transaksi:", error);
    return Response.json({ error: "Data transaksi tidak dapat dimuat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }
  if (session.role !== "Kasir") {
    return Response.json({ error: "Hanya Kasir yang dapat membuat transaksi." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format request JSON tidak valid." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return Response.json({ error: "Data transaksi harus berupa objek JSON." }, { status: 400 });
  }

  const memberValue = body.id_user ?? body.ID_Member;
  const memberId = typeof memberValue === "string" ? memberValue.trim() : "";
  const itemName = typeof body.nama_barang === "string" ? body.nama_barang.trim() : "";
  const serviceName = typeof body.jenis_layanan === "string" ? body.jenis_layanan.trim() : "";
  const quantity = body.jumlah === undefined ? 1 : body.jumlah;
  const weightValue = body.berat_kg ?? body.Total_Berat_Kg;
  const weightText = weightValue === undefined || weightValue === null || weightValue === ""
    ? ""
    : String(weightValue);
  const weight = weightText ? Number(weightText) : null;
  const priceValue = body.harga_satuan ?? body.harga_per_kg ?? body.Harga_Per_Kg;
  const priceText = typeof priceValue === "number" || typeof priceValue === "string"
    ? String(priceValue)
    : "";
  const price = /^\d{1,10}$/.test(priceText) ? Number(priceText) : 0;
  const useDiscount = body.gunakan_diskon === true;
  const estimate = parseEstimate(body.estimasi_selesai);
  const noteValue = body.catatan_pakaian ?? body.Catatan_Pakaian;
  const extraNote = typeof noteValue === "string"
    ? noteValue.trim()
    : typeof body.catatan === "string"
      ? body.catatan.trim()
      : "";

  if (!memberId || memberId.length > 20) {
    return Response.json({ error: "Pilih Member yang valid." }, { status: 400 });
  }
  if (itemName && itemName.length > 100) {
    return Response.json(
      { error: "Nama pakaian maksimal 100 karakter." },
      { status: 400 },
    );
  }
  if (serviceName.length > 100 || extraNote.length > 10000) {
    return Response.json({ error: "Jenis layanan atau catatan terlalu panjang." }, { status: 400 });
  }
  if (!Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 2_147_483_647) {
    return Response.json({ error: "Jumlah harus berupa bilangan bulat positif." }, { status: 400 });
  }
  if (
    weight !== null &&
    (!Number.isFinite(weight) || weight <= 0 || weight > 999.99 || !/^\d+(?:\.\d{1,2})?$/.test(weightText))
  ) {
    return Response.json({ error: "Berat harus lebih dari 0 dan maksimal 999.99 kg." }, { status: 400 });
  }
  if (!Number.isSafeInteger(price) || price <= 0 || price > 2_147_483_647) {
    return Response.json({ error: "Harga per kg harus berupa bilangan bulat positif." }, { status: 400 });
  }
  if (estimate === undefined) {
    return Response.json({ error: "Estimasi selesai tidak valid." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  try {
    const [member, statuses] = await Promise.all([
      prisma.member.findUnique({ where: { ID_Member: memberId } }),
      ensureLaundryStatuses(prisma),
    ]);
    if (!member) return Response.json({ error: "Member tidak ditemukan." }, { status: 400 });
    if (useDiscount && await getMemberCoinBalance(prisma, memberId) < DISCOUNT_REDEMPTION_COINS) {
      return Response.json(
        { error: `Diskon ${DISCOUNT_PERCENT}% memerlukan saldo minimal ${DISCOUNT_REDEMPTION_COINS} koin.` },
        { status: 409 },
      );
    }

    const initialStatus = statuses.find(({ Nama_Status }) => Nama_Status === "Menunggu");
    if (!initialStatus) throw new Error("Status awal laundry belum tersedia.");
    const earnedCoins = weight === null
      ? 0
      : Math.floor(weight / 5) * COINS_PER_FIVE_KG;
    const note = itemName
      ? makeTransactionNote({
          name: itemName,
          service: serviceName,
          quantity: Number(quantity),
          note: extraNote,
        })
      : extraNote || null;
    const amount = price * (weight ?? Number(quantity));
    const totalCents = Math.round(
      amount * (useDiscount ? (100 - DISCOUNT_PERCENT) / 100 : 1) * 100,
    );
    if (!Number.isSafeInteger(totalCents)) {
      return Response.json({ error: "Total transaksi terlalu besar." }, { status: 400 });
    }
    const total = totalCents / 100;

    const created = await prisma.$transaction(async (tx) => {
      const currentBalance = await getMemberCoinBalance(tx, memberId);
      if (useDiscount && currentBalance < DISCOUNT_REDEMPTION_COINS) return null;
      const record = await tx.transaksi.create({
        data: {
          Kode_Transaksi: createRecordId("TRX-", 30),
          ID_Member: memberId,
          ID_Kasir: session.userId,
          Total_Berat_Kg: weight,
          Catatan_Pakaian: note,
          Harga_Per_Kg: price,
          Nilai_Per_Koin: 5000,
          Saldo_Koin_Awal: currentBalance,
          Koin_Didapat: earnedCoins,
          Koin_Ditukar: useDiscount ? DISCOUNT_REDEMPTION_COINS : 0,
          Waktu_Notifikasi_Selesai: null,
        },
      });
      await tx.status_proses.create({
        data: {
          Kode_Transaksi: record.Kode_Transaksi,
          ID_Status: initialStatus.ID_Status,
        },
      });
      return record;
    });

    if (!created) {
      return Response.json({ error: "Saldo koin tidak mencukupi untuk diskon." }, { status: 409 });
    }
    const record = await prisma.transaksi.findUniqueOrThrow({
      where: { Kode_Transaksi: created.Kode_Transaksi },
      include: { member: true, statusProses: { include: { status: true } } },
    });
    return Response.json(
      {
        message: "Transaksi berhasil disimpan.",
        transaction: {
          ...serializeTransaction(record),
          total_bayar: total,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Gagal menyimpan transaksi laundry:", error);
    return Response.json(
      { error: "Transaksi gagal disimpan. Periksa konfigurasi server." },
      { status: 500 },
    );
  }
}
