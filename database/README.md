# Panduan Database MySQL - Portal DISKOMINFOSANTIK Kab. Bekasi

File `database.sql` berisi struktur skema tabel dan data awal (seeding) untuk aplikasi portal.

## Spesifikasi Database
- **Nama Database**: `portal_diskominfo_bekasi`
- **Default User**: `root`
- **Default Port**: `3306`

## Cara Import Database:

### Opsi 1: Melalui phpMyAdmin (XAMPP / Laragon)
1. Buka browser dan akses `http://localhost/phpmyadmin`
2. Klik tab **Import** (atau buat database baru bernama `portal_diskominfo_bekasi` lalu pilih database tersebut)
3. Pilih file `database/database.sql`
4. Klik tombol **Go** / **Kirim** di bagian bawah.

### Opsi 2: Melalui Terminal / Command Prompt
```bash
mysql -u root -p < database/database.sql
```
*(Jika tidak menggunakan password, hilangkan `-p`)*

## Daftar Tabel Utama:
1. `users` - Akun Administrator dan Petugas
2. `profil_dinas` - Data profil, visi, misi, dan kontak instansi
3. `struktur_organisasi` - Bagan hierarki SOTK pejabat dinas
4. `layanan_surat` - Pelayanan persuratan digital masyarakat & status proses
5. `pengaduan` - Formulir & tiket aspirasi/pengaduan masyarakat
6. `berita` - Publikasi artikel & warta dinas
7. `galeri` - Foto & dokumentasi kegiatan dinas
8. `statistik_sektoral` & `metadata_statistik` - Data statistik Satu Data Bekasi
9. `site_settings` - Pengaturan global portal (Maintenance mode, dll.)
