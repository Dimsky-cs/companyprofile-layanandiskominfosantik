const { db } = require("../config/database");

exports.getStatistikPage = async (req, res) => {
  try {
    // 1. Ambil Indikator Makro dari Database
    let ringkasan = {
      totalPenduduk: "3.214.850",
      rasioLaki: "51%",
      rasioPerempuan: "49%",
      totalKK: "984.210",
      skorIPM: "75.80",
      predikatIPM: "Tinggi",
      cakupanWilayah: "23 Kecamatan • 187 Desa/Kel.",
      kepadatan: "2.523",
      luasWilayah: "1.273,88 km²",
      uhcRate: "99.1%",
      melekHuruf: "99.2%",
      tpak: "68.5%",
      usiaProduktif: "66.8%",
      sumberData: "Disdukcapil & BPS Kabupaten Bekasi",
      tahunData: "2026",
    };

    const [rRows] = await db.query("SELECT * FROM statistik_ringkasan LIMIT 1");
    if (rRows && rRows.length > 0) {
      const r = rRows[0];
      ringkasan = {
        totalPenduduk: r.total_penduduk || ringkasan.totalPenduduk,
        rasioLaki: r.rasio_laki || ringkasan.rasioLaki,
        rasioPerempuan: r.rasio_perempuan || ringkasan.rasioPerempuan,
        totalKK: r.total_kk || ringkasan.totalKK,
        skorIPM: r.skor_ipm || ringkasan.skorIPM,
        predikatIPM: r.predikat_ipm || ringkasan.predikatIPM,
        cakupanWilayah: r.cakupan_wilayah || ringkasan.cakupanWilayah,
        kepadatan: r.kepadatan || ringkasan.kepadatan,
        luasWilayah: r.luas_wilayah || ringkasan.luasWilayah,
        uhcRate: r.uhc_rate || ringkasan.uhcRate,
        melekHuruf: r.melek_huruf || ringkasan.melekHuruf,
        tpak: r.tpak || ringkasan.tpak,
        usiaProduktif: r.usia_produktif || ringkasan.usiaProduktif,
        sumberData: r.sumber_data || ringkasan.sumberData,
        tahunData: r.tahun_data || ringkasan.tahunData,
      };
    }

    // 2. Ambil Data 23 Kecamatan dari Database
    const [kRows] = await db.query("SELECT * FROM statistik_kecamatan ORDER BY id ASC");
    let kecamatanList = [];
    if (kRows && kRows.length > 0) {
      kecamatanList = kRows.map((k) => ({
        id: k.id,
        nama: k.nama,
        camat: k.camat,
        penduduk: Number(k.penduduk),
        kk: Number(k.kk),
        luas: Number(k.luas),
        kepadatan: Number(k.kepadatan),
        puskesmas: Number(k.puskesmas),
        sekolah: Number(k.sekolah),
        kantorDesa: Number(k.kantor_desa),
        zona: k.zona,
        lat: Number(k.lat),
        lng: Number(k.lng),
      }));
    }

    // 3. Ambil Data Indikator Grafik dari Database (Chart.js)
    const [pRows] = await db.query("SELECT * FROM statistik_penduduk ORDER BY id ASC");
    const chartData = {
      usia: pRows.filter((p) => p.kategori === "usia"),
      pekerjaan: pRows.filter((p) => p.kategori === "pekerjaan"),
      pendidikan: pRows.filter((p) => p.kategori === "pendidikan"),
      sosial: pRows.filter((p) => p.kategori === "sosial"),
    };

    res.render("pages/statistik", {
      title: "Statistik & Satu Data Kependudukan",
      currentPage: "statistik",
      ringkasan,
      kecamatanList,
      chartData,
    });
  } catch (error) {
    console.error("Error memuat statistik kependudukan:", error);
    res.status(500).send("Terjadi kesalahan memuat data kependudukan.");
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const [kRows] = await db.query("SELECT * FROM statistik_kecamatan ORDER BY id ASC");
    let csv = "No,Kecamatan,Camat,Jumlah Penduduk,Jumlah KK,Luas Wilayah (km2),Kepadatan (Jiwa/km2),Puskesmas,Sekolah,Kantor Desa,Zona,Latitude,Longitude\n";
    kRows.forEach((k, idx) => {
      csv += `${idx + 1},"${k.nama}","${k.camat}",${k.penduduk},${k.kk},${k.luas},${k.kepadatan},${k.puskesmas},${k.sekolah},${k.kantor_desa},"${k.zona}",${k.lat},${k.lng}\n`;
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=data-kependudukan-23-kecamatan-bekasikab.csv");
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error export CSV:", error);
    res.status(500).send("Gagal ekspor CSV.");
  }
};

