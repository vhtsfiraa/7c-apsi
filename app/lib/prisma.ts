import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  jobLaundryPrisma?: PrismaClient;
};

export function getPrismaClient() {
  if (globalForPrisma.jobLaundryPrisma) {
    return globalForPrisma.jobLaundryPrisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum dikonfigurasi.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  globalForPrisma.jobLaundryPrisma = prisma;

  return prisma;
}
