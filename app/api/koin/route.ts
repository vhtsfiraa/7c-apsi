import { getSession } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";
import {
  COIN_ADJUSTMENT_PREFIX,
  COINS_PER_FIVE_KG,
  createRecordId,
  getMemberCoinBalance,
  VALUE_PER_COIN,
} from "@/app/api/_lib/erd";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validMemberId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 20;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const url = new URL(request.url);
  const memberId = session.role === "Member"
    ? session.userId
    : url.searchParams.get("memberId") ?? url.searchParams.get("ID_Member");
  if (session.role === "Kasir" && !url.searchParams.has("memberId")) {
    return Response.json({ error: "ID Member diperlukan." }, { status: 400 });
  }
  if (!validMemberId(memberId)) {
    return Response.json({ error: "Pilih Member yang valid." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const member = await prisma.member.findUnique({
      where: { ID_Member: memberId },
      select: { ID_Member: true },
    });
    if (!member) return Response.json({ error: "Member tidak ditemukan." }, { status: 404 });
    const [balance, entries] = await Promise.all([
      getMemberCoinBalance(prisma, memberId),
      prisma.transaksi.findMany({
        where: {
          ID_Member: memberId,
          OR: [{ Koin_Didapat: { gt: 0 } }, { Koin_Ditukar: { gt: 0 } }],
        },
        orderBy: { Tgl_Jam_Transaksi: "desc" },
      }),
    ]);
    const history = entries.map((entry) => ({
      id_riwayat_koin: entry.Kode_Transaksi,
      jumlah: (entry.Koin_Didapat ?? 0) - (entry.Koin_Ditukar ?? 0),
      keterangan: entry.Catatan_Pakaian,
      dibuat_pada: entry.Tgl_Jam_Transaksi,
    }));
    return Response.json({ balance, history });
  } catch (error) {
    console.error("Gagal membaca saldo dan riwayat koin:", error);
    return Response.json({ error: "Informasi koin tidak dapat dimuat." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (session.role !== "Kasir") {
    return Response.json({ error: "Hanya Kasir yang dapat mengelola koin." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format request JSON tidak valid." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return Response.json({ error: "Data koin harus berupa objek." }, { status: 400 });
  }
  const memberId = body.id_user ?? body.ID_Member;
  if (!validMemberId(memberId)) {
    return Response.json({ error: "Pilih Member yang valid." }, { status: 400 });
  }

  const operation = body.operation;
  let coins: number;
  let note: string;
  if (operation === "earn") {
    const weightValue = body.berat_kg ?? body.Total_Berat_Kg;
    const weight = typeof weightValue === "number" ? weightValue : Number(weightValue);
    if (!Number.isFinite(weight) || weight < 5 || weight > 999.99) {
      return Response.json({ error: "Berat minimal 5 kg dan maksimal 999.99 kg." }, { status: 400 });
    }
    coins = Math.floor(weight / 5) * COINS_PER_FIVE_KG;
    note = `${COIN_ADJUSTMENT_PREFIX} Penyesuaian manual: +${coins} koin untuk ${weight} kg.`;
  } else if (operation === "redeem") {
    coins = typeof body.jumlah === "number" ? body.jumlah : Number(body.jumlah);
    if (!Number.isSafeInteger(coins) || coins <= 0 || coins > 2_147_483_647) {
      return Response.json(
        { error: "Jumlah penukaran harus berupa bilangan bulat positif." },
        { status: 400 },
      );
    }
    note = `${COIN_ADJUSTMENT_PREFIX} Penukaran manual: -${coins} koin oleh Kasir.`;
  } else {
    return Response.json({ error: "Operasi koin tidak dikenal." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const member = await prisma.member.findUnique({
      where: { ID_Member: memberId },
      select: { ID_Member: true },
    });
    if (!member) return Response.json({ error: "Member tidak ditemukan." }, { status: 404 });

    const balance = await prisma.$transaction(async (tx) => {
      const currentBalance = await getMemberCoinBalance(tx, memberId);
      if (operation === "redeem" && currentBalance < coins) return null;
      await tx.transaksi.create({
        data: {
          Kode_Transaksi: createRecordId("KOIN-", 30),
          ID_Member: memberId,
          ID_Kasir: session.userId,
          Total_Berat_Kg: 0,
          Catatan_Pakaian: note,
          Harga_Per_Kg: 0,
          Nilai_Per_Koin: VALUE_PER_COIN,
          Saldo_Koin_Awal: currentBalance,
          Koin_Didapat: operation === "earn" ? coins : 0,
          Koin_Ditukar: operation === "redeem" ? coins : 0,
        },
      });
      return currentBalance + (operation === "earn" ? coins : -coins);
    }, { isolationLevel: "Serializable" });

    if (balance === null) {
      return Response.json({ error: "Saldo koin tidak mencukupi." }, { status: 409 });
    }
    return Response.json({
      message: operation === "earn"
        ? `${coins} koin berhasil ditambahkan.`
        : "Penukaran koin berhasil.",
      balance,
    });
  } catch (error) {
    console.error("Gagal memproses koin:", error);
    return Response.json({ error: "Koin gagal diproses." }, { status: 500 });
  }
}
