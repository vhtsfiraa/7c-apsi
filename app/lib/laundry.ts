import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@/app/generated/prisma/client";

export const LAUNDRY_STATUSES = [
  { id: "ST-MENUNGGU", name: "Menunggu" },
  { id: "ST-DIPROSES", name: "Diproses" },
  { id: "ST-DICUCI", name: "Dicuci" },
  { id: "ST-DIKERINGKAN", name: "Dikeringkan" },
  { id: "ST-DISETIRIKA", name: "Disetrika" },
  { id: "ST-SELESAI", name: "Selesai" },
  { id: "ST-PICKUP-REQUEST", name: "Menunggu Pengambilan" },
  { id: "ST-DIAMBIL", name: "Sudah Diambil" },
] as const;

export const DISCOUNT_REDEMPTION_COINS = 10;
export const DISCOUNT_PERCENT = 25;
export const COINS_PER_FIVE_KG = 1;
export const VALUE_PER_COIN = 5000;

export function createRecordId(prefix: string, maximumLength: number) {
  const suffixLength = maximumLength - prefix.length;
  if (suffixLength < 8) throw new Error("ID prefix is too long.");
  return `${prefix}${randomBytes(Math.ceil(suffixLength / 2))
    .toString("hex")
    .slice(0, suffixLength)
    .toUpperCase()}`;
}

export async function ensureLaundryStatuses(prisma: PrismaClient) {
  return Promise.all(
    LAUNDRY_STATUSES.map(({ id, name }) =>
      prisma.status.upsert({
        where: { ID_Status: id },
        create: { ID_Status: id, Nama_Status: name },
        update: { Nama_Status: name },
      }),
    ),
  );
}

export async function getMemberCoinBalance(
  prisma: PrismaClient,
  memberId: string,
) {
  const balance = await prisma.transaksi.aggregate({
    where: { ID_Member: memberId },
    _sum: { Koin_Didapat: true, Koin_Ditukar: true },
  });
  return (balance._sum.Koin_Didapat ?? 0) - (balance._sum.Koin_Ditukar ?? 0);
}

export async function getCurrentTransactionStatus(
  prisma: PrismaClient,
  transactionCode: string,
) {
  return prisma.status_proses.findFirst({
    where: { Kode_Transaksi: transactionCode },
    orderBy: { Waktu_Status: "desc" },
    include: { status: true },
  });
}
