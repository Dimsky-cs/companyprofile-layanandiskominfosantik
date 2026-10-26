const { db } = require("../config/database");

// 1. Tampilkan Daftar Berita & Smart Filter (Dengan Pagination)
exports.getBeritaList = async (req, res) => {
  try {
    const { kategori, cari, page } = req.query;
    const pageNum = parseInt(page) || 1;
    const limit = 6;
    const offset = (pageNum - 1) * limit;

    // Ambil Semua Kategori untuk Filter Tabs
    const [kategoriList] = await db.query("SELECT * FROM kategori_berita ORDER BY id ASC");

    // Build Query Dasar
    let baseSql = ` FROM berita b LEFT JOIN kategori_berita k ON b.kategori_id = k.id WHERE b.status = 'published'`;
    const params = [];

    if (kategori) {
      baseSql += ` AND k.slug = ?`;
      params.push(kategori);
    }
    if (cari) {
      baseSql += ` AND (b.judul LIKE ? OR b.konten LIKE ?)`;
      params.push(`%${cari}%`, `%${cari}%`);
    }

    // Hitung Total Data untuk Paginasi
    const [countResult] = await db.query(`SELECT COUNT(*) as total ${baseSql}`, params);
    const totalData = countResult[0].total;
    const totalPages = Math.ceil(totalData / limit);

    // Ambil Data Berita
    const [beritaList] = await db.query(
      `SELECT b.*, k.nama_kategori, k.slug as kategori_slug ${baseSql} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.render("pages/berita/index", {
      title: "Kabar & Publikasi Berita Daerah",
      currentPage: "berita",
      beritaList,
      kategoriList,
      selectedKategori: kategori || "",
      searchQuery: cari || "",
      currentPageNum: pageNum,
      totalPages: totalPages
    });
  } catch (error) {
    console.error("Error memuat berita:", error);
    res.status(500).send("Terjadi kesalahan memuat berita.");
  }
};

// 2. Tampilkan Detail Berita, Hitung Estimasi Waktu Baca, & Rekomendasi (SEO Open Graph)
exports.getBeritaDetail = async (req, res) => {
  try {
    const { slug } = req.params;

    const [rows] = await db.query(
      `SELECT b.*, k.nama_kategori, k.slug as kategori_slug 
             FROM berita b 
             LEFT JOIN kategori_berita k ON b.kategori_id = k.id 
             WHERE b.slug = ? AND b.status = 'published'`,
      [slug]
    );

    if (rows.length === 0) return res.status(404).send("Berita tidak ditemukan.");
    const berita = rows[0];

    // Increment Views Counter
    await db.query("UPDATE berita SET views = views + 1 WHERE id = ?", [berita.id]);

    const textContent = berita.konten.replace(/<[^>]*>?/gm, "");
    const wordCount = textContent.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 180);

    const [beritaTerkait] = await db.query(
      `SELECT * FROM berita WHERE id != ? AND status = 'published' ORDER BY created_at DESC LIMIT 3`,
      [berita.id]
    );

    res.render("pages/berita/detail", {
      title: berita.judul,
      currentPage: "berita",
      berita,
      readTime,
      textContent,
      beritaTerkait,
      og: {
        title: berita.judul,
        description: textContent.substring(0, 150) + "...",
        image: berita.gambar || 'http://localhost:3000/images/logo.png',
        url: `http://localhost:3000/berita/${berita.slug}`
      }
    });
  } catch (error) {
    console.error("Error detail berita:", error);
    res.status(500).send("Terjadi kesalahan memuat artikel.");
  }
};
