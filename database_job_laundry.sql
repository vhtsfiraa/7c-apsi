-- Run with psql. The backslash commands are psql meta-commands.
SELECT 'CREATE DATABASE job_laundry'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'job_laundry') \gexec
\connect job_laundry

CREATE TABLE "MEMBER" (
  "ID_Member" VARCHAR(20) PRIMARY KEY DEFAULT
    ('MBR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))),
  "Nama_Member" VARCHAR(100) NOT NULL,
  "No_HP" VARCHAR(20),
  "Gender_Member" VARCHAR(20),
  "Tgl_Daftar" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PEGAWAI" (
  "ID_Pegawai" VARCHAR(20) PRIMARY KEY,
  "Nama_Pegawai" VARCHAR(100) NOT NULL,
  "Peran" VARCHAR(50) NOT NULL
);

CREATE TABLE "TRANSAKSI" (
  "Kode_Transaksi" VARCHAR(30) PRIMARY KEY DEFAULT
    ('TRX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 26))),
  "Tgl_Jam_Transaksi" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ID_Member" VARCHAR(20) NOT NULL,
  "ID_Kasir" VARCHAR(20) NOT NULL,
  "ID_Supervisor" VARCHAR(20),
  "Total_Berat_Kg" DECIMAL(5,2),
  "Catatan_Pakaian" TEXT,
  "Harga_Per_Kg" INTEGER,
  "Nilai_Per_Koin" INTEGER,
  "Saldo_Koin_Awal" INTEGER,
  "Koin_Didapat" INTEGER,
  "Koin_Ditukar" INTEGER,
  "Waktu_Notifikasi_Selesai" TIMESTAMP(6),
  CONSTRAINT "TRANSAKSI_ID_Member_fkey"
    FOREIGN KEY ("ID_Member") REFERENCES "MEMBER"("ID_Member") ON UPDATE CASCADE,
  CONSTRAINT "TRANSAKSI_ID_Kasir_fkey"
    FOREIGN KEY ("ID_Kasir") REFERENCES "PEGAWAI"("ID_Pegawai") ON UPDATE CASCADE,
  CONSTRAINT "TRANSAKSI_ID_Supervisor_fkey"
    FOREIGN KEY ("ID_Supervisor") REFERENCES "PEGAWAI"("ID_Pegawai")
    ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "TRANSAKSI_ID_Member_idx" ON "TRANSAKSI"("ID_Member");
CREATE INDEX "TRANSAKSI_ID_Kasir_idx" ON "TRANSAKSI"("ID_Kasir");
CREATE INDEX "TRANSAKSI_ID_Supervisor_idx" ON "TRANSAKSI"("ID_Supervisor");

CREATE TABLE "STATUS" (
  "ID_Status" VARCHAR(20) PRIMARY KEY,
  "Nama_Status" VARCHAR(50) NOT NULL
);

CREATE TABLE "STATUS_PROSES" (
  "Kode_Transaksi" VARCHAR(30) NOT NULL,
  "ID_Status" VARCHAR(20) NOT NULL,
  "Waktu_Status" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "STATUS_PROSES_pkey" PRIMARY KEY ("Kode_Transaksi", "ID_Status"),
  CONSTRAINT "STATUS_PROSES_Kode_Transaksi_fkey"
    FOREIGN KEY ("Kode_Transaksi") REFERENCES "TRANSAKSI"("Kode_Transaksi") ON UPDATE CASCADE,
  CONSTRAINT "STATUS_PROSES_ID_Status_fkey"
    FOREIGN KEY ("ID_Status") REFERENCES "STATUS"("ID_Status") ON UPDATE CASCADE
);
CREATE INDEX "STATUS_PROSES_ID_Status_idx" ON "STATUS_PROSES"("ID_Status");

CREATE TABLE "USERS" (
  "ID_User" VARCHAR(20) PRIMARY KEY,
  "ID_Pegawai" VARCHAR(20) NOT NULL UNIQUE,
  "Username" VARCHAR(50) NOT NULL UNIQUE,
  "Password_Hash" VARCHAR(255) NOT NULL,
  "Role" VARCHAR(50) NOT NULL,
  CONSTRAINT "USERS_ID_Pegawai_fkey"
    FOREIGN KEY ("ID_Pegawai") REFERENCES "PEGAWAI"("ID_Pegawai") ON UPDATE CASCADE
);

INSERT INTO "STATUS" ("ID_Status", "Nama_Status") VALUES
  ('ST-MENUNGGU', 'Menunggu'),
  ('ST-DIPROSES', 'Diproses'),
  ('ST-DICUCI', 'Dicuci'),
  ('ST-DIKERINGKAN', 'Dikeringkan'),
  ('ST-DISETIRIKA', 'Disetrika'),
  ('ST-SELESAI', 'Selesai'),
  ('ST-PICKUP-REQUEST', 'Menunggu Pengambilan'),
  ('ST-DIAMBIL', 'Sudah Diambil');

INSERT INTO "PEGAWAI" ("ID_Pegawai", "Nama_Pegawai", "Peran")
VALUES ('PEG-DEMO-0000000001', 'Kasir Demo', 'Kasir');

INSERT INTO "USERS" ("ID_User", "ID_Pegawai", "Username", "Password_Hash", "Role")
VALUES (
  'USR-DEMO-000000001',
  'PEG-DEMO-0000000001',
  'kasir',
  'scrypt$6a6f626c61756e64727964656d6f3031$a00ec11487eae948813382f2ea4ccb5c6160a8bf62f854b61df8656bf5ea3ef7fe9a8a99c7b7bd7a4842927f554b65e6796fb0ab6ad45c1e0210194fb3b38fb8',
  'kasir'
);
