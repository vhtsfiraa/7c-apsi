import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const cashierId = "PGW01";
const cashierUsername = "kasir";
const cashierPassword = "kasir";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum dikonfigurasi.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const passwordHash = hashPassword(cashierPassword);
    const today = new Date();
    const registrationDate = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
    );

    const accountWithId = await prisma.users.findUnique({
      where: { ID_User: "USR01" },
    });
    if (accountWithId && accountWithId.Username !== cashierUsername) {
      throw new Error(
        "USR01 sudah dipakai akun lain; data pengguna tidak diubah.",
      );
    }

    const accountForCashier = await prisma.users.findUnique({
      where: { ID_Pegawai: cashierId },
    });
    if (accountForCashier && accountForCashier.Username !== cashierUsername) {
      throw new Error(
        "PGW01 sudah terhubung ke akun lain; data pengguna tidak diubah.",
      );
    }

    const accountByUsername = await prisma.users.findUnique({
      where: { Username: cashierUsername },
    });
    const accountData = {
      ID_User: "USR01",
      ID_Pegawai: cashierId,
      Username: cashierUsername,
      Password_Hash: passwordHash,
      Role: "Kasir",
    };

    await prisma.pegawai.upsert({
      where: { ID_Pegawai: cashierId },
      create: {
        ID_Pegawai: cashierId,
        Nama_Pegawai: "Kasir Demo",
        Peran: "Kasir",
      },
      update: {
        Nama_Pegawai: "Kasir Demo",
        Peran: "Kasir",
      },
    });

    if (accountByUsername && accountByUsername.ID_User !== "USR01") {
      await prisma.users.update({
        where: { Username: cashierUsername },
        data: accountData,
      });
    } else {
      await prisma.users.upsert({
        where: { ID_User: "USR01" },
        create: accountData,
        update: {
          ID_Pegawai: cashierId,
          Username: cashierUsername,
          Password_Hash: passwordHash,
          Role: "Kasir",
        },
      });
    }

    await prisma.member.upsert({
      where: { ID_Member: "MBR01" },
      create: {
        ID_Member: "MBR01",
        Nama_Member: "Member Demo",
        No_HP: "08123456789",
        Gender_Member: "Laki-laki",
        Tgl_Daftar: registrationDate,
      },
      update: {
        Nama_Member: "Member Demo",
        No_HP: "08123456789",
        Gender_Member: "Laki-laki",
        Tgl_Daftar: registrationDate,
      },
    });

    console.info("Data demo Kasir dan Member berhasil disiapkan.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Seeder gagal dijalankan:", error);
  process.exitCode = 1;
});
