BEGIN;

-- =====================================================
-- 1. TABEL MEMBER
-- =====================================================

CREATE TABLE IF NOT EXISTS "MEMBER" (
    "ID_Member" VARCHAR(20) PRIMARY KEY,
    "Nama_Member" VARCHAR(100) NOT NULL,
    "No_HP" VARCHAR(20) NOT NULL,
    "Gender_Member" VARCHAR(20),
    "Tgl_Daftar" DATE NOT NULL DEFAULT CURRENT_DATE
);

-- =====================================================
-- 2. TABEL PEGAWAI
-- =====================================================

CREATE TABLE IF NOT EXISTS "PEGAWAI" (
    "ID_Pegawai" VARCHAR(20) PRIMARY KEY,
    "Nama_Pegawai" VARCHAR(100) NOT NULL,
    "Peran" VARCHAR(50) NOT NULL
);

-- =====================================================
-- 3. TABEL STATUS
-- =====================================================

CREATE TABLE IF NOT EXISTS "STATUS" (
    "ID_Status" VARCHAR(20) PRIMARY KEY,
    "Nama_Status" VARCHAR(50) NOT NULL
);

-- =====================================================
-- 4. TABEL TRANSAKSI
-- =====================================================

CREATE TABLE IF NOT EXISTS "TRANSAKSI" (
    "Kode_Transaksi" VARCHAR(30) PRIMARY KEY,
    "Tgl_Jam_Transaksi" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ID_Member" VARCHAR(20) NOT NULL,
    "ID_Kasir" VARCHAR(20) NOT NULL,
    "ID_Supervisor" VARCHAR(20),
    "Total_Berat_Kg" DECIMAL(5,2) NOT NULL,
    "Catatan_Pakaian" TEXT,
    "Harga_Per_Kg" INTEGER NOT NULL,
    "Nilai_Per_Koin" INTEGER NOT NULL,
    "Saldo_Koin_Awal" INTEGER NOT NULL DEFAULT 0,
    "Koin_Didapat" INTEGER NOT NULL DEFAULT 0,
    "Koin_Ditukar" INTEGER NOT NULL DEFAULT 0,
    "Waktu_Notifikasi_Selesai" TIMESTAMP,

    CONSTRAINT "FK_TRANSAKSI_MEMBER"
        FOREIGN KEY ("ID_Member")
        REFERENCES "MEMBER" ("ID_Member")
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT "FK_TRANSAKSI_KASIR"
        FOREIGN KEY ("ID_Kasir")
        REFERENCES "PEGAWAI" ("ID_Pegawai")
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT "FK_TRANSAKSI_SUPERVISOR"
        FOREIGN KEY ("ID_Supervisor")
        REFERENCES "PEGAWAI" ("ID_Pegawai")
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT "CHK_BERAT"
        CHECK ("Total_Berat_Kg" >= 0),

    CONSTRAINT "CHK_HARGA"
        CHECK ("Harga_Per_Kg" >= 0),

    CONSTRAINT "CHK_NILAI_KOIN"
        CHECK ("Nilai_Per_Koin" >= 0),

    CONSTRAINT "CHK_SALDO_KOIN"
        CHECK (
            "Saldo_Koin_Awal" >= 0
            AND "Koin_Didapat" >= 0
            AND "Koin_Ditukar" >= 0
        )
);

-- =====================================================
-- 5. TABEL STATUS_PROSES
-- =====================================================

CREATE TABLE IF NOT EXISTS "STATUS_PROSES" (
    "Kode_Transaksi" VARCHAR(30) NOT NULL,
    "ID_Status" VARCHAR(20) NOT NULL,
    "Waktu_Status" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_STATUS_PROSES"
        PRIMARY KEY ("Kode_Transaksi", "ID_Status"),

    CONSTRAINT "FK_STATUS_PROSES_TRANSAKSI"
        FOREIGN KEY ("Kode_Transaksi")
        REFERENCES "TRANSAKSI" ("Kode_Transaksi")
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT "FK_STATUS_PROSES_STATUS"
        FOREIGN KEY ("ID_Status")
        REFERENCES "STATUS" ("ID_Status")
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 6. TABEL USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS "USERS" (
    "ID_User" VARCHAR(20) PRIMARY KEY,
    "ID_Pegawai" VARCHAR(20) NOT NULL,
    "Username" VARCHAR(50) NOT NULL UNIQUE,
    "Password_Hash" VARCHAR(255) NOT NULL,
    "Role" VARCHAR(50) NOT NULL,

    CONSTRAINT "UQ_USERS_PEGAWAI"
        UNIQUE ("ID_Pegawai"),

    CONSTRAINT "FK_USERS_PEGAWAI"
        FOREIGN KEY ("ID_Pegawai")
        REFERENCES "PEGAWAI" ("ID_Pegawai")
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =====================================================
-- 7. INDEX DATABASE
-- =====================================================

CREATE INDEX IF NOT EXISTS "IDX_TRANSAKSI_MEMBER"
ON "TRANSAKSI" ("ID_Member");

CREATE INDEX IF NOT EXISTS "IDX_TRANSAKSI_KASIR"
ON "TRANSAKSI" ("ID_Kasir");

CREATE INDEX IF NOT EXISTS "IDX_TRANSAKSI_SUPERVISOR"
ON "TRANSAKSI" ("ID_Supervisor");

CREATE INDEX IF NOT EXISTS "IDX_TRANSAKSI_TANGGAL"
ON "TRANSAKSI" ("Tgl_Jam_Transaksi");

CREATE INDEX IF NOT EXISTS "IDX_STATUS_PROSES_STATUS"
ON "STATUS_PROSES" ("ID_Status");

-- =====================================================
-- 8. DATA 3NF
-- =====================================================

TRUNCATE TABLE
    "STATUS_PROSES",
    "TRANSAKSI",
    "USERS",
    "MEMBER",
    "PEGAWAI",
    "STATUS";

INSERT INTO "MEMBER"
("ID_Member", "Nama_Member", "No_HP", "Gender_Member", "Tgl_Daftar")
VALUES
('MBR-015', 'Putri', '0813-1584-1308', 'Perempuan', '2026-09-09'),
('MBR-006', 'Ilham', '0813-9814-2744', 'Laki-laki', '2026-09-10'),
('MBR-030', 'Farhan', '0811-7920-7554', 'Laki-laki', '2026-09-10'),
('MBR-004', 'Faiz', '0853-4140-2177', 'Laki-laki', '2026-09-11'),
('MBR-037', 'Oca', '0878-2755-7953', 'Perempuan', '2026-09-11');

INSERT INTO "PEGAWAI" ("ID_Pegawai", "Nama_Pegawai", "Peran")
VALUES
('PGW-01', 'Zahra', 'Kasir'),
('PGW-02', 'Berlin', 'Kasir'),
('PGW-03', 'Verra', 'Supervisor'),
('PGW-04', 'Yeni', 'Supervisor');

INSERT INTO "USERS"
("ID_User", "ID_Pegawai", "Username", "Password_Hash", "Role")
VALUES
('USR-01', 'PGW-01', 'zahra', 'scrypt$f03bd43c22f84425b343a1dd525d293d$f6ed6df617bf25a304a556de7751b75f51fc2934c5acdb7b29e43291da94be236aea2d5c7853fb93bbc4cc670a524b3f3591bbaaadcface6a6e2cc6a7393ee09', 'Kasir'),
('USR-02', 'PGW-02', 'berlin', 'scrypt$c2f50248aa3ebaa1aa919345628fe267$2f04bbd628f8992dfc58704655c0cf1414c233311abfe3820cd9917773211267a09dac802a4302cfde142e0927137fffd894f68f8963161cfb69e8718177413e', 'Kasir'),
('USR-03', 'PGW-03', 'verra', 'scrypt$cf0dc21083affab00fdefedb7a2f7ce2$9bf8d63c1dc98ac26c4d4d7067dba54e96ec4f5ba74c0f134e98fad7a99ba47cc6d56fa21c30764b6d713a6517ce289ce1128c05d99ce5ac57683e57d24509ae', 'Supervisor'),
('USR-04', 'PGW-04', 'yeni', 'scrypt$06db83816b884e072d331adbfaf378a1$334c2c1199efab168fa87fc23f52a1466e1757b2b8fad84f42e02e2e7342fa6e6b7a0f37552ed7e451a8aba40d43eecbc3058638bbee3edf470564e0adcabab9', 'Supervisor');

INSERT INTO "STATUS" ("ID_Status", "Nama_Status")
VALUES
('ST-1', 'Diterima'),
('ST-2', 'Diproses'),
('ST-3', 'Selesai');

INSERT INTO "TRANSAKSI" (
    "Kode_Transaksi",
    "Tgl_Jam_Transaksi",
    "ID_Member",
    "ID_Kasir",
    "ID_Supervisor",
    "Total_Berat_Kg",
    "Catatan_Pakaian",
    "Harga_Per_Kg",
    "Nilai_Per_Koin",
    "Saldo_Koin_Awal",
    "Koin_Didapat",
    "Koin_Ditukar",
    "Waktu_Notifikasi_Selesai"
)
VALUES
('TRX-260910-001', '2026-09-10 15:00:00', 'MBR-015', 'PGW-02', 'PGW-03', 6.50, 'Pisahkan kain warna putih', 8000, 1000, 1, 1, 0, '2026-09-12 10:05:00'),
('TRX-260910-002', '2026-09-10 15:15:00', 'MBR-006', 'PGW-01', 'PGW-04', 9.50, 'Jangan beri terlalu banyak pewangi', 8000, 1000, 18, 1, 0, '2026-09-12 09:05:00'),
('TRX-260911-001', '2026-09-11 08:40:00', 'MBR-030', 'PGW-01', 'PGW-04', 4.50, 'Jaket jangan keringkan terlalu panas', 8000, 1000, 7, 0, 0, '2026-09-13 08:15:00'),
('TRX-260911-002', '2026-09-11 12:50:00', 'MBR-004', 'PGW-02', 'PGW-03', 8.50, '-', 8000, 1000, 11, 1, 0, '2026-09-13 09:05:00'),
('TRX-260911-003', '2026-09-11 13:00:00', 'MBR-037', 'PGW-01', 'PGW-04', 7.50, '-', 8000, 1000, 0, 1, 1, '2026-09-13 08:50:00');

INSERT INTO "STATUS_PROSES" ("Kode_Transaksi", "ID_Status", "Waktu_Status")
VALUES
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

COMMIT;