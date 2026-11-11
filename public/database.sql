DROP TABLE IF EXISTS STATUS_PROSES CASCADE;
DROP TABLE IF EXISTS TRANSAKSI CASCADE;
DROP TABLE IF EXISTS STATUS CASCADE;
DROP TABLE IF EXISTS USERS CASCADE;
DROP TABLE IF EXISTS PEGAWAI CASCADE;
DROP TABLE IF EXISTS MEMBER CASCADE;

-- 1. Tabel Member
CREATE TABLE MEMBER (
    ID_Member VARCHAR(20) PRIMARY KEY,
    Nama_Member VARCHAR(100),
    No_HP VARCHAR(20),
    Gender_Member VARCHAR(20),
    Tgl_Daftar DATE
);

-- 2. Tabel Pegawai
CREATE TABLE PEGAWAI (
    ID_Pegawai VARCHAR(20) PRIMARY KEY,
    Nama_Pegawai VARCHAR(100),
    Peran VARCHAR(50)
);

-- 3. Tabel Users (Untuk Autentikasi Login)
CREATE TABLE USERS (
    ID_User VARCHAR(20) PRIMARY KEY,
    ID_Pegawai VARCHAR(20),
    Username VARCHAR(50) UNIQUE,
    Password_Hash VARCHAR(255),
    Role VARCHAR(50),
    FOREIGN KEY (ID_Pegawai) REFERENCES PEGAWAI(ID_Pegawai)
);

-- 4. Tabel Status Laundry
CREATE TABLE STATUS (
    ID_Status VARCHAR(20) PRIMARY KEY,
    Nama_Status VARCHAR(50)
);

-- 5. Tabel Transaksi Utama
CREATE TABLE TRANSAKSI (
    Kode_Transaksi VARCHAR(30) PRIMARY KEY,
    Tgl_Jam_Transaksi TIMESTAMP,
    ID_Member VARCHAR(20),
    ID_Kasir VARCHAR(20),
    ID_Supervisor VARCHAR(20),
    Total_Berat_Kg DECIMAL(5,2),
    Catatan_Pakaian TEXT,
    Harga_Per_Kg INT,
    Nilai_Per_Koin INT,
    Saldo_Koin_Awal INT,
    Koin_Didapat INT,
    Koin_Ditukar INT,
    Waktu_Notifikasi_Selesai TIMESTAMP,
    FOREIGN KEY (ID_Member) REFERENCES MEMBER(ID_Member),
    FOREIGN KEY (ID_Kasir) REFERENCES PEGAWAI(ID_Pegawai),
    FOREIGN KEY (ID_Supervisor) REFERENCES PEGAWAI(ID_Pegawai)
);

-- 6. Tabel Status Proses (Tracking per Transaksi)
CREATE TABLE STATUS_PROSES (
    Kode_Transaksi VARCHAR(30),
    ID_Status VARCHAR(20),
    Waktu_Status TIMESTAMP,
    PRIMARY KEY (Kode_Transaksi, ID_Status),
    FOREIGN KEY (Kode_Transaksi) REFERENCES TRANSAKSI(Kode_Transaksi),
    FOREIGN KEY (ID_Status) REFERENCES STATUS(ID_Status)
);

-- --- MASUKKAN DATA AWAL (DUMMY) ---

-- A. Data Pegawai
INSERT INTO PEGAWAI (ID_Pegawai, Nama_Pegawai, Peran) VALUES
('PEG01', 'Mayang Cahaya', 'Owner'),
('PEG02', 'Budi Supervisor', 'Supervisor'),
('PEG03', 'Andi Kasir', 'Kasir');

-- B. Data Users / Login (Password diisi '123456' agar bisa langsung login)
INSERT INTO USERS (ID_User, ID_Pegawai, Username, Password_Hash, Role) VALUES
('USR01', 'PEG01', 'owner1', '123456', 'OWNER'),
('USR02', 'PEG02', 'spv1', '123456', 'SUPERVISOR'),
('USR03', 'PEG03', 'kasir1', '123456', 'KASIR');

-- C. Data Member
INSERT INTO MEMBER (ID_Member, Nama_Member, No_HP, Gender_Member, Tgl_Daftar) VALUES
('MEM01', 'Siti Rahma', '081234567890', 'Perempuan', '2026-11-01'),
('MEM02', 'Ahmad Fauzi', '089876543210', 'Laki-laki', '2026-11-02');

-- Cek hasil akhir tabel USERS
SELECT * FROM USERS;
