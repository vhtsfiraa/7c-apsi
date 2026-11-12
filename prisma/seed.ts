import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function parseTimestamp(value: string) {
  return new Date(`${value.replace(" ", "T")}Z`);
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
    const members = [
      {
        ID_Member: "MBR-015",
        Nama_Member: "Putri",
        No_HP: "0813-1584-1308",
        Gender_Member: "Perempuan",
        Tgl_Daftar: parseDate("2026-09-09"),
      },
      {
        ID_Member: "MBR-006",
        Nama_Member: "Ilham",
        No_HP: "0813-9814-2744",
        Gender_Member: "Laki-laki",
        Tgl_Daftar: parseDate("2026-09-10"),
      },
      {
        ID_Member: "MBR-030",
        Nama_Member: "Farhan",
        No_HP: "0811-7920-7554",
        Gender_Member: "Laki-laki",
        Tgl_Daftar: parseDate("2026-09-10"),
      },
      {
        ID_Member: "MBR-004",
        Nama_Member: "Faiz",
        No_HP: "0853-4140-2177",
        Gender_Member: "Laki-laki",
        Tgl_Daftar: parseDate("2026-09-11"),
      },
      {
        ID_Member: "MBR-037",
        Nama_Member: "Oca",
        No_HP: "0878-2755-7953",
        Gender_Member: "Perempuan",
        Tgl_Daftar: parseDate("2026-09-11"),
      },
    ];

    const employees = [
      { ID_Pegawai: "PGW-01", Nama_Pegawai: "Zahra", Peran: "Kasir" },
      { ID_Pegawai: "PGW-02", Nama_Pegawai: "Berlin", Peran: "Kasir" },
      { ID_Pegawai: "PGW-03", Nama_Pegawai: "Verra", Peran: "Supervisor" },
      { ID_Pegawai: "PGW-04", Nama_Pegawai: "Yeni", Peran: "Supervisor" },
    ];

    const users = [
      {
        ID_User: "USR-01",
        ID_Pegawai: "PGW-01",
        Username: "zahra",
        Password_Hash: hashPassword("kasir"),
        Role: "Kasir",
      },
      {
        ID_User: "USR-02",
        ID_Pegawai: "PGW-02",
        Username: "berlin",
        Password_Hash: hashPassword("kasir"),
        Role: "Kasir",
      },
      {
        ID_User: "USR-03",
        ID_Pegawai: "PGW-03",
        Username: "verra",
        Password_Hash: hashPassword("supervisor"),
        Role: "Supervisor",
      },
      {
        ID_User: "USR-04",
        ID_Pegawai: "PGW-04",
        Username: "yeni",
        Password_Hash: hashPassword("supervisor"),
        Role: "Supervisor",
      },
    ];

    const statuses = [
      { ID_Status: "ST-1", Nama_Status: "Diterima" },
      { ID_Status: "ST-2", Nama_Status: "Diproses" },
      { ID_Status: "ST-3", Nama_Status: "Selesai" },
    ];

    const transactions = [
      {
        Kode_Transaksi: "TRX-260910-001",
        Tgl_Jam_Transaksi: parseTimestamp("2026-09-10 15:00:00"),
        ID_Member: "MBR-015",
        ID_Kasir: "PGW-02",
        ID_Supervisor: "PGW-03",
        Total_Berat_Kg: 6.5,
        Catatan_Pakaian: "Pisahkan kain warna putih",
        Harga_Per_Kg: 8000,
        Nilai_Per_Koin: 1000,
        Saldo_Koin_Awal: 1,
        Koin_Didapat: 1,
        Koin_Ditukar: 0,
        Waktu_Notifikasi_Selesai: parseTimestamp("2026-09-12 10:05:00"),
      },
      {
        Kode_Transaksi: "TRX-260910-002",
        Tgl_Jam_Transaksi: parseTimestamp("2026-09-10 15:15:00"),
        ID_Member: "MBR-006",
        ID_Kasir: "PGW-01",
        ID_Supervisor: "PGW-04",
        Total_Berat_Kg: 9.5,
        Catatan_Pakaian: "Jangan beri terlalu banyak pewangi",
        Harga_Per_Kg: 8000,
        Nilai_Per_Koin: 1000,
        Saldo_Koin_Awal: 18,
        Koin_Didapat: 1,
        Koin_Ditukar: 0,
        Waktu_Notifikasi_Selesai: parseTimestamp("2026-09-12 09:05:00"),
      },
      {
        Kode_Transaksi: "TRX-260911-001",
        Tgl_Jam_Transaksi: parseTimestamp("2026-09-11 08:40:00"),
        ID_Member: "MBR-030",
        ID_Kasir: "PGW-01",
        ID_Supervisor: "PGW-04",
        Total_Berat_Kg: 4.5,
        Catatan_Pakaian: "Jaket jangan keringkan terlalu panas",
        Harga_Per_Kg: 8000,
        Nilai_Per_Koin: 1000,
        Saldo_Koin_Awal: 7,
        Koin_Didapat: 0,
        Koin_Ditukar: 0,
        Waktu_Notifikasi_Selesai: parseTimestamp("2026-09-13 08:15:00"),
      },
      {
        Kode_Transaksi: "TRX-260911-002",
        Tgl_Jam_Transaksi: parseTimestamp("2026-09-11 12:50:00"),
        ID_Member: "MBR-004",
        ID_Kasir: "PGW-02",
        ID_Supervisor: "PGW-03",
        Total_Berat_Kg: 8.5,
        Catatan_Pakaian: "-",
        Harga_Per_Kg: 8000,
        Nilai_Per_Koin: 1000,
        Saldo_Koin_Awal: 11,
        Koin_Didapat: 1,
        Koin_Ditukar: 0,
        Waktu_Notifikasi_Selesai: parseTimestamp("2026-09-13 09:05:00"),
      },
      {
        Kode_Transaksi: "TRX-260911-003",
        Tgl_Jam_Transaksi: parseTimestamp("2026-09-11 13:00:00"),
        ID_Member: "MBR-037",
        ID_Kasir: "PGW-01",
        ID_Supervisor: "PGW-04",
        Total_Berat_Kg: 7.5,
        Catatan_Pakaian: "-",
        Harga_Per_Kg: 8000,
        Nilai_Per_Koin: 1000,
        Saldo_Koin_Awal: 0,
        Koin_Didapat: 1,
        Koin_Ditukar: 1,
        Waktu_Notifikasi_Selesai: parseTimestamp("2026-09-13 08:50:00"),
      },
    ];

    const processStatuses = [
      ["TRX-260910-001", "ST-1", "2026-09-10 20:00:00"],
      ["TRX-260910-001", "ST-2", "2026-09-11 08:30:00"],
      ["TRX-260910-001", "ST-3", "2026-09-12 09:00:00"],
      ["TRX-260910-002", "ST-1", "2026-09-10 19:15:00"],
      ["TRX-260910-002", "ST-2", "2026-09-11 08:20:00"],
      ["TRX-260910-002", "ST-3", "2026-09-12 08:10:00"],
      ["TRX-260911-001", "ST-1", "2026-09-11 13:40:00"],
      ["TRX-260911-001", "ST-2", "2026-09-12 08:10:00"],
      ["TRX-260911-001", "ST-3", "2026-09-13 08:00:00"],
      ["TRX-260911-002", "ST-1", "2026-09-11 17:50:00"],
      ["TRX-260911-002", "ST-2", "2026-09-12 08:30:00"],
      ["TRX-260911-002", "ST-3", "2026-09-13 08:10:00"],
      ["TRX-260911-003", "ST-1", "2026-09-11 17:00:00"],
      ["TRX-260911-003", "ST-2", "2026-09-12 08:20:00"],
      ["TRX-260911-003", "ST-3", "2026-09-13 08:20:00"],
    ].map(([Kode_Transaksi, ID_Status, Waktu_Status]) => ({
      Kode_Transaksi,
      ID_Status,
      Waktu_Status: parseTimestamp(Waktu_Status),
    }));

    await prisma.$transaction(
      async (tx) => {
        await tx.status_proses.deleteMany();
        await tx.transaksi.deleteMany();
        await tx.users.deleteMany();
        await tx.member.deleteMany();
        await tx.pegawai.deleteMany();
        await tx.status.deleteMany();

        await tx.member.createMany({ data: members });
        await tx.pegawai.createMany({ data: employees });
        await tx.status.createMany({ data: statuses });
        await tx.users.createMany({ data: users });
        await tx.transaksi.createMany({ data: transactions });
        await tx.status_proses.createMany({ data: processStatuses });
      },
      { maxWait: 30_000, timeout: 60_000 },
    );

    console.info("Data 3NF berhasil disiapkan.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Seeder gagal dijalankan:", error);
  process.exitCode = 1;
});
