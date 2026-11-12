-- ==========================================================
-- DATABASE JOB LAUNDRY (SESUAI NORMALISASI 3NF KELOMPOK 7C)
-- ==========================================================

-- 1. Bersihkan tabel lama jika sudah ada
DROP TABLE IF EXISTS "STATUS_PROSES" CASCADE;
DROP TABLE IF EXISTS "TRANSAKSI" CASCADE;
DROP TABLE IF EXISTS "STATUS" CASCADE;
DROP TABLE IF EXISTS "USERS" CASCADE;
DROP TABLE IF EXISTS "PEGAWAI" CASCADE;
DROP TABLE IF EXISTS "MEMBER" CASCADE;

-- 2. Pembuatan Struktur Tabel (DDL)
CREATE TABLE "MEMBER" (
    "ID_Member" VARCHAR(20) PRIMARY KEY,
    "Nama_Member" VARCHAR(100) NOT NULL,
    "No_HP" VARCHAR(20) NOT NULL,
    "Gender_Member" VARCHAR(20) NOT NULL,
    "Tgl_Daftar" DATE NOT NULL
);

CREATE TABLE "PEGAWAI" (
    "ID_Pegawai" VARCHAR(20) PRIMARY KEY,
    "Nama_Pegawai" VARCHAR(100) NOT NULL,
    "Peran" VARCHAR(50) NOT NULL
);

CREATE TABLE "USERS" (
    "ID_User" VARCHAR(20) PRIMARY KEY,
    "ID_Pegawai" VARCHAR(20) NOT NULL,
    "Username" VARCHAR(50) UNIQUE NOT NULL,
    "Password_Hash" VARCHAR(255) NOT NULL,
    "Role" VARCHAR(50) NOT NULL,
    CONSTRAINT "fk_users_pegawai" FOREIGN KEY ("ID_Pegawai") REFERENCES "PEGAWAI"("ID_Pegawai") ON DELETE CASCADE
);

CREATE TABLE "STATUS" (
    "ID_Status" VARCHAR(20) PRIMARY KEY,
    "Nama_Status" VARCHAR(50) NOT NULL
);

CREATE TABLE "TRANSAKSI" (
    "Kode_Transaksi" VARCHAR(30) PRIMARY KEY,
    "Tgl_Jam_Transaksi" TIMESTAMP NOT NULL,
    "ID_Member" VARCHAR(20) NOT NULL,
    "ID_Kasir" VARCHAR(20) NOT NULL,
    "ID_Supervisor" VARCHAR(20) NOT NULL,
    "Total_Berat_Kg" DECIMAL(5, 2) NOT NULL,
    "Catatan_Pakaian" TEXT,
    "Harga_Per_Kg" INTEGER NOT NULL,
    "Nilai_Per_Koin" INTEGER NOT NULL,
    "Saldo_Koin_Awal" INTEGER NOT NULL,
    "Koin_Didapat" INTEGER NOT NULL,
    "Koin_Ditukar" INTEGER NOT NULL,
    "Waktu_Notifikasi_Selesai" TIMESTAMP,
    CONSTRAINT "fk_transaksi_member" FOREIGN KEY ("ID_Member") REFERENCES "MEMBER"("ID_Member"),
    CONSTRAINT "fk_transaksi_kasir" FOREIGN KEY ("ID_Kasir") REFERENCES "PEGAWAI"("ID_Pegawai"),
    CONSTRAINT "fk_transaksi_supervisor" FOREIGN KEY ("ID_Supervisor") REFERENCES "PEGAWAI"("ID_Pegawai")
);

CREATE TABLE "STATUS_PROSES" (
    "Kode_Transaksi" VARCHAR(30) NOT NULL,
    "ID_Status" VARCHAR(20) NOT NULL,
    "Waktu_Status" TIMESTAMP NOT NULL,
    PRIMARY KEY ("Kode_Transaksi", "ID_Status"),
    CONSTRAINT "fk_statusproses_transaksi" FOREIGN KEY ("Kode_Transaksi") REFERENCES "TRANSAKSI"("Kode_Transaksi") ON DELETE CASCADE,
    CONSTRAINT "fk_statusproses_status" FOREIGN KEY ("ID_Status") REFERENCES "STATUS"("ID_Status")
);

-- 3. Pengisian Data (DML) Sesuai Sheet 3NF
INSERT INTO "MEMBER" ("ID_Member", "Nama_Member", "No_HP", "Gender_Member", "Tgl_Daftar") VALUES
('MBR-015', 'Putri', '0813-1584-1308', 'Perempuan', '2026-09-09'),
('MBR-006', 'Ilham', '0813-9814-2744', 'Laki-laki', '2026-09-10'),
('MBR-030', 'Farhan', '0811-7920-7554', 'Laki-laki', '2026-09-10'),
('MBR-004', 'Faiz', '0853-4140-2177', 'Laki-laki', '2026-09-11'),
('MBR-037', 'Oca', '0878-2755-7953', 'Perempuan', '2026-09-11');

INSERT INTO "PEGAWAI" ("ID_Pegawai", "Nama_Pegawai", "Peran") VALUES
('PGW-01', 'Zahra', 'Kasir'),
('PGW-02', 'Berlin', 'Kasir'),
('PGW-03', 'Verra', 'Supervisor'),
('PGW-04', 'Yeni', 'Supervisor');

-- Akun Login Pegawai (Password default: '123456' atau 'kasir')
INSERT INTO "USERS" ("ID_User", "ID_Pegawai", "Username", "Password_Hash", "Role") VALUES
('USR-01', 'PGW-01', 'zahra', 'kasir', 'Kasir'),
('USR-02', 'PGW-02', 'berlin', 'kasir', 'Kasir'),
('USR-03', 'PGW-03', 'verra', 'supervisor', 'Supervisor'),
('USR-04', 'PGW-04', 'yeni', 'supervisor', 'Supervisor');

INSERT INTO "STATUS" ("ID_Status", "Nama_Status") VALUES
('ST-1', 'Diterima'),
('ST-2', 'Diproses'),
('ST-3', 'Selesai');

INSERT INTO "TRANSAKSI" (
    "Kode_Transaksi", "Tgl_Jam_Transaksi", "ID_Member", "ID_Kasir", "ID_Supervisor",
    "Total_Berat_Kg", "Catatan_Pakaian", "Harga_Per_Kg", "Nilai_Per_Koin",
    "Saldo_Koin_Awal", "Koin_Didapat", "Koin_Ditukar", "Waktu_Notifikasi_Selesai"
) VALUES
('TRX-260910-001', '2026-09-10 15:00:00', 'MBR-015', 'PGW-02', 'PGW-03', 6.50, 'Pisahkan kain warna putih', 8000, 1000, 1, 1, 0, '2026-09-12 10:05:00'),
('TRX-260910-002', '2026-09-10 15:15:00', 'MBR-006', 'PGW-01', 'PGW-04', 9.50, 'Jangan beri terlalu banyak pewangi', 8000, 1000, 18, 1, 0, '2026-09-12 09:05:00'),
('TRX-260911-001', '2026-09-11 08:40:00', 'MBR-030', 'PGW-01', 'PGW-04', 4.50, 'Jaket jangan keringkan terlalu panas', 8000, 1000, 7, 0, 0, '2026-09-13 08:15:00'),
('TRX-260911-002', '2026-09-11 12:50:00', 'MBR-004', 'PGW-02', 'PGW-03', 8.50, '-', 8000, 1000, 11, 1, 0, '2026-09-13 09:05:00'),
('TRX-260911-003', '2026-09-11 13:00:00', 'MBR-037', 'PGW-01', 'PGW-04', 7.50, '-', 8000, 1000, 0, 1, 1, '2026-09-13 08:50:00');

INSERT INTO "STATUS_PROSES" ("Kode_Transaksi", "ID_Status", "Waktu_Status") VALUES
('TRX-260910-001', 'ST-1', '2026-09-10 20:00:00'),
('TRX-260910-001', 'ST-2', '2026-09-11 08:30:00'),
('TRX-260910-001', 'ST-3', '2026-09-12 09:00:00'),
('TRX-260910-002', 'ST-1', '2026-09-10 19:15:00'),
('TRX-260910-002', 'ST-2', '2026-09-11 08:20:00'),
('TRX-260910-002', 'ST-3', '2026-09-12 08:10:00'),
('TRX-260911-001', 'ST-1', '2026-09-11 13:40:00'),
('TRX-260911-001', 'ST-2', '2026-09-12 08:10:00'),
('TRX-260911-001', 'ST-3', '2026-09-13 08:00:00'),
('TRX-260911-002', 'ST-1', '2026-09-11 17:50:00'),
('TRX-260911-002', 'ST-2', '2026-09-12 08:30:00'),
('TRX-260911-002', 'ST-3', '2026-09-13 08:10:00'),
('TRX-260911-003', 'ST-1', '2026-09-11 17:00:00'),
('TRX-260911-003', 'ST-2', '2026-09-12 08:20:00'),
('TRX-260911-003', 'ST-3', '2026-09-13 08:20:00');