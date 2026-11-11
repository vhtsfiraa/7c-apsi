DO $migration$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE $sql$
      WITH balances AS (
        SELECT
          u.id_user,
          u.koin_saldo,
          coalesce(sum(t."Koin_Didapat"), 0)::integer
            - coalesce(sum(t."Koin_Ditukar"), 0)::integer AS migrated_balance
        FROM public.users u
        LEFT JOIN "TRANSAKSI" t
          ON t."ID_Member" = 'MEM-' || lpad(u.id_user::text, 16, '0')
        WHERE lower(u.role) = 'member'
        GROUP BY u.id_user, u.koin_saldo
      )
      INSERT INTO "TRANSAKSI" (
        "Kode_Transaksi", "Tgl_Jam_Transaksi", "ID_Member", "ID_Kasir",
        "Total_Berat_Kg", "Catatan_Pakaian", "Harga_Per_Kg",
        "Nilai_Per_Koin", "Saldo_Koin_Awal", "Koin_Didapat", "Koin_Ditukar"
      )
      SELECT
        'BAL-' || lpad(id_user::text, 26, '0'),
        CURRENT_TIMESTAMP,
        'MEM-' || lpad(id_user::text, 16, '0'),
        'PEG-DEMO-0000000001',
        0,
        'Penyesuaian saldo koin saat migrasi skema ERD.',
        0,
        5000,
        migrated_balance,
        greatest(koin_saldo - migrated_balance, 0),
        greatest(migrated_balance - koin_saldo, 0)
      FROM balances
      WHERE koin_saldo IS NOT NULL AND koin_saldo <> migrated_balance
      ON CONFLICT ("Kode_Transaksi") DO NOTHING
    $sql$;
  END IF;
END
$migration$;
