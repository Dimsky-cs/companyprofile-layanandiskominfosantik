-- 1. Buat Database
CREATE DATABASE IF NOT EXISTS portal_diskominfo_bekasi;
USE portal_diskominfo_bekasi;

-- 2. Tabel Admin / Petugas
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'petugas') DEFAULT 'petugas',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Modul 1: Tabel Profil Dinas & Visi Misi
CREATE TABLE IF NOT EXISTS profil_dinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_instansi VARCHAR(150) NULL DEFAULT '',
    visi TEXT NULL,
    misi TEXT NULL,
    tentang TEXT NULL,
    alamat TEXT NULL,
    telepon VARCHAR(50) NULL,
    email VARCHAR(100) NULL,
    gmaps_iframe TEXT NULL,
    struktur_organisasi_img VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Bagan Struktur Organisasi (SOTK)
CREATE TABLE IF NOT EXISTS struktur_organisasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT DEFAULT NULL,
    jabatan VARCHAR(150) NOT NULL,
    nama_pejabat VARCHAR(150) DEFAULT NULL,
    tipe_posisi VARCHAR(50) NOT NULL DEFAULT 'LINE_BIDANG',
    urutan INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY parent_id (parent_id),
    CONSTRAINT fk_struktur_parent FOREIGN KEY (parent_id) REFERENCES struktur_organisasi (id) ON DELETE CASCADE
);

-- 4. Modul 2: Tabel Pelayanan Persuratan Digital
CREATE TABLE IF NOT EXISTS layanan_surat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor_surat VARCHAR(100) UNIQUE NULL,
    nik VARCHAR(16) NOT NULL,
    nama_pemohon VARCHAR(150) NOT NULL,
    no_hp VARCHAR(20) NOT NULL,
    jenis_surat ENUM('Surat Keterangan Domisili', 'Surat Keterangan Usaha', 'Surat Rekomendasi Jaringan', 'Surat Permohonan Informasi Publik') NOT NULL,
    keperluan TEXT NOT NULL,
    berkas_lampiran VARCHAR(255),
    status ENUM('Menunggu', 'Diproses', 'Disetujui', 'Ditolak') DEFAULT 'Menunggu',
    catatan_petugas TEXT,
    file_surat_hasil VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Modul 3: Tabel Statistik & Satu Data Kependudukan
CREATE TABLE IF NOT EXISTS statistik_ringkasan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_penduduk VARCHAR(50) NOT NULL DEFAULT '3.214.850',
    rasio_laki VARCHAR(10) NOT NULL DEFAULT '51%',
    rasio_perempuan VARCHAR(10) NOT NULL DEFAULT '49%',
    total_kk VARCHAR(50) NOT NULL DEFAULT '984.210',
    skor_ipm VARCHAR(20) NOT NULL DEFAULT '75.80',
    predikat_ipm VARCHAR(50) NOT NULL DEFAULT 'Tinggi',
    kepadatan VARCHAR(20) NOT NULL DEFAULT '2.523',
    luas_wilayah VARCHAR(50) NOT NULL DEFAULT '1.273,88 km²',
    cakupan_wilayah VARCHAR(100) NOT NULL DEFAULT '23 Kecamatan • 187 Desa/Kel.',
    uhc_rate VARCHAR(20) NOT NULL DEFAULT '99.1%',
    melek_huruf VARCHAR(20) NOT NULL DEFAULT '99.2%',
    tpak VARCHAR(20) NOT NULL DEFAULT '68.5%',
    usia_produktif VARCHAR(20) NOT NULL DEFAULT '66.8%',
    sumber_data VARCHAR(255) NOT NULL DEFAULT 'Disdukcapil & BPS Kabupaten Bekasi',
    tahun_data VARCHAR(20) NOT NULL DEFAULT '2026',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS statistik_kecamatan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    camat VARCHAR(150) NULL DEFAULT '',
    penduduk INT NOT NULL DEFAULT 0,
    kk INT NOT NULL DEFAULT 0,
    luas DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    kepadatan INT NOT NULL DEFAULT 0,
    puskesmas INT NOT NULL DEFAULT 0,
    sekolah INT NOT NULL DEFAULT 0,
    kantor_desa INT NOT NULL DEFAULT 0,
    zona VARCHAR(50) NOT NULL DEFAULT 'Sedang',
    lat DECIMAL(10,6) NOT NULL DEFAULT -6.280000,
    lng DECIMAL(10,6) NOT NULL DEFAULT 107.150000,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS statistik_penduduk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kategori VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    jumlah DECIMAL(12,2) NOT NULL DEFAULT 0,
    tahun INT NOT NULL DEFAULT 2026,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- 6. Modul 4: Tabel Sistem Pengaduan Masyarakat
CREATE TABLE IF NOT EXISTS pengaduan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_tiket VARCHAR(20) UNIQUE NOT NULL,
    nama_pelapor VARCHAR(150) NOT NULL,
    nik_pelapor VARCHAR(16) NOT NULL,
    no_telp VARCHAR(20) NOT NULL,
    kategori_aduan ENUM('Infrastruktur Jaringan', 'Pelayanan Publik', 'Keamanan Informasi', 'Lainnya') NOT NULL,
    judul_aduan VARCHAR(200) NOT NULL,
    isi_aduan TEXT NOT NULL,
    foto_bukti VARCHAR(255),
    status ENUM('Terkirim', 'Diproses', 'Selesai', 'Ditolak') DEFAULT 'Terkirim',
    tanggapan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Modul 5: Tabel Kategori & Berita
CREATE TABLE IF NOT EXISTS kategori_berita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS berita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kategori_id INT,
    judul VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    konten LONGTEXT NOT NULL,
    gambar VARCHAR(255),
    penulis VARCHAR(100) DEFAULT 'Admin Diskominfo',
    views INT DEFAULT 0,
    status ENUM('draft', 'published') DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori_berita(id) ON DELETE SET NULL
);

-- 8. Modul 6: Tabel Galeri Dokumentasi
CREATE TABLE IF NOT EXISTS galeri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    judul VARCHAR(200) NOT NULL,
    tipe ENUM('foto', 'video') DEFAULT 'foto',
    file_path VARCHAR(255) NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. DATA AWAL (SEED DATA)
-- (Catatan: Data Profil Dinas & Struktur Organisasi dikosongkan agar dapat diisi mandiri melalui dashboard admin)

INSERT INTO kategori_berita (id, nama_kategori, slug) VALUES 
(1, 'Pemerintahan', 'pemerintahan'),
(2, 'Teknologi & Kota Pintar', 'teknologi-smart-city'),
(3, 'Layanan Publik', 'layanan-publik'),
(4, 'Siaran Pers Resmi', 'siaran-pers-resmi')
ON DUPLICATE KEY UPDATE nama_kategori = VALUES(nama_kategori), slug = VALUES(slug);

INSERT INTO statistik_ringkasan (
    total_penduduk, rasio_laki, rasio_perempuan, total_kk, skor_ipm, predikat_ipm, 
    kepadatan, luas_wilayah, cakupan_wilayah, uhc_rate, melek_huruf, tpak, 
    usia_produktif, sumber_data, tahun_data
) VALUES (
    '3.249.750', '51%', '49%', '992.950', '75.80', 'Tinggi', 
    '2.551', '1.273,88 km²', '23 Kecamatan • 187 Desa/Kel.', '99.1%', '99.2%', '68.5%', 
    '66.8%', 'Disdukcapil & BPS Kabupaten Bekasi', '2026'
);

INSERT INTO statistik_kecamatan (id, nama, camat, penduduk, kk, luas, kepadatan, puskesmas, sekolah, kantor_desa, zona, lat, lng) VALUES
(1, 'Tambun Selatan', 'Drs. Sopyan Hadi', 432500, 132000, 43.10, 10034, 4, 86, 9, 'Sangat Padat', -6.262500, 107.060100),
(2, 'Cikarang Utara', 'H. Enop Can, SH', 248900, 76500, 43.30, 5748, 3, 62, 11, 'Sangat Padat', -6.275800, 107.155400),
(3, 'Cikarang Barat', 'Dodi Gandi, S.STP', 215400, 66200, 53.96, 3991, 2, 54, 11, 'Padat', -6.291200, 107.098800),
(4, 'Babelan', 'H. Rudi Khoirudin', 279800, 85800, 63.60, 4399, 2, 58, 9, 'Padat', -6.160100, 107.035400),
(5, 'Cibitung', 'Encun Sunarto, SE', 254100, 78100, 45.30, 5609, 2, 49, 7, 'Sangat Padat', -6.255400, 107.108500),
(6, 'Cikarang Selatan', 'Muhammad Said, SE', 178200, 54800, 51.04, 3491, 2, 42, 7, 'Padat', -6.338400, 107.127800),
(7, 'Cikarang Pusat', 'Edward Sutarman', 68400, 21000, 47.60, 1436, 1, 24, 6, 'Sedang', -6.365300, 107.172500),
(8, 'Cikarang Timur', 'Ropi, ST', 108300, 33200, 51.31, 2110, 1, 31, 8, 'Sedang', -6.312500, 107.202400),
(9, 'Tambun Utara', 'Najmuddin, S.Ag', 202600, 62100, 34.42, 5886, 2, 45, 8, 'Sangat Padat', -6.208500, 107.067400),
(10, 'Setu', 'Joko Dwijatmoko', 182300, 55900, 62.16, 2932, 2, 38, 11, 'Padat', -6.354100, 107.058700),
(11, 'Tarumajaya', 'Dede Mauludin', 143800, 44100, 54.63, 2632, 2, 36, 8, 'Sedang', -6.128700, 106.995400),
(12, 'Serang Baru', 'Mirtono Suherianto', 154900, 47500, 63.80, 2427, 1, 33, 8, 'Sedang', -6.398500, 107.112400),
(13, 'Cibarusah', 'Drs. Rusdi Azis', 98700, 30300, 50.39, 1958, 1, 28, 7, 'Sedang', -6.442100, 107.098400),
(14, 'Sukatani', 'Agus Dahlan', 96400, 29500, 37.52, 2569, 1, 29, 7, 'Sedang', -6.185400, 107.182400),
(15, 'Karangbahagia', 'Karno, S.Sos', 128500, 39400, 46.10, 2787, 1, 31, 8, 'Sedang', -6.225400, 107.162400),
(16, 'Kedungwaringin', 'Masmur, S.Pd', 72300, 22100, 31.53, 2293, 1, 22, 7, 'Sedang', -6.275400, 107.245400),
(17, 'Pebayuran', 'H. Hanief, S.Sos', 105200, 32200, 94.21, 1116, 1, 34, 13, 'Berkembang', -6.155400, 107.242400),
(18, 'Sukakarya', 'Joni Hamid', 54800, 16800, 42.40, 1292, 1, 18, 7, 'Berkembang', -6.142400, 107.155400),
(19, 'Sukawangi', 'Parno, S.AP', 51200, 15700, 47.96, 1067, 1, 17, 7, 'Berkembang', -6.162400, 107.105400),
(20, 'Tambelang', 'Cecep Supriyadi', 42100, 12900, 34.97, 1203, 1, 16, 7, 'Berkembang', -6.195400, 107.118400),
(21, 'Cabangbungin', 'Asep Buhori', 58400, 17900, 49.70, 1175, 1, 20, 8, 'Berkembang', -6.075400, 107.165400),
(22, 'Muaragembong', 'Dr. Sukarmawan', 44200, 13500, 140.09, 315, 1, 19, 6, 'Pesisir / Konservasi', -5.965400, 107.042400),
(23, 'Bojongmangu', 'H. Agung Suganda', 28950, 8850, 30.06, 963, 1, 14, 6, 'Berkembang', -6.425400, 107.182400);

INSERT INTO statistik_penduduk (kategori, label, jumlah, tahun) VALUES
('usia', 'Balita (0-4 Thn)', 280000, 2026),
('usia', 'Anak/Sekolah (5-14 Thn)', 520000, 2026),
('usia', 'Usia Produktif (15-64 Thn)', 2145000, 2026),
('usia', 'Lansia (65+ Thn)', 269850, 2026),
('pekerjaan', 'Karyawan Pabrik/Industri', 1250000, 2026),
('pekerjaan', 'Wiraswasta/UMKM', 580000, 2026),
('pekerjaan', 'Petani & Nelayan', 185000, 2026),
('pekerjaan', 'PNS/TNI/Polri', 85000, 2026),
('pekerjaan', 'Jasa & Lainnya', 420000, 2026),
('pendidikan', 'SD/Sederajat', 18, 2026),
('pendidikan', 'SMP/Sederajat', 22, 2026),
('pendidikan', 'SMA/SMK', 45, 2026),
('pendidikan', 'Diploma/Sarjana (S1-S3)', 15, 2026),
('sosial', 'UHC BPJS Kesehatan (%)', 99.1, 2026),
('sosial', 'Penerima PKH', 142000, 2026),
('sosial', 'Bantuan BPNT/Sembako', 195000, 2026),
('sosial', 'KIP / Beasiswa Daerah', 88000, 2026);

-- 10. SEED BERITA RESMI DISKOMINFOSANTIK (Dipublikasikan Sebelum Oktober 2026)
INSERT INTO berita (id, kategori_id, judul, slug, konten, gambar, penulis, views, status, created_at) VALUES
(3, 3, 'Tingkatkan Literasi Keamanan Digital, Diskominfo Gelar Workshop Cyber Security untuk OPD', 'workshop-cyber-security-opd-bekasi-2026', '<p>Menghadapi eskalasi ancaman siber global, Bidang Persandian & Keamanan Informasi menyelenggarakan workshop peningkatan kapabilitas pencegahan kebocoran data dan penerapan Tanda Tangan Elektronik (TTE) tersertifikasi BSrE-BSSN untuk seluruh perwakilan instansi di Kabupaten Bekasi.</p>', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60', 'Bidang Persandian', 192, 'published', '2026-09-01 10:49:52'),
(5, 4, '[KLARIFIKASI HOAKS] Penipuan Tautan Pendaftaran Bantuan Sosial Digital Mengatasnamakan Pemkab Bekasi', 'klarifikasi-hoaks-tautan-bansos-digital-pemkab-bekasi-2026', '<p><strong>CIKARANG PUSAT</strong> &ndash; Dinas Komunikasi, Informatika, Persandian, dan Statistik (Diskominfosantik) Kabupaten Bekasi mengimbau seluruh lapisan masyarakat agar senantiasa waspada terhadap peredaran pesan berantai dan tautan ilegal di media sosial serta grup percakapan WhatsApp yang mengatasnamakan program \"Bantuan Sosial Digital Pemkab Bekasi 2026\".</p><p>Kepala Bidang Informasi dan Komunikasi Publik (IKP) menegaskan bahwa informasi mengenai pengisian formulir pendaftaran bantuan tunai mandiri melalui situs web tidak resmi tersebut adalah <strong>100% HOAKS / TIDAK BENAR</strong>. Tautan yang beredar diketahui merupakan modus kejahatan siber berupa <em>phishing</em> yang bertujuan mencuri data pribadi kependudukan warga seperti NIK, nomor telepon, dan data rekening perbankan.</p><blockquote class=\"p-3 my-3 bg-light border-start border-4 border-danger rounded-end\"><p class=\"mb-0 fw-semibold text-danger\"><i class=\"bi bi-shield-exclamation me-2\"></i>Pemberitahuan Resmi Diskominfo:</p><p class=\"mb-0 text-muted small mt-1\">\"Pemerintah Kabupaten Bekasi tidak pernah merilis pendaftaran bantuan sosial melalui tautan gratisan (seperti bit.ly, blogspot, atau domain non-pemerintah). Seluruh informasi bantuan sosial disalurkan secara resmi melalui Dinas Sosial Kabupaten Bekasi dan terverifikasi pada kanal resmi domain <strong>bekasikab.go.id</strong>.\"</p></blockquote><p>Masyarakat diimbau untuk selalu menerapkan prinsip <strong>Saring Sebelum Sharing</strong>. Apabila menemukan indikasi penyebaran informasi palsu atau hoaks, warga dapat memverifikasinya melalui kanal Cek Fakta di portal resmi ini atau menyampaikan aduan melalui layanan tanggap laporan digital Diskominfosantik Kabupaten Bekasi.</p>', '/uploads/berita/klarifikasi-bansos-digital-2026.jpg', 'Bidang Informasi & Komunikasi Publik', 248, 'published', '2026-09-09 08:30:00'),
(6, 2, 'Percepat Smart City, Diskominfo Perluas Jaringan Internet Fiber Optik Terintegrasi ke 187 Desa', 'perluas-jaringan-fiber-optik-terintegrasi-187-desa-bekasi', '<p><strong>CIKARANG PUSAT</strong> &ndash; Mewujudkan akselerasi transformasi digital dan pemerataan Sistem Pemerintahan Berbasis Elektronik (SPBE), Diskominfosantik Kabupaten Bekasi secara resmi menuntaskan penggelaran jaringan kabel <em>fiber optic</em> (FO) intra-pemerintah yang menghubungkan seluruh 187 kantor desa dan kelurahan di 23 kecamatan se-Kabupaten Bekasi.</p><p>Pengembangan jaringan pita lebar (broadband) berkecepatan tinggi ini merupakan langkah strategis daerah untuk mengikis kesenjangan digital (<em>digital divide</em>) di wilayah pinggiran, sekaligus menjamin kestabilan koneksi antarkantor pemerintahan desa dalam mengoperasikan aplikasi pelayanan administrasi kependudukan dan surat-menyurat terpadu.</p><blockquote class=\"p-3 my-3 bg-light border-start border-4 border-primary rounded-end\"><p class=\"mb-0 fw-semibold text-primary\"><i class=\"bi bi-hdd-network-fill me-2\"></i>Konektivitas Cepat & Terenkripsi:</p><p class=\"mb-0 text-muted small mt-1\">\"Dengan tersambungnya 187 desa dalam jaringan intranet pemerintah yang terisolasi dan terlindungi oleh firewall terpusat, pengiriman berkas permohonan surat warga kini dapat diproses seketika tanpa kendala sinyal lemot ataupun ancaman kebocoran data jaringan luar.\"</p></blockquote><p>Program penguatan infrastruktur telekomunikasi ini juga menjadi landasan utama bagi integrasi kamera pemantau (CCTV) ketertiban umum di titik-titik krusial kecamatan serta penyediaan titik akses <em>Free Wi-Fi</em> ruang publik bagi masyarakat di alun-alun dan pusat kegiatan warga kecamatan.</p>', '/uploads/berita/jaringan-fiber-optik-desa-2026.jpg', 'Bidang Infrastruktur TIK', 312, 'published', '2026-09-17 10:15:00'),
(7, 1, 'Wujudkan Transparansi Kebijakan, Pemkab Bekasi Resmikan Dashboard Satu Data Terpadu 2026', 'peresmian-dashboard-satu-data-terpadu-kabupaten-bekasi-2026', '<p><strong>CIKARANG PUSAT</strong> &ndash; Pemerintah Kabupaten Bekasi melalui Diskominfosantik bersama Badan Pusat Statistik (BPS) resmi meluncurkan integrasi Portal Statistik Sektoral dan <em>Dashboard Satu Data Terpadu 2026</em>. Peluncuran ini menjadi wujud komitmen Pemkab Bekasi dalam mewujudkan tata kelola pemerintahan terbuka berbasis data yang valid, akurat, dan dapat dipertanggungjawabkan (<em>data-driven governance</em>).</p><p>Dashboard terpadu ini menyajikan kompilasi data makro daerah secara interaktif, mulai dari demografi kependudukan yang kini menembus 3,24 juta jiwa, persebaran angkatan kerja industri di Cikarang dan sekitarnya, angka Indeks Pembangunan Manusia (IPM) kategori Tinggi sebesar 75.80, hingga capaian Universal Health Coverage (UHC) BPJS Kesehatan yang melampaui 99,1%.</p><blockquote class=\"p-3 my-3 bg-light border-start border-4 border-success rounded-end\"><p class=\"mb-0 fw-semibold text-success\"><i class=\"bi bi-graph-up-arrow me-2\"></i>Akurasi Data untuk Kebijakan Tepat Sasaran:</p><p class=\"mb-0 text-muted small mt-1\">\"Satu Data Kabupaten Bekasi memastikan tidak ada lagi tumpang tindih data antar-perangkat daerah. Setiap program bantuan, penganggaran fasilitas kesehatan, dan perbaikan sarana jalan kini dapat diputuskan dengan acuan data geospasial presisi.\"</p></blockquote><p>Seluruh masyarakat, insan akademisi, mahasiswa, dan peneliti kini dapat memanfaatkan visualisasi data statistik sektoral ini secara terbuka melalui menu portal Satu Data Kabupaten Bekasi untuk keperluan studi, kajian ilmiah, serta pengawasan pelayanan publik.</p>', '/uploads/berita/dashboard-satu-data-bekasi-2026.jpg', 'Bidang Statistik & Evaluasi', 185, 'published', '2026-09-25 14:00:00')
ON DUPLICATE KEY UPDATE judul = VALUES(judul), slug = VALUES(slug), konten = VALUES(konten), gambar = VALUES(gambar), penulis = VALUES(penulis), views = VALUES(views), status = VALUES(status), created_at = VALUES(created_at);