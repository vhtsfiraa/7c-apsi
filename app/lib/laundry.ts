import type { PrismaClient } from "@/app/generated/prisma/client";

export const LAUNDRY_STATUSES = [
  "Menunggu",
  "Diproses",
  "Selesai",
  "Sudah Diambil",
] as const;

export const DISCOUNT_REDEMPTION_COINS = 10;
export const DISCOUNT_PERCENT = 25;
export const COINS_PER_FIVE_KG = 1;

export async function ensureLaundryStatuses(prisma: PrismaClient) {
  return Promise.all(
    LAUNDRY_STATUSES.map((nama_status) =>
      prisma.status_laundry.upsert({
        where: { nama_status },
        create: { nama_status },
        update: {},
      }),
    ),
  );
}
