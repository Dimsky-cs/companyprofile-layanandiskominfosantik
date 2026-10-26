const { db } = require("../config/database");

// 1. Tampilkan Halaman Pengaduan & Live Feed Status Board
exports.getPengaduanPage = async (req, res) => {
  try {
    const searchTiket = req.query.tiket || "";
    let hasilTiket = null;

    // Jika ada pencarian tiket spesifik
    if (searchTiket) {
      const [rows] = await db.query(
        "SELECT * FROM pengaduan WHERE kode_tiket = ?",
        [searchTiket.trim()],
      );
      if (rows.length > 0) {
        hasilTiket = rows[0];
      }
    }

    // Ambil Semua Aduan yang Bersifat Publik untuk Live Status Board
    const [aduanPublik] = await db.query(
      `SELECT id, kode_tiket, nama_pelapor, kategori_aduan, judul_aduan, isi_aduan, foto_bukti, status, tanggapan, created_at, updated_at 
             FROM pengaduan 
             WHERE sifat_aduan = 'Publik' 
             ORDER BY created_at DESC LIMIT 15`,
    );

    // Agregat Status Aduan
    const [countTotal] = await db.query("SELECT COUNT(*) as c FROM pengaduan");
    const [countProses] = await db.query(
      "SELECT COUNT(*) as c FROM pengaduan WHERE status = 'Diproses'",
    );
    const [countSelesai] = await db.query(
      "SELECT COUNT(*) as c FROM pengaduan WHERE status = 'Selesai'",
    );

    res.render("pages/pengaduan/index", {
      title: "Sistem Pengaduan & Lapor Warga",
      currentPage: "pengaduan",
      aduanPublik,
      searchTiket,
      hasilTiket,
      statsAduan: {
        total: countTotal[0]?.c || 0,
        proses: countProses[0]?.c || 0,
        selesai: countSelesai[0]?.c || 0,
      },
      errorMsg: req.query.error || null,
      successMsg: req.query.success || null,
    });
  } catch (error) {
    console.error("Error memuat halaman pengaduan:", error);
    res.status(500).send("Terjadi kesalahan memuat pengaduan.");
  }
};

// 2. Proses Pengiriman Laporan Aduan
exports.submitPengaduan = async (req, res) => {
  try {
    const {
      nama_pelapor,
      nik_pelapor,
      no_telp,
      kategori_aduan,
      judul_aduan,
      isi_aduan,
      sifat_aduan,
      math_answer,
      math_real,
    } = req.body;

    // Anti-spam math challenge
    if (parseInt(math_answer) !== parseInt(math_real)) {
      return res.redirect(
        "/pengaduan?error=" +
          encodeURIComponent("Verifikasi anti-spam tidak valid!"),
      );
    }

    // Generate Kode Tiket: TKT-ADU-2026-XXXX
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const kodeTiket = `TKT-ADU-2026-${rand}`;

    // File Bukti Foto
    const fotoBukti = req.file
      ? `/uploads/pengaduan/${req.file.filename}`
      : null;

    // Simpan ke database
    await db.query(
      `INSERT INTO pengaduan 
             (kode_tiket, nama_pelapor, nik_pelapor, no_telp, kategori_aduan, judul_aduan, isi_aduan, sifat_aduan, foto_bukti, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Terkirim')`,
      [
        kodeTiket,
        nama_pelapor,
        nik_pelapor,
        no_telp,
        kategori_aduan,
        judul_aduan,
        isi_aduan,
        sifat_aduan || "Publik",
        fotoBukti,
      ],
    );

    res.redirect(`/pengaduan?tiket=${encodeURIComponent(kodeTiket)}&success=1`);
  } catch (error) {
    console.error("Error simpan aduan:", error);
    res.redirect(
      "/pengaduan?error=" +
        encodeURIComponent("Gagal mengirim aduan: " + error.message),
    );
  }
};
