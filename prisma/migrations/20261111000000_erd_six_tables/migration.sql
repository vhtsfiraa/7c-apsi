CREATE TABLE "MEMBER" (
  "ID_Member" VARCHAR(20) NOT NULL,
  "Nama_Member" VARCHAR(100) NOT NULL,
  "No_HP" VARCHAR(20),
  "Gender_Member" VARCHAR(20),
  "Tgl_Daftar" DATE NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT "MEMBER_pkey" PRIMARY KEY ("ID_Member")
);

CREATE TABLE "PEGAWAI" (
  "ID_Pegawai" VARCHAR(20) NOT NULL,
  "Nama_Pegawai" VARCHAR(100) NOT NULL,
  "Peran" VARCHAR(50) NOT NULL,
  CONSTRAINT "PEGAWAI_pkey" PRIMARY KEY ("ID_Pegawai")
);

CREATE TABLE "STATUS" (
  "ID_Status" VARCHAR(20) NOT NULL,
  "Nama_Status" VARCHAR(50) NOT NULL,
  CONSTRAINT "STATUS_pkey" PRIMARY KEY ("ID_Status")
);

CREATE TABLE "USERS" (
  "ID_User" VARCHAR(20) NOT NULL,
  "ID_Pegawai" VARCHAR(20) NOT NULL,
  "Username" VARCHAR(50) NOT NULL,
  "Password_Hash" VARCHAR(255) NOT NULL,
  "Role" VARCHAR(50) NOT NULL,
  CONSTRAINT "USERS_pkey" PRIMARY KEY ("ID_User")
);
CREATE UNIQUE INDEX "USERS_Username_key" ON "USERS"("Username");
CREATE INDEX "USERS_ID_Pegawai_idx" ON "USERS"("ID_Pegawai");
ALTER TABLE "USERS"
  ADD CONSTRAINT "USERS_ID_Pegawai_fkey"
  FOREIGN KEY ("ID_Pegawai") REFERENCES "PEGAWAI"("ID_Pegawai")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TRANSAKSI" (
  "Kode_Transaksi" VARCHAR(30) NOT NULL,
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
  CONSTRAINT "TRANSAKSI_pkey" PRIMARY KEY ("Kode_Transaksi")
);
CREATE INDEX "TRANSAKSI_ID_Member_idx" ON "TRANSAKSI"("ID_Member");
CREATE INDEX "TRANSAKSI_ID_Kasir_idx" ON "TRANSAKSI"("ID_Kasir");
CREATE INDEX "TRANSAKSI_ID_Supervisor_idx" ON "TRANSAKSI"("ID_Supervisor");
ALTER TABLE "TRANSAKSI"
  ADD CONSTRAINT "TRANSAKSI_ID_Member_fkey"
  FOREIGN KEY ("ID_Member") REFERENCES "MEMBER"("ID_Member")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TRANSAKSI"
  ADD CONSTRAINT "TRANSAKSI_ID_Kasir_fkey"
  FOREIGN KEY ("ID_Kasir") REFERENCES "PEGAWAI"("ID_Pegawai")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TRANSAKSI"
  ADD CONSTRAINT "TRANSAKSI_ID_Supervisor_fkey"
  FOREIGN KEY ("ID_Supervisor") REFERENCES "PEGAWAI"("ID_Pegawai")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "STATUS_PROSES" (
  "Kode_Transaksi" VARCHAR(30) NOT NULL,
  "ID_Status" VARCHAR(20) NOT NULL,
  "Waktu_Status" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "STATUS_PROSES_pkey" PRIMARY KEY ("Kode_Transaksi", "ID_Status")
);
CREATE INDEX "STATUS_PROSES_ID_Status_idx" ON "STATUS_PROSES"("ID_Status");
ALTER TABLE "STATUS_PROSES"
  ADD CONSTRAINT "STATUS_PROSES_Kode_Transaksi_fkey"
  FOREIGN KEY ("Kode_Transaksi") REFERENCES "TRANSAKSI"("Kode_Transaksi")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "STATUS_PROSES"
  ADD CONSTRAINT "STATUS_PROSES_ID_Status_fkey"
  FOREIGN KEY ("ID_Status") REFERENCES "STATUS"("ID_Status")
  ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "STATUS" ("ID_Status", "Nama_Status") VALUES
  ('ST-MENUNGGU', 'Menunggu'),
  ('ST-DIPROSES', 'Diproses'),
  ('ST-DICUCI', 'Dicuci'),
  ('ST-DIKERINGKAN', 'Dikeringkan'),
  ('ST-DISETIRIKA', 'Disetrika'),
  ('ST-SELESAI', 'Selesai'),
  ('ST-DIAMBIL', 'Sudah Diambil');

INSERT INTO "PEGAWAI" ("ID_Pegawai", "Nama_Pegawai", "Peran")
VALUES ('PEG-DEMO-0000000001', 'Kasir Demo', 'Kasir')
ON CONFLICT ("ID_Pegawai") DO NOTHING;

DO $migration$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO "MEMBER" ("ID_Member", "Nama_Member", "No_HP", "Tgl_Daftar")
      SELECT
        'MEM-' || lpad(u.id_user::text, 16, '0'),
        left(u.nama, 100),
        CASE WHEN nullif(regexp_replace(coalesce(u.nomor_telepon, ''), '\D', '', 'g'), '') IS NULL
          THEN NULL ELSE left(regexp_replace(u.nomor_telepon, '\D', '', 'g'), 20) END,
        CURRENT_DATE
      FROM public.users u
      WHERE lower(u.role) = 'member'
      ON CONFLICT ("ID_Member") DO NOTHING
    $sql$;

    EXECUTE $sql$
      INSERT INTO "PEGAWAI" ("ID_Pegawai", "Nama_Pegawai", "Peran")
      SELECT
        'PEG-' || lpad(u.id_user::text, 16, '0'),
        left(u.nama, 100),
        CASE WHEN lower(u.role) = 'supervisor' THEN 'Supervisor' ELSE 'Kasir' END
      FROM public.users u
      WHERE lower(u.role) IN ('kasir', 'supervisor')
      ON CONFLICT ("ID_Pegawai") DO NOTHING
    $sql$;

    EXECUTE $sql$
      INSERT INTO "USERS" ("ID_User", "ID_Pegawai", "Username", "Password_Hash", "Role")
      SELECT
        'USR-' || lpad(u.id_user::text, 16, '0'),
        'PEG-' || lpad(u.id_user::text, 16, '0'),
        left(lower(u.username), 50),
        left(coalesce(u.password_hash, ''), 255),
        'Kasir'
      FROM public.users u
      WHERE lower(u.role) = 'kasir' AND coalesce(u.password_hash, '') <> ''
      ON CONFLICT ("Username") DO NOTHING
    $sql$;
  END IF;

  IF to_regclass('public.status_laundry') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO "STATUS" ("ID_Status", "Nama_Status")
      SELECT
        'OLD-' || lpad(s.id_status::text, 16, '0'),
        left(s.nama_status, 50)
      FROM public.status_laundry s
      ON CONFLICT ("ID_Status") DO NOTHING
    $sql$;
  END IF;

  IF to_regclass('public.transaksi') IS NOT NULL AND to_regclass('public.users') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO "TRANSAKSI" (
        "Kode_Transaksi", "Tgl_Jam_Transaksi", "ID_Member", "ID_Kasir",
        "Total_Berat_Kg", "Catatan_Pakaian", "Harga_Per_Kg",
        "Nilai_Per_Koin", "Saldo_Koin_Awal", "Koin_Didapat", "Koin_Ditukar"
      )
      SELECT
        'TRX-' || lpad(t.id_transaksi::text, 26, '0'),
        t.tanggal,
        'MEM-' || lpad(t.id_user::text, 16, '0'),
        CASE WHEN cashier.id_user IS NOT NULL
          THEN 'PEG-' || lpad(cashier.id_user::text, 16, '0')
          ELSE 'PEG-DEMO-0000000001' END,
        t.berat_kg,
        left(concat_ws(' - ', t.nama_barang, t.jenis_layanan), 10000),
        round(t.harga_satuan)::integer,
        5000,
        NULL,
        coalesce(t.koin_diberikan, 0),
        coalesce(t.koin_dipakai, 0)
      FROM public.transaksi t
      LEFT JOIN public.users cashier
        ON cashier.id_user = t.created_by AND lower(cashier.role) = 'kasir'
      ON CONFLICT ("Kode_Transaksi") DO NOTHING
    $sql$;
  END IF;

  IF to_regclass('public.riwayat_status') IS NOT NULL
     AND to_regclass('public.transaksi') IS NOT NULL
     AND to_regclass('public.status_laundry') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO "STATUS_PROSES" ("Kode_Transaksi", "ID_Status", "Waktu_Status")
      SELECT
        'TRX-' || lpad(h.id_transaksi::text, 26, '0'),
        'OLD-' || lpad(coalesce(h.status_id, s.id_status)::text, 16, '0'),
        h.berubah_pada
      FROM public.riwayat_status h
      JOIN public.status_laundry s
        ON s.id_status = h.status_id OR (h.status_id IS NULL AND s.nama_status = h.status_baru)
      ON CONFLICT ("Kode_Transaksi", "ID_Status") DO NOTHING
    $sql$;
  END IF;

  IF to_regclass('public.transaksi') IS NOT NULL
     AND to_regclass('public.status_laundry') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO "STATUS_PROSES" ("Kode_Transaksi", "ID_Status", "Waktu_Status")
      SELECT
        'TRX-' || lpad(t.id_transaksi::text, 26, '0'),
        'OLD-' || lpad(s.id_status::text, 16, '0'),
        t.tanggal
      FROM public.transaksi t
      JOIN public.status_laundry s ON s.id_status = t.status_id
      ON CONFLICT ("Kode_Transaksi", "ID_Status") DO NOTHING
    $sql$;
  END IF;

  IF to_regclass('public.notifikasi') IS NOT NULL AND to_regclass('public.transaksi') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE "TRANSAKSI" target
      SET "Waktu_Notifikasi_Selesai" = source.dibuat_pada
      FROM (
        SELECT id_transaksi, min(dibuat_pada) AS dibuat_pada
        FROM public.notifikasi
        GROUP BY id_transaksi
      ) source
      WHERE target."Kode_Transaksi" = 'TRX-' || lpad(source.id_transaksi::text, 26, '0')
    $sql$;
  END IF;

  IF to_regclass('public.pengambilan') IS NOT NULL AND to_regclass('public.transaksi') IS NOT NULL
     AND to_regclass('public.status_laundry') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO "STATUS_PROSES" ("Kode_Transaksi", "ID_Status", "Waktu_Status")
      SELECT
        'TRX-' || lpad(p.id_transaksi::text, 26, '0'),
        'OLD-' || lpad(s.id_status::text, 16, '0'),
        p.diserahkan_pada
      FROM public.pengambilan p
      CROSS JOIN public.status_laundry s
      WHERE p.diserahkan_pada IS NOT NULL AND s.nama_status = 'Sudah Diambil'
      ON CONFLICT ("Kode_Transaksi", "ID_Status") DO NOTHING
    $sql$;
  END IF;

  IF to_regclass('public.riwayat_koin') IS NOT NULL AND to_regclass('public.users') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO "TRANSAKSI" (
        "Kode_Transaksi", "Tgl_Jam_Transaksi", "ID_Member", "ID_Kasir",
        "Total_Berat_Kg", "Catatan_Pakaian", "Harga_Per_Kg",
        "Nilai_Per_Koin", "Koin_Didapat", "Koin_Ditukar"
      )
      SELECT
        'COIN-' || lpad(k.id_riwayat_koin::text, 25, '0'),
        k.dibuat_pada,
        'MEM-' || lpad(k.id_user::text, 16, '0'),
        CASE WHEN cashier.id_user IS NOT NULL
          THEN 'PEG-' || lpad(cashier.id_user::text, 16, '0')
          ELSE 'PEG-DEMO-0000000001' END,
        0,
        left('Migrasi riwayat koin: ' || k.keterangan, 10000),
        0,
        5000,
        greatest(k.jumlah, 0),
        greatest(-k.jumlah, 0)
      FROM public.riwayat_koin k
      LEFT JOIN public.users cashier
        ON cashier.id_user = k.id_kasir AND lower(cashier.role) = 'kasir'
      WHERE k.id_transaksi IS NULL
      ON CONFLICT ("Kode_Transaksi") DO NOTHING
    $sql$;
  END IF;
END
$migration$;

INSERT INTO "PEGAWAI" ("ID_Pegawai", "Nama_Pegawai", "Peran")
VALUES ('PEG-DEMO-0000000001', 'Kasir Demo', 'Kasir')
ON CONFLICT ("ID_Pegawai") DO NOTHING;

INSERT INTO "USERS" ("ID_User", "ID_Pegawai", "Username", "Password_Hash", "Role")
VALUES (
  'USR-DEMO-000000001',
  'PEG-DEMO-0000000001',
  'kasir',
  'scrypt$6a6f626c61756e64727964656d6f3031$a00ec11487eae948813382f2ea4ccb5c6160a8bf62f854b61df8656bf5ea3ef7fe9a8a99c7b7bd7a4842927f554b65e6796fb0ab6ad45c1e0210194fb3b38fb8',
  'Kasir'
)
ON CONFLICT ("Username") DO NOTHING;
