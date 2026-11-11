import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@/app/generated/prisma/client";

export const LAUNDRY_STATUSES = [
  { ID_Status: "ST-MENUNGGU", Nama_Status: "Menunggu" },
  { ID_Status: "ST-DIPROSES", Nama_Status: "Diproses" },
  { ID_Status: "ST-DICUCI", Nama_Status: "Dicuci" },
  { ID_Status: "ST-DIKERINGKAN", Nama_Status: "Dikeringkan" },
  { ID_Status: "ST-DISETIRIKA", Nama_Status: "Disetrika" },
  { ID_Status: "ST-SELESAI", Nama_Status: "Selesai" },
  { ID_Status: "ST-MEN-AMBIL", Nama_Status: "Menunggu Pengambilan" },
  { ID_Status: "ST-DIAMBIL", Nama_Status: "Sudah Diambil" },
] as const;

export const DISCOUNT_REDEMPTION_COINS = 10;
export const DISCOUNT_PERCENT = 25;
export const COINS_PER_FIVE_KG = 1;
export const VALUE_PER_COIN = 5000;
export const COIN_ADJUSTMENT_PREFIX = "[PENYESUAIAN_KOIN]";

export function createRecordId(prefix: string, maximumLength: number) {
  const suffixLength = maximumLength - prefix.length;
  return `${prefix}${randomBytes(Math.ceil(suffixLength / 2))
    .toString("hex")
    .slice(0, suffixLength)
    .toUpperCase()}`;
}

export async function ensureLaundryStatuses(
  prisma: Pick<PrismaClient, "status">,
) {
  return Promise.all(
    LAUNDRY_STATUSES.map(({ ID_Status, Nama_Status }) =>
      prisma.status.upsert({
        where: { ID_Status },
        create: { ID_Status, Nama_Status },
        update: {},
      }),
    ),
  );
}

export async function getMemberCoinBalance(
  prisma: Pick<PrismaClient, "transaksi">,
  memberId: string,
) {
  const balance = await prisma.transaksi.aggregate({
    where: { ID_Member: memberId },
    _sum: { Koin_Didapat: true, Koin_Ditukar: true },
  });
  return (balance._sum.Koin_Didapat ?? 0) - (balance._sum.Koin_Ditukar ?? 0);
}

export function makeTransactionNote(input: {
  name: string;
  service?: string;
  quantity?: number;
  note?: string;
}) {
  return [
    `Pakaian: ${input.name}`,
    input.service ? `Layanan: ${input.service}` : "",
    input.quantity !== undefined ? `Jumlah: ${input.quantity}` : "",
    input.note ? `Catatan: ${input.note}` : "",
  ].filter(Boolean).join("\n");
}

export function parseTransactionNote(note: string | null) {
  const text = note ?? "";
  const field = (name: string) =>
    text.match(new RegExp(`^${name}:\\s*(.*)$`, "m"))?.[1] ?? "";
  const name = field("Pakaian");
  if (!name) return { nama_barang: text, jenis_layanan: "", jumlah: 1 };
  const quantity = Number(field("Jumlah"));
  return {
    nama_barang: name,
    jenis_layanan: field("Layanan"),
    jumlah: Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1,
  };
}

export function serializeTransaction(transaction: {
  Kode_Transaksi: string;
  Tgl_Jam_Transaksi: Date;
  ID_Member: string;
  ID_Kasir: string;
  Total_Berat_Kg: unknown;
  Catatan_Pakaian: string | null;
  Harga_Per_Kg: number | null;
  Nilai_Per_Koin: number | null;
  Saldo_Koin_Awal: number | null;
  Koin_Didapat: number | null;
  Koin_Ditukar: number | null;
  Waktu_Notifikasi_Selesai: Date | null;
  member?: { ID_Member: string; Nama_Member: string; No_HP: string | null };
  statusProses: Array<{
    ID_Status: string;
    Waktu_Status: Date;
    status: { ID_Status: string; Nama_Status: string };
  }>;
}) {
  const history = [...transaction.statusProses].sort(
    (a, b) => a.Waktu_Status.getTime() - b.Waktu_Status.getTime(),
  );
  const current = history[history.length - 1];
  const parsed = parseTransactionNote(transaction.Catatan_Pakaian);
  const weight = transaction.Total_Berat_Kg === null
    ? null
    : Number(transaction.Total_Berat_Kg);
  const quantity = parsed.jumlah;
  const isCoinAdjustment = transaction.Catatan_Pakaian?.startsWith(COIN_ADJUSTMENT_PREFIX) ?? false;

  return {
    ...transaction,
    id_transaksi: transaction.Kode_Transaksi,
    tanggal: transaction.Tgl_Jam_Transaksi,
    id_user: transaction.ID_Member,
    created_by: transaction.ID_Kasir,
    nama_barang: isCoinAdjustment ? "Penyesuaian koin" : parsed.nama_barang,
    jenis_layanan: parsed.jenis_layanan,
    jumlah: quantity,
    berat_kg: weight,
    harga_satuan: transaction.Harga_Per_Kg,
    total_bayar: Math.round(
      (transaction.Harga_Per_Kg ?? 0) *
      (weight ?? quantity) *
      (transaction.Koin_Ditukar ? (100 - DISCOUNT_PERCENT) / 100 : 1) *
      100,
    ) / 100,
    diskon_persen: transaction.Koin_Ditukar ? DISCOUNT_PERCENT : 0,
    koin_dipakai: transaction.Koin_Ditukar ?? 0,
    estimasi_selesai: null,
    status_laundry: current
      ? { id_status: current.ID_Status, nama_status: current.status.Nama_Status }
      : null,
    riwayat_status: history.map((entry) => ({
      status_id: entry.ID_Status,
      status_baru: entry.status.Nama_Status,
      berubah_pada: entry.Waktu_Status,
    })),
    users: transaction.member
      ? {
          id_user: transaction.member.ID_Member,
          nama: transaction.member.Nama_Member,
          username: transaction.member.ID_Member,
        }
      : undefined,
    pengambilan: current?.status.Nama_Status === "Menunggu Pengambilan" ||
      current?.status.Nama_Status === "Sudah Diambil"
      ? {
          diminta_pada: history.find(
            (entry) => entry.status.Nama_Status === "Menunggu Pengambilan",
          )?.Waktu_Status ?? null,
          diserahkan_pada: current.status.Nama_Status === "Sudah Diambil"
            ? current.Waktu_Status
            : null,
        }
      : null,
  };
}
