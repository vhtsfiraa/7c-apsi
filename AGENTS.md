# Panduan Proyek Job Laundry

## Gambaran umum

Job Laundry adalah aplikasi pengelolaan transaksi laundry untuk dua jenis
pengguna yang saat ini didukung oleh antarmuka dan autentikasi: Kasir dan
Member. Aplikasi mencatat member, pegawai, transaksi, riwayat status, nilai
koin, dan waktu notifikasi selesai. UI yang ada menggunakan Bahasa Indonesia.

## Arsitektur dan tech stack

- **Web:** Next.js 16.4.4 App Router, React 19.3, TypeScript 5.
- **Styling:** Tailwind CSS 4 melalui loader Turbopack serta `app/globals.css`.
- **Database:** Neon PostgreSQL Serverless.
- **ORM:** Prisma ORM 7.10; konfigurasi CLI berada di `prisma7.config.ts`,
  schema di `prisma/schema.prisma`, dan client hasil generate di
  `app/generated/prisma`.
- **Driver:** `@prisma/adapter-pg` dengan `pg`; koneksi aplikasi dan seeder
  memakai `DATABASE_URL`.
- **Hosting target:** Vercel. Build proyek menjalankan
  `prisma generate && next build`; konfigurasi deployment khusus Vercel tidak
  didefinisikan di `vercel.json`.
- **Konfigurasi Next.js:** `next.config.ts` mengaktifkan `cacheComponents`,
  `partialPrefetching`, dan `experimental.agentFeedback`.

Halaman berada di `app/`; Route Handlers API berada di `app/api/`. Sebagian
halaman dashboard mengambil data langsung lewat Prisma di server, sementara
aksi formulir menggunakan API Route Handlers.

## Struktur kode

- `app/page.tsx`, `app/login/`, `app/daftar/`: halaman awal, login, dan
  pendaftaran Member.
- `app/kasir/`: dashboard Kasir untuk transaksi, status, member, koin,
  notifikasi, item pakaian/paket, serta nota.
- `app/member/`: dashboard Member, profil, riwayat transaksi, detail status,
  riwayat koin, dan notifikasi.
- `app/components/`: shell autentikasi/dashboard, formulir, tombol aksi API,
  cetak, status, dan serah-terima.
- `app/lib/`: akses Prisma, sesi/autentikasi, otorisasi API, dan helper laundry.
- `app/api/_lib/`: helper kompatibilitas ERD, serialisasi transaksi, koin,
  status laundry, serta login.
- `prisma/schema.prisma`: model Prisma 3NF.
- `prisma/migrations/`: baseline legacy dan migrasi menuju enam tabel ERD.
- `prisma/seed.ts`: seeder data demo 3NF.
- `prisma7.config.ts`: konfigurasi datasource dan perintah seed Prisma 7.
- `public/database.sql`: DDL, indeks, dan data contoh SQL mandiri untuk enam
  tabel.
- `public/design-assets/`: aset visual aplikasi.

Jangan mengubah desain atau alur UI ketika tugas hanya menyangkut data,
database, atau dokumentasi. Pertahankan App Router dan pola komponen yang ada.

## Database 3NF

Nama tabel dan kolom PostgreSQL menggunakan huruf besar serta tanda kutip;
`@@map`/field Prisma menghubungkan nama model ke nama database. Sumber tipe dan
nullable Prisma adalah `prisma/schema.prisma`. `public/database.sql` memiliki
DDL yang lebih ketat untuk sejumlah kolom, sehingga periksa kedua sumber
sebelum mengubah kontrak data.

| Tabel | Kolom dan tipe | Kunci/relasi |
|---|---|---|
| `MEMBER` | `ID_Member VARCHAR(20)`; `Nama_Member VARCHAR(100)`; `No_HP VARCHAR(20)` nullable; `Gender_Member VARCHAR(20)` nullable; `Tgl_Daftar DATE` | PK `ID_Member`; satu Member mempunyai banyak `TRANSAKSI`. |
| `PEGAWAI` | `ID_Pegawai VARCHAR(20)`; `Nama_Pegawai VARCHAR(100)`; `Peran VARCHAR(50)` | PK `ID_Pegawai`; relasi satu-ke-satu opsional ke `USERS`; dapat berperan sebagai kasir atau supervisor di transaksi. |
| `USERS` | `ID_User VARCHAR(20)`; `ID_Pegawai VARCHAR(20)`; `Username VARCHAR(50)`; `Password_Hash VARCHAR(255)`; `Role VARCHAR(50)` | PK `ID_User`; FK `ID_Pegawai` ke `PEGAWAI`; `Username` dan `ID_Pegawai` unik. |
| `TRANSAKSI` | `Kode_Transaksi VARCHAR(30)`; `Tgl_Jam_Transaksi TIMESTAMP`; `ID_Member VARCHAR(20)`; `ID_Kasir VARCHAR(20)`; `ID_Supervisor VARCHAR(20)` nullable; `Total_Berat_Kg DECIMAL(5,2)` nullable; `Catatan_Pakaian TEXT` nullable; `Harga_Per_Kg INTEGER` nullable; `Nilai_Per_Koin INTEGER` nullable; `Saldo_Koin_Awal INTEGER` nullable; `Koin_Didapat INTEGER` nullable; `Koin_Ditukar INTEGER` nullable; `Waktu_Notifikasi_Selesai TIMESTAMP` nullable | PK `Kode_Transaksi`; FK ke `MEMBER`, `PEGAWAI` sebagai kasir, dan opsional `PEGAWAI` sebagai supervisor. |
| `STATUS` | `ID_Status VARCHAR(20)`; `Nama_Status VARCHAR(50)` | PK `ID_Status`; satu status dipakai banyak baris `STATUS_PROSES`. |
| `STATUS_PROSES` | `Kode_Transaksi VARCHAR(30)`; `ID_Status VARCHAR(20)`; `Waktu_Status TIMESTAMP` | PK gabungan (`Kode_Transaksi`, `ID_Status`); FK ke `TRANSAKSI` dan `STATUS`; menyimpan satu waktu untuk tiap status pada tiap transaksi. |

`TRANSAKSI.Catatan_Pakaian` juga menyimpan nama pakaian, layanan, jumlah, atau
catatan terstruktur sebagai teks; tidak ada tabel detail item terpisah.
Saldo koin dihitung dari jumlah `Koin_Didapat` dikurangi `Koin_Ditukar`.
Notifikasi selesai menggunakan `Waktu_Notifikasi_Selesai`; schema tidak
memiliki kolom status baca notifikasi.

Seeder dan `public/database.sql` mengisi data awal berikut: 5 Member, 4
pegawai, 4 akun, 3 status (`ST-1` Diterima, `ST-2` Diproses, `ST-3` Selesai),
5 transaksi (`TRX-260910-001`, `TRX-260910-002`, `TRX-260911-001`,
`TRX-260911-002`, `TRX-260911-003`), serta 15 riwayat status—masing-masing
`ST-1`, `ST-2`, dan `ST-3` untuk setiap transaksi. Detail dan timestamp
kanonis ada pada file seeder dan SQL tersebut.

### Perbedaan status seed dan status operasional

`prisma/seed.ts` dan `public/database.sql` memuat tiga status historis
(`Diterima`, `Diproses`, `Selesai`). Di sisi lain,
`app/api/_lib/erd.ts`/`app/lib/laundry.ts` menyediakan delapan status
operasional (`Menunggu`, `Diproses`, `Dicuci`, `Dikeringkan`, `Disetrika`,
`Selesai`, `Menunggu Pengambilan`, `Sudah Diambil`). Route status dan transaksi
melakukan upsert status operasional tersebut. Kedua kelompok ini memakai ID
berbeda dan keduanya dapat ada di `STATUS`; jangan menganggap SQL seed hanya
berisi seluruh katalog status operasional.

## Akun demo

Password di database disimpan sebagai hash `scrypt` dengan salt per akun.
Seeder membuat hash baru ketika dijalankan.

| Pegawai | ID pegawai | Username | Password demo | Role data |
|---|---|---|---|---|
| Zahra | `PGW-01` | `zahra` | `kasir` | `Kasir` |
| Berlin | `PGW-02` | `berlin` | `kasir` | `Kasir` |
| Verra | `PGW-03` | `verra` | `supervisor` | `Supervisor` |
| Yeni | `PGW-04` | `yeni` | `supervisor` | `Supervisor` |

Autentikasi aplikasi saat ini hanya mendukung role `Member` dan `Kasir`.
`normalizeRole` menolak `Supervisor`, login kasir juga mensyaratkan
`PEGAWAI.Peran = Kasir`, dan tidak ada halaman dashboard Supervisor. Karena
itu akun Verra/Yeni tersimpan sesuai data seed tetapi belum dapat digunakan
untuk login aplikasi. Jangan menyatakan dukungan Supervisor tanpa memperbarui
auth, sesi, otorisasi, rute, dan halaman yang terkait.

Tidak ada akun demo tambahan bernama `kasir`: constraint unik
`USERS.ID_Pegawai` membatasi satu akun per pegawai, dan data kanonis memakai
username Zahra `zahra`.

## Menjalankan aplikasi dan database

1. Pasang dependency dengan `npm install`.
2. Pastikan `DATABASE_URL` mengarah ke database Neon yang benar dan
   `AUTH_SECRET` tersedia dengan panjang minimal 32 karakter. Jangan
   menampilkan atau menyalin nilainya ke log, dokumentasi, atau commit.
   `prisma7.config.ts` memuat `.env.local` lalu `.env`.
3. Terapkan sinkronisasi schema ke database target dengan
   `npx prisma db push`.
4. Isi ulang data demo dengan `npx prisma db seed`.
5. Jalankan lokal dengan `npm run dev`; validasi build dengan `npm run build`.
   Script build menjalankan `prisma generate` sebelum `next build`.

Seeder menghapus isi enam tabel bisnis dalam transaksi, lalu membuat ulang
dataset demo. Jalankan hanya pada database yang memang ditujukan untuk data
demo. Tinjau target `DATABASE_URL` sebelum `db push` atau seed; jangan
menambahkan flag penerima kehilangan data tanpa persetujuan eksplisit.

`public/database.sql` adalah script SQL mandiri yang juga mengosongkan dan
mengisi ulang enam tabel. Script tersebut tidak dijalankan oleh
`npx prisma db seed`; gunakan seeder Prisma untuk alur aplikasi.

## API Routes saat ini

| Method dan route | Fungsi/akses |
|---|---|
| `POST /api/auth/login` | Login Kasir (handler kompatibilitas). |
| `POST /api/auth/login/kasir` | Login Kasir dari `USERS`; hanya akun ber-role Kasir dan pegawai ber-peran Kasir diterima. |
| `POST /api/auth/login/member` | Login Member memakai ID Member dan nomor HP. |
| `POST /api/auth/logout` | Menghapus cookie sesi. |
| `POST /api/auth/register` | Mendaftarkan Member baru; menghasilkan ID dan kredensial ID Member/nomor HP. |
| `GET, POST /api/members` | Daftar dan tambah Member; khusus Kasir. |
| `PATCH /api/members/[id]` | Ubah data Member; khusus Kasir. |
| `GET, POST /api/koin` | Baca saldo/riwayat sesuai sesi; Kasir dapat mencatat penambahan atau penukaran koin manual. |
| `GET, PATCH /api/notifikasi` | Baca notifikasi selesai; `PATCH` mengembalikan `409` karena status baca tidak disimpan schema. |
| `GET /api/status-laundry` | Baca master status operasional; khusus Kasir dan melakukan upsert status. |
| `GET, POST /api/transaksi` | Baca transaksi sesuai role; Kasir membuat transaksi. |
| `GET, PATCH /api/transaksi/[id]` | Baca detail transaksi; Kasir dapat mengubah transaksi yang belum masuk status pengambilan. |
| `POST /api/transaksi/[id]/status` | Kasir mencatat transisi status laundry yang valid. |
| `POST /api/transaksi/[id]/pickup` | Member pemilik transaksi mengajukan pengambilan setelah status Selesai. |
| `POST /api/transaksi/[id]/pickup/confirm` | Kasir mengonfirmasi verifikasi identitas dan serah-terima. |

Tidak ada API DELETE pada route saat ini. API memakai cookie sesi dan otorisasi
role; `app/lib/auth.ts` membuat token HMAC-SHA256 yang berlaku 8 jam serta
memverifikasi hash password `scrypt`.

## Fitur aplikasi yang tersedia

- Halaman awal memilih login Member atau Kasir; pendaftaran Member meminta nama
  dan nomor HP.
- Dashboard Kasir: kelola Member, buat/ubah transaksi, lihat status laundry,
  data pakaian/paket, saldo dan penyesuaian koin, notifikasi selesai, serta
  pilih/cetak nota.
- Dashboard Member: ringkasan profil dan saldo koin, riwayat transaksi,
  detail dan riwayat status, riwayat koin, notifikasi selesai, dan pengajuan
  pengambilan.
- Transaksi baru memulai status `Menunggu`; status dapat bergerak mengikuti
  urutan proses yang divalidasi API. Saat menjadi `Selesai`, waktu notifikasi
  disimpan di transaksi.
- Koin transaksi biasa dihitung 1 koin per 5 kg. Kasir dapat melakukan
  penyesuaian/penukaran manual; penukaran 10 koin digunakan sebagai diskon
  25% ketika membuat transaksi.
- Notifikasi hanya menampilkan waktu laundry selesai. Penanda sudah dibaca
  tidak tersedia pada skema dan API `PATCH /api/notifikasi` memang belum
  didukung.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
