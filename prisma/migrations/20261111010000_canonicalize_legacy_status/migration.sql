ALTER TABLE "MEMBER"
  ALTER COLUMN "Tgl_Daftar" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "ID_Member" SET DEFAULT
    ('MBR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)));

ALTER TABLE "TRANSAKSI"
  ALTER COLUMN "Kode_Transaksi" SET DEFAULT
    ('TRX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 26)));

CREATE UNIQUE INDEX IF NOT EXISTS "USERS_ID_Pegawai_key"
  ON "USERS"("ID_Pegawai");

ALTER TABLE "TRANSAKSI"
  DROP CONSTRAINT "TRANSAKSI_ID_Supervisor_fkey";
ALTER TABLE "TRANSAKSI"
  ADD CONSTRAINT "TRANSAKSI_ID_Supervisor_fkey"
  FOREIGN KEY ("ID_Supervisor") REFERENCES "PEGAWAI"("ID_Pegawai")
  ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "USERS"
SET "Role" = 'kasir'
WHERE lower("Role") = 'kasir';

INSERT INTO "STATUS" ("ID_Status", "Nama_Status")
VALUES ('ST-PICKUP-REQUEST', 'Menunggu Pengambilan')
ON CONFLICT ("ID_Status") DO NOTHING;

INSERT INTO "STATUS_PROSES" ("Kode_Transaksi", "ID_Status", "Waktu_Status")
SELECT
  process."Kode_Transaksi",
  canonical."ID_Status",
  process."Waktu_Status"
FROM "STATUS_PROSES" process
JOIN "STATUS" legacy
  ON legacy."ID_Status" = process."ID_Status"
 AND legacy."ID_Status" LIKE 'OLD-%'
JOIN "STATUS" canonical
  ON lower(btrim(canonical."Nama_Status")) = lower(btrim(legacy."Nama_Status"))
 AND canonical."ID_Status" NOT LIKE 'OLD-%'
ON CONFLICT ("Kode_Transaksi", "ID_Status")
DO UPDATE SET "Waktu_Status" =
  LEAST("STATUS_PROSES"."Waktu_Status", EXCLUDED."Waktu_Status");

DELETE FROM "STATUS_PROSES" process
USING "STATUS" legacy, "STATUS" canonical
WHERE process."ID_Status" = legacy."ID_Status"
  AND legacy."ID_Status" LIKE 'OLD-%'
  AND lower(btrim(canonical."Nama_Status")) = lower(btrim(legacy."Nama_Status"))
  AND canonical."ID_Status" NOT LIKE 'OLD-%';

DELETE FROM "STATUS" legacy
USING "STATUS" canonical
WHERE legacy."ID_Status" LIKE 'OLD-%'
  AND lower(btrim(canonical."Nama_Status")) = lower(btrim(legacy."Nama_Status"))
  AND canonical."ID_Status" NOT LIKE 'OLD-%';
