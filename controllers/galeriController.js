const { db } = require("../config/database");

exports.getGaleriPage = async (req, res) => {
  try {
    const { tipe, tahun } = req.query;

    let sql = "SELECT * FROM galeri WHERE 1=1";
    const params = [];

    if (tipe && ["foto", "video", "infografis"].includes(tipe)) {
      sql += " AND tipe = ?";
      params.push(tipe);
    }

    if (tahun) {
      sql += " AND YEAR(created_at) = ?";
      params.push(tahun);
    }

    sql += " ORDER BY created_at DESC";
    const [items] = await db.query(sql, params);

    // Filter terpisah untuk tab view
    const fotoList = items.filter((i) => i.tipe === "foto");
    const videoList = items.filter((i) => i.tipe === "video");
    const infografisList = items.filter((i) => i.tipe === "infografis");

    res.render("pages/galeri/index", {
      title: "Galeri Foto & Info Terbaru Warga",
      currentPage: "galeri",
      allItems: items,
      fotoList,
      videoList,
      infografisList,
      selectedTipe: tipe || "semua",
      selectedTahun: tahun || "",
    });
  } catch (error) {
    console.error("Error memuat galeri:", error);
    res.status(500).send("Terjadi kesalahan memuat galeri.");
  }
};
