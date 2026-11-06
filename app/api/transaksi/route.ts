import { getSession, normalizeRole } from "@/app/lib/auth";
import { getPrismaClient } from "@/app/lib/prisma";
import { ensureLaundryStatuses } from "@/app/lib/laundry";
import {
  DISCOUNT_PERCENT,
  DISCOUNT_REDEMPTION_COINS,
} from "@/app/lib/laundry";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrismaError(error: unknown): error is Error & { code: string } {
  return error instanceof Error && "code" in error && typeof error.code === "string";
}

function moneyCents(value: unknown) {
  const text = typeof value === "number" || typeof value === "string" ? String(value) : "";
  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
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
    const transactions = await getPrismaClient().transaksi.findMany({
      where: session.role === "Member" ? { id_user: session.userId } : undefined,
      orderBy: { tanggal: "desc" },
      include: {
        users: { select: { id_user: true, nama: true, username: true } },
        status_laundry: { select: { nama_status: true } },
        riwayat_status: { orderBy: { berubah_pada: "desc" } },
        pengambilan: true,
      },
    });
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

  const memberId = body.id_user;
  const itemName = typeof body.nama_barang === "string" ? body.nama_barang.trim() : "";
  const serviceName = typeof body.jenis_layanan === "string" ? body.jenis_layanan.trim() : "";
  const quantity = body.jumlah === undefined ? 1 : body.jumlah;
  const weightText = body.berat_kg === undefined || body.berat_kg === null || body.berat_kg === ""
    ? ""
    : String(body.berat_kg);
  const weight = weightText ? Number(weightText) : null;
  const unitPriceCents = moneyCents(body.harga_satuan);
  const useDiscount = body.gunakan_diskon === true;
  const estimate = parseEstimate(body.estimasi_selesai);

  if (!Number.isSafeInteger(memberId) || Number(memberId) < 1 || Number(memberId) > 2_147_483_647) {
    return Response.json({ error: "Pilih Member yang valid." }, { status: 400 });
  }
  if (!itemName || itemName.length > 100) {
    return Response.json({ error: "Nama pakaian/paket wajib diisi (maksimal 100 karakter)." }, { status: 400 });
  }
  if (serviceName.length > 100) {
    return Response.json({ error: "Jenis layanan maksimal 100 karakter." }, { status: 400 });
  }
  if (!Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 2_147_483_647) {
    return Response.json({ error: "Jumlah harus berupa bilangan bulat positif." }, { status: 400 });
  }
  if (weight !== null && (!Number.isFinite(weight) || weight <= 0 || weight > 9999)) {
    return Response.json({ error: "Berat harus lebih dari 0 dan maksimal 9999 kg." }, { status: 400 });
  }
  if (unitPriceCents === null) {
    return Response.json({ error: "Harga satuan harus lebih dari 0 dan maksimal 2 angka desimal." }, { status: 400 });
  }
  if (estimate === undefined) {
    return Response.json({ error: "Estimasi selesai tidak valid." }, { status: 400 });
  }

  const billedQuantity = weight ?? Number(quantity);
  const grossTotalCents = Math.round(unitPriceCents * billedQuantity);
  const totalCents = useDiscount
    ? Math.round((grossTotalCents * (100 - DISCOUNT_PERCENT)) / 100)
    : grossTotalCents;
  if (!Number.isSafeInteger(totalCents) || totalCents > 999_999_999_999) {
    return Response.json({ error: "Total transaksi terlalu besar." }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const [member, statuses] = await Promise.all([
      prisma.users.findUnique({
        where: { id_user: Number(memberId) },
        select: { role: true, koin_saldo: true },
      }),
      ensureLaundryStatuses(prisma),
    ]);
    if (!member || normalizeRole(member.role) !== "Member") {
      return Response.json({ error: "Member tidak ditemukan." }, { status: 400 });
    }
    if (useDiscount && member.koin_saldo < DISCOUNT_REDEMPTION_COINS) {
      return Response.json(
        { error: `Diskon ${DISCOUNT_PERCENT}% memerlukan saldo minimal ${DISCOUNT_REDEMPTION_COINS} koin.` },
        { status: 409 },
      );
    }

    const initialStatus = statuses.find((status) => status.nama_status === "Menunggu");
    if (!initialStatus) {
      throw new Error("Status awal laundry belum tersedia.");
    }
    const transaction = await prisma.$transaction(async (tx) => {
      if (useDiscount) {
        const debit = await tx.users.updateMany({
          where: {
            id_user: Number(memberId),
            koin_saldo: { gte: DISCOUNT_REDEMPTION_COINS },
          },
          data: { koin_saldo: { decrement: DISCOUNT_REDEMPTION_COINS } },
        });
        if (debit.count !== 1) return null;
      }

      const created = await tx.transaksi.create({
        data: {
          id_user: Number(memberId),
          created_by: session.userId,
          nama_barang: itemName,
          jenis_layanan: serviceName || null,
          jumlah: weight === null ? Number(quantity) : 1,
          berat_kg: weight,
          harga_satuan: (unitPriceCents / 100).toFixed(2),
          total_bayar: (totalCents / 100).toFixed(2),
          diskon_persen: useDiscount ? DISCOUNT_PERCENT : 0,
          koin_dipakai: useDiscount ? DISCOUNT_REDEMPTION_COINS : 0,
          estimasi_selesai: estimate,
          status_id: initialStatus.id_status,
        },
      });
      await tx.riwayat_status.create({
        data: {
          id_transaksi: created.id_transaksi,
          status_id: initialStatus.id_status,
          status_baru: initialStatus.nama_status,
          changed_by: session.userId,
        },
      });
      if (useDiscount) {
        await tx.riwayat_koin.create({
          data: {
            id_user: Number(memberId),
            id_kasir: session.userId,
            id_transaksi: created.id_transaksi,
            jumlah: -DISCOUNT_REDEMPTION_COINS,
            keterangan: `Penukaran ${DISCOUNT_REDEMPTION_COINS} koin untuk diskon transaksi ${DISCOUNT_PERCENT}%.`,
          },
        });
      }
      return created;
    });

    if (!transaction) {
      return Response.json(
        { error: "Saldo koin tidak mencukupi untuk diskon." },
        { status: 409 },
      );
    }
    return Response.json(
      { message: "Transaksi berhasil disimpan.", transaction },
      { status: 201 },
    );
  } catch (error) {
    if (isPrismaError(error) && (error.code === "P2025" || error.code === "P2003")) {
      return Response.json({ error: "Member tidak ditemukan." }, { status: 400 });
    }
    console.error("Gagal menyimpan transaksi laundry:", error);
    return Response.json({ error: "Transaksi gagal disimpan. Periksa konfigurasi server." }, { status: 500 });
  }
}
