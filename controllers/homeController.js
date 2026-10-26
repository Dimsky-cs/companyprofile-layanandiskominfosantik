const { db } = require("../config/database");

exports.getHomePage = async (req, res) => {
  try {
    // 1. Ambil 3 Berita Terbaru
    const [berita] = await db.query(
      `SELECT b.*, k.nama_kategori 
             FROM berita b 
             LEFT JOIN kategori_berita k ON b.kategori_id = k.id 
             WHERE b.status = 'published' 
             ORDER BY b.created_at DESC LIMIT 3`,
    );

    // 2. Ambil Galeri Dokumentasi Terbaru (Maksimal 6)
    const [galeri] = await db.query(
      `SELECT * FROM galeri ORDER BY created_at DESC LIMIT 6`,
    );

    // 3. Ambil Profil Dinas Singkat
    const [profilRows] = await db.query("SELECT * FROM profil_dinas LIMIT 1");
    const profil = profilRows[0] || {};

    // 4. Data Statistik Kependudukan Ramah Warga (Dari Database)
    let stats = {
      totalPenduduk: "3.214.850",
      totalKK: "984.210",
      cakupanWilayah: "23 Kecamatan • 187 Desa/Kelurahan",
      uhcRate: "99.1%", // Jaminan BPJS Kesehatan
      usiaProduktif: "66.8%",
      rasioLaki: "51%",
      rasioPerempuan: "49%",
    };
    try {
      const [statRows] = await db.query("SELECT * FROM statistik_ringkasan LIMIT 1");
      if (statRows && statRows.length > 0) {
        const sr = statRows[0];
        stats = {
          totalPenduduk: sr.total_penduduk || stats.totalPenduduk,
          totalKK: sr.total_kk || stats.totalKK,
          cakupanWilayah: sr.cakupan_wilayah || stats.cakupanWilayah,
          uhcRate: sr.uhc_rate || stats.uhcRate,
          usiaProduktif: sr.usia_produktif || stats.usiaProduktif,
          rasioLaki: sr.rasio_laki || stats.rasioLaki,
          rasioPerempuan: sr.rasio_perempuan || stats.rasioPerempuan,
        };
      }
    } catch (errStat) {
      console.error("Error query stats beranda:", errStat.message);
    }

    res.render("pages/index", {
      title: "Portal Pelayanan Publik & Informasi Terpadu",
      currentPage: "beranda",
      berita,
      galeri,
      profil,
      stats,
    });
  } catch (error) {
    console.error("Error memuat halaman beranda:", error);
    res.status(500).send("Terjadi kesalahan pada server.");
  }
};

// Quick Tracker
exports.trackStatus = async (req, res) => {
  const { trackingId } = req.body;
  try {
    if (!trackingId) return res.redirect("/");

    const [aduan] = await db.query(
      "SELECT * FROM pengaduan WHERE kode_tiket = ?",
      [trackingId.trim()],
    );
    if (aduan.length > 0) {
      return res.redirect(
        `/pengaduan?tiket=${encodeURIComponent(trackingId.trim())}`,
      );
    }

    const [surat] = await db.query(
      "SELECT * FROM layanan_surat WHERE nomor_surat = ? OR nik = ?",
      [trackingId.trim(), trackingId.trim()],
    );
    if (surat.length > 0) {
      return res.redirect(
        `/surat?tracking=${encodeURIComponent(trackingId.trim())}`,
      );
    }

    res.render("pages/index", {
      title: "Portal Pelayanan Publik",
      currentPage: "beranda",
      berita: [],
      galeri: [],
      profil: {},
      stats: {
        totalPenduduk: "3.214.850",
        totalKK: "984.210",
        cakupanWilayah: "23 Kecamatan • 187 Desa/Kelurahan",
        uhcRate: "99.1%",
        usiaProduktif: "66.8%",
        rasioLaki: "51%",
        rasioPerempuan: "49%",
      },
      trackerError: `Nomor Tracking / Tiket "${trackingId}" tidak ditemukan. Silakan periksa kembali.`,
    });
  } catch (error) {
    console.error("Error tracking status:", error);
    res.redirect("/");
  }
};
