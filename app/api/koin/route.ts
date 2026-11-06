import { getSession, normalizeRole } from "@/app/lib/auth";
import { COINS_PER_FIVE_KG } from "@/app/lib/laundry";
import { getPrismaClient } from "@/app/lib/prisma";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const url = new URL(request.url);
  const requestedId = Number(url.searchParams.get("memberId"));
  const memberId = session.role === "Member" ? session.userId : requestedId;
  if (!Number.isSafeInteger(memberId) || memberId <= 0) {
    return Response.json({ error: "Pilih Member yang valid." }, { status: 400 });
  }
  if (session.role === "Kasir" && !url.searchParams.has("memberId")) {
    return Response.json({ error: "ID Member diperlukan." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const member = await prisma.users.findUnique({
      where: { id_user: memberId },
      select: { role: true, koin_saldo: true },
    });
    if (!member || normalizeRole(member.role) !== "Member") {
      return Response.json({ error: "Member tidak ditemukan." }, { status: 404 });
    }
    const history = await prisma.riwayat_koin.findMany({
      where: { id_user: memberId },
      orderBy: { dibuat_pada: "desc" },
      select: {
        id_riwayat_koin: true,
        jumlah: true,
        keterangan: true,
        dibuat_pada: true,
      },
    });
    return Response.json({ balance: member.koin_saldo, history });
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
  const memberId = body.id_user;
  if (!Number.isSafeInteger(memberId) || Number(memberId) <= 0) {
    return Response.json({ error: "Pilih Member yang valid." }, { status: 400 });
  }
  const prisma = getPrismaClient();
  const member = await prisma.users.findUnique({
    where: { id_user: Number(memberId) },
    select: { role: true },
  });
  if (!member || normalizeRole(member.role) !== "Member") {
    return Response.json({ error: "Member tidak ditemukan." }, { status: 404 });
  }

  if (body.operation === "earn") {
    const weight = typeof body.berat_kg === "number" ? body.berat_kg : Number(body.berat_kg);
    if (!Number.isFinite(weight) || weight < 5 || weight > 9999) {
      return Response.json({ error: "Berat minimal 5 kg dan maksimal 9999 kg." }, { status: 400 });
    }
    const coins = Math.floor(weight / 5) * COINS_PER_FIVE_KG;
    try {
      const balance = await prisma.$transaction(async (tx) => {
        await tx.users.update({
          where: { id_user: Number(memberId) },
          data: { koin_saldo: { increment: coins } },
        });
        await tx.riwayat_koin.create({
          data: {
            id_user: Number(memberId),
            id_kasir: session.userId,
            jumlah: coins,
            keterangan: `Koin laundry ${weight} kg (1 koin per 5 kg penuh).`,
          },
        });
        const updated = await tx.users.findUniqueOrThrow({
          where: { id_user: Number(memberId) },
          select: { koin_saldo: true },
        });
        return updated.koin_saldo;
      });
      return Response.json({ message: `${coins} koin berhasil ditambahkan.`, balance });
    } catch (error) {
      console.error("Gagal menambahkan koin:", error);
      return Response.json({ error: "Koin gagal ditambahkan." }, { status: 500 });
    }
  }

  if (body.operation === "redeem") {
    const coins = body.jumlah;
    if (!Number.isSafeInteger(coins) || Number(coins) <= 0 || Number(coins) > 2_147_483_647) {
      return Response.json({ error: "Jumlah penukaran harus berupa bilangan bulat positif." }, { status: 400 });
    }
    try {
      const balance = await prisma.$transaction(async (tx) => {
        const debit = await tx.users.updateMany({
          where: {
            id_user: Number(memberId),
            role: { equals: "Member", mode: "insensitive" },
            koin_saldo: { gte: Number(coins) },
          },
          data: { koin_saldo: { decrement: Number(coins) } },
        });
        if (debit.count !== 1) return null;
        await tx.riwayat_koin.create({
          data: {
            id_user: Number(memberId),
            id_kasir: session.userId,
            jumlah: -Number(coins),
            keterangan: "Penukaran koin oleh Kasir.",
          },
        });
        const updated = await tx.users.findUniqueOrThrow({
          where: { id_user: Number(memberId) },
          select: { koin_saldo: true },
        });
        return updated.koin_saldo;
      });
      if (balance === null) {
        return Response.json({ error: "Saldo koin tidak mencukupi." }, { status: 409 });
      }
      return Response.json({ message: "Penukaran koin berhasil.", balance });
    } catch (error) {
      console.error("Gagal memproses penukaran koin:", error);
      return Response.json({ error: "Penukaran koin gagal diproses." }, { status: 500 });
    }
  }

  return Response.json({ error: "Operasi koin tidak dikenal." }, { status: 400 });
}
