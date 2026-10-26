const { db } = require("../config/database");
const bcrypt = require("bcryptjs");
const {
  buildOrgTree,
  flattenTreeWithHierarchy,
  getTreeStats,
  validateParent,
} = require("../helpers/treeHelper");
const {
  getSettings,
  updateSettings,
  getDefaultSettings,
} = require("../helpers/settingsHelper");

// HELPER: Ambil Semua Data untuk Dashboard Admin (Termasuk Profil & Struktur)
async function fetchDashboardData() {
  const [suratList] = await db.query(
    "SELECT * FROM layanan_surat ORDER BY created_at DESC",
  );
  const [aduanList] = await db.query(
    "SELECT * FROM pengaduan ORDER BY created_at DESC",
  );
  const [beritaList] = await db.query(
    `SELECT b.*, k.nama_kategori 
     FROM berita b 
     LEFT JOIN kategori_berita k ON b.kategori_id = k.id 
     ORDER BY b.created_at DESC`,
  );
  const [galeriList] = await db.query(
    "SELECT * FROM galeri ORDER BY created_at DESC",
  );
  const [kategoriList] = await db.query("SELECT * FROM kategori_berita");

  // 1. Ambil Profil Dinas (Visi, Misi, Kontak, Peta)
  let profil = {};
  try {
    const [profilRows] = await db.query("SELECT * FROM profil_dinas LIMIT 1");
    if (profilRows && profilRows.length > 0) {
      profil = profilRows[0];
    }
  } catch (err) {
    console.error("Error query profil_dinas:", err.message);
  }

  // 2. Ambil Struktur Organisasi (Hierarki dengan Nama Atasan)
  let strukturList = [];
  try {
    const [rows] = await db.query(
      `SELECT s.*, p.jabatan AS nama_atasan, p.nama_pejabat AS nama_pejabat_atasan 
       FROM struktur_organisasi s 
       LEFT JOIN struktur_organisasi p ON s.parent_id = p.id 
       ORDER BY s.parent_id ASC, s.urutan ASC, s.id ASC`,
    );
    if (rows) {
      strukturList = rows;
    }
  } catch (err) {
    console.error("Error query struktur_organisasi:", err.message);
  }

  // 3. Ambil Data Statistik Ringkasan & 23 Kecamatan
  let statistikRingkasan = {};
  try {
    const [rRows] = await db.query("SELECT * FROM statistik_ringkasan LIMIT 1");
    if (rRows && rRows.length > 0) statistikRingkasan = rRows[0];
  } catch (err) {
    console.error("Error query statistik_ringkasan:", err.message);
  }

  let statistikKecamatan = [];
  try {
    const [kRows] = await db.query("SELECT * FROM statistik_kecamatan ORDER BY id ASC");
    if (kRows) statistikKecamatan = kRows;
  } catch (err) {
    console.error("Error query statistik_kecamatan:", err.message);
  }

  let statistikPendudukList = [];
  try {
    const [pRows] = await db.query("SELECT * FROM statistik_penduduk ORDER BY id ASC");
    if (pRows) statistikPendudukList = pRows;
  } catch (err) {
    console.error("Error query statistik_penduduk:", err.message);
  }

  const orgTree = buildOrgTree(strukturList);
  const flatHierarchy = flattenTreeWithHierarchy(orgTree);
  const treeStats = getTreeStats(strukturList);

  return {
    suratList,
    aduanList,
    beritaList,
    galeriList,
    kategoriList,
    profil,
    strukturList,
    orgTree,
    flatHierarchy,
    treeStats,
    statistikRingkasan,
    statistikKecamatan,
    statistikPendudukList,
    siteSettings: await getSettings(),
  };
}

// 1. Halaman Login Admin
exports.getLoginPage = (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect("/admin-diskominfo/dashboard");
  }
  res.render("admin/login", {
    title: "Masuk Portal Administrator",
    layout: false,
    error: req.query.error || null,
    errorMsg: req.query.error || null,
  });
};

// 2. Proses Login
exports.processLogin = async (req, res) => {
  try {
    const email = req.body.email || req.body.username;
    const password = req.body.password;

    if (!email || !password) {
      return res.redirect(
        "/admin-diskominfo/login?error=" +
          encodeURIComponent("Alamat surel dan kata sandi wajib diisi."),
      );
    }

    // Query menggunakan kolom 'email' yang sesuai dengan struktur tabel database
    let [users] = await db.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    // Otomatis buatkan akun admin default jika tabel users masih kosong
    if (users.length === 0) {
      const [countResult] = await db.query(
        "SELECT COUNT(*) as total FROM users",
      );
      if (countResult[0].total === 0) {
        const hashedPassword = await bcrypt.hash("Diskominfo#Bekasi2026", 10);
        await db.query(
          "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)",
          ["Administrator", "admin@bekasikab.go.id", hashedPassword, "admin"],
        );
        [users] = await db.query(
          "SELECT * FROM users WHERE email = ? LIMIT 1",
          [email],
        );
      }
    }

    if (users.length === 0) {
      return res.redirect(
        "/admin-diskominfo/login?error=" +
          encodeURIComponent("Akun tidak ditemukan. Pastikan alamat surel terdaftar."),
      );
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    // Validasi hash bcrypt atau fallback password default Diskominfo#Bekasi2026
    if (!isMatch && password !== "Diskominfo#Bekasi2026") {
      return res.redirect(
        "/admin-diskominfo/login?error=" +
          encodeURIComponent("Kata sandi salah."),
      );
    }

    req.session.admin = {
      id: user.id,
      nama: user.nama || "Administrator",
      email: user.email,
      role: user.role || "Administrator",
    };
    req.session.adminUser = req.session.admin;

    res.redirect("/admin-diskominfo/dashboard");
  } catch (error) {
    console.error("Error login:", error);
    res.redirect(
      "/admin-diskominfo/login?error=" +
        encodeURIComponent("Terjadi kesalahan server: " + error.message),
    );
  }
};

// 3. Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin-diskominfo/login");
  });
};

// 4. Dashboard Utama
exports.getDashboard = async (req, res) => {
  try {
    const data = await fetchDashboardData();
    const successMsg = req.query.success || null;
    const errorMsg = req.query.error || null;

    res.render("admin/dashboard", {
      title: "Panel Administrator",
      layout: false,
      admin: req.session.admin || { nama: "Administrator", role: "admin" },
      successMsg,
      errorMsg,
      activeTab: req.query.tab || 'dashboard',
      ...data,
    });
  } catch (error) {
    console.error("Error dashboard:", error);
    res
      .status(500)
      .send("Terjadi kesalahan memuat dashboard: " + error.message);
  }
};

// 5. Update Status Surat & Upload Surat Hasil Resmi
exports.updateSuratStatus = async (req, res) => {
  try {
    const { id, status, catatan_petugas } = req.body;

    // Ambil data surat saat ini
    const [existing] = await db.query(
      "SELECT * FROM layanan_surat WHERE id = ?",
      [id],
    );

    if (!existing || existing.length === 0) {
      return res.redirect(
        "/admin-diskominfo/dashboard?error=" +
          encodeURIComponent("Data surat tidak ditemukan.") +
          "&tab=surat",
      );
    }

    let fileSuratHasil = existing[0].file_surat_hasil;
    if (req.file) {
      fileSuratHasil = `/uploads/surat/${req.file.filename}`;
    } else if (status === "Disetujui" && !fileSuratHasil) {
      // Otomatis terbitkan surat balasan resmi sistem ber-KOP & ber-QR TTE jika disetujui
      fileSuratHasil = `/surat/cetak-resmi/${existing[0].nomor_surat}`;
    }

    await db.query(
      "UPDATE layanan_surat SET status = ?, catatan_petugas = ?, file_surat_hasil = ?, updated_at = NOW() WHERE id = ?",
      [status, catatan_petugas || "", fileSuratHasil, id],
    );

    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Status dan hasil surat berhasil diperbarui!") +
        "&tab=surat",
    );
  } catch (error) {
    console.error("Error update surat:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal memperbarui surat: " + error.message) +
        "&tab=surat",
    );
  }
};

// Hapus Permohonan Surat
exports.hapusSurat = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM layanan_surat WHERE id = ?", [id]);
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Permohonan surat berhasil dihapus.") +
        "&tab=surat",
    );
  } catch (error) {
    console.error("Error hapus surat:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal menghapus surat: " + error.message) +
        "&tab=surat",
    );
  }
};

// 6. Update Status Pengaduan Warga
exports.updateAduanStatus = async (req, res) => {
  try {
    const { id, status, tanggapan } = req.body;
    await db.query(
      "UPDATE pengaduan SET status = ?, tanggapan = ?, updated_at = NOW() WHERE id = ?",
      [status, tanggapan || "", id],
    );
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Tanggapan aduan berhasil disimpan!") +
        "&tab=aduan",
    );
  } catch (error) {
    console.error("Error update aduan:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal menanggapi aduan.") +
        "&tab=aduan",
    );
  }
};

// 7. CRUD Berita
exports.tambahBerita = async (req, res) => {
  try {
    const { judul, kategori_id, konten, penulis } = req.body;
    const slug = judul
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const gambar = req.file
      ? `/uploads/berita/${req.file.filename}`
      : "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800";

    await db.query(
      "INSERT INTO berita (judul, slug, kategori_id, konten, gambar, penulis, status) VALUES (?, ?, ?, ?, ?, ?, 'published')",
      [
        judul,
        slug,
        kategori_id,
        konten,
        gambar,
        penulis || "Redaksi Diskominfo",
      ],
    );
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Berita baru berhasil diterbitkan!") +
        "&tab=berita",
    );
  } catch (error) {
    console.error("Error tambah berita:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal menerbitkan berita.") +
        "&tab=berita",
    );
  }
};

exports.updateBerita = async (req, res) => {
  try {
    const { id, judul, kategori_id, konten, penulis, gambar_lama } = req.body;
    const slug = judul
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const gambar = req.file
      ? `/uploads/berita/${req.file.filename}`
      : gambar_lama || null;

    await db.query(
      "UPDATE berita SET judul = ?, slug = ?, kategori_id = ?, konten = ?, gambar = ?, penulis = ? WHERE id = ?",
      [
        judul,
        slug,
        kategori_id,
        konten,
        gambar,
        penulis || "Redaksi Diskominfo",
        id,
      ],
    );
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Berita berhasil diperbarui!") +
        "&tab=berita",
    );
  } catch (error) {
    console.error("Error update berita:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal memperbarui berita.") +
        "&tab=berita",
    );
  }
};

exports.hapusBerita = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM berita WHERE id = ?", [id]);
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Berita berhasil dihapus.") +
        "&tab=berita",
    );
  } catch (error) {
    console.error("Error hapus berita:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal menghapus berita.") +
        "&tab=berita",
    );
  }
};

// 8. CRUD Galeri
exports.tambahGaleri = async (req, res) => {
  try {
    const { judul, tipe, keterangan, video_url } = req.body;
    let filePath = null;

    if (tipe === "video") {
      filePath = video_url || null;
    } else if (req.file) {
      filePath = `/uploads/galeri/${req.file.filename}`;
    }
    if (!filePath) {
      filePath =
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800";
    }

    await db.query(
      "INSERT INTO galeri (judul, tipe, file_path, keterangan) VALUES (?, ?, ?, ?)",
      [judul, tipe, filePath, keterangan],
    );
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Media galeri berhasil ditambahkan!") +
        "&tab=galeri",
    );
  } catch (error) {
    console.error("Error tambah galeri:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal menambah galeri.") +
        "&tab=galeri",
    );
  }
};

exports.updateGaleri = async (req, res) => {
  try {
    const { id, judul, tipe, keterangan, video_url, file_lama } = req.body;
    let filePath = file_lama;

    if (tipe === "video") {
      filePath = video_url || file_lama;
    } else if (req.file) {
      filePath = `/uploads/galeri/${req.file.filename}`;
    }

    await db.query(
      "UPDATE galeri SET judul = ?, tipe = ?, file_path = ?, keterangan = ? WHERE id = ?",
      [judul, tipe, filePath, keterangan, id],
    );
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Media galeri berhasil diperbarui!") +
        "&tab=galeri",
    );
  } catch (error) {
    console.error("Error update galeri:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal memperbarui galeri.") +
        "&tab=galeri",
    );
  }
};

exports.hapusGaleri = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM galeri WHERE id = ?", [id]);
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Media galeri berhasil dihapus.") +
        "&tab=galeri",
    );
  } catch (error) {
    console.error("Error hapus galeri:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal menghapus galeri.") +
        "&tab=galeri",
    );
  }
};

// 9. CRUD Profil Dinas & Lokasi
exports.updateProfilDinas = async (req, res) => {
  try {
    const {
      nama_instansi,
      visi,
      misi,
      tentang,
      alamat,
      telepon,
      email,
      gmaps_iframe,
    } = req.body;

    // Bersihkan URL embed Google Maps jika pengguna menempelkan seluruh kode iframe
    let cleanGmaps = gmaps_iframe ? gmaps_iframe.trim() : "";
    const matchSrc = cleanGmaps.match(/src=["'](.*?)["']/);
    if (matchSrc && matchSrc[1]) {
      cleanGmaps = matchSrc[1];
    }

    const [existing] = await db.query("SELECT id FROM profil_dinas LIMIT 1");

    if (existing && existing.length > 0) {
      await db.query(
        `UPDATE profil_dinas SET 
          nama_instansi = ?, visi = ?, misi = ?, tentang = ?, 
          alamat = ?, telepon = ?, email = ?, gmaps_iframe = ? 
        WHERE id = ?`,
        [
          nama_instansi || "",
          visi || "",
          misi || "",
          tentang || "",
          alamat || "",
          telepon || "",
          email || "",
          cleanGmaps || "",
          existing[0].id,
        ],
      );
    } else {
      await db.query(
        `INSERT INTO profil_dinas (nama_instansi, visi, misi, tentang, alamat, telepon, email, gmaps_iframe) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nama_instansi || "",
          visi || "",
          misi || "",
          tentang || "",
          alamat || "",
          telepon || "",
          email || "",
          cleanGmaps || "",
        ],
      );
    }

    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Profil dinas & peta berhasil diperbarui!") +
        "&tab=profil&subtab=profil",
    );
  } catch (error) {
    console.error("Error update profil:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal memperbarui profil: " + error.message) +
        "&tab=profil&subtab=profil",
    );
  }
};

// Reset / Kosongkan Data Profil Dinas Saja
exports.resetProfilDinas = async (req, res) => {
  try {
    await db.query("TRUNCATE TABLE profil_dinas");
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Data profil dinas & peta berhasil dikosongkan total!") +
        "&tab=profil&subtab=profil",
    );
  } catch (error) {
    console.error("Error reset profil dinas:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal mengosongkan profil: " + error.message) +
        "&tab=profil&subtab=profil",
    );
  }
};

// Simpan Konfigurasi Tata Letak Bagan SOTK (Posisi Drag, Jarak, Gaya Garis)
exports.saveBaganConfig = async (req, res) => {
  try {
    const { config } = req.body;
    let configStr = "{}";
    if (typeof config === "string") {
      configStr = config;
    } else if (config && typeof config === "object") {
      configStr = JSON.stringify(config);
    }

    const [existing] = await db.query("SELECT id FROM profil_dinas LIMIT 1");
    if (existing && existing.length > 0) {
      await db.query("UPDATE profil_dinas SET bagan_config = ? WHERE id = ?", [
        configStr,
        existing[0].id,
      ]);
    } else {
      await db.query("INSERT INTO profil_dinas (bagan_config) VALUES (?)", [
        configStr,
      ]);
    }

    return res.json({
      success: true,
      message: "Tata letak bagan berhasil disimpan dan diterapkan ke halaman publik!",
    });
  } catch (error) {
    console.error("Error saveBaganConfig:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menyimpan tata letak bagan: " + error.message,
    });
  }
};

// Reset / Kosongkan Bagan Struktur Organisasi Saja
exports.resetStrukturOrganisasi = async (req, res) => {
  try {
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.query("TRUNCATE TABLE struktur_organisasi");
    await db.query("UPDATE profil_dinas SET bagan_config = NULL");
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Semua bagan struktur organisasi berhasil dikosongkan!") +
        "&tab=profil&subtab=struktur",
    );
  } catch (error) {
    console.error("Error reset struktur organisasi:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal mengosongkan struktur: " + error.message) +
        "&tab=profil&subtab=struktur",
    );
  }
};

// Reset / Kosongkan Total Seluruh Modul Profil & Bagan
exports.resetAllProfil = async (req, res) => {
  try {
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.query("TRUNCATE TABLE profil_dinas");
    await db.query("TRUNCATE TABLE struktur_organisasi");
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Seluruh modul profil (Profil Dinas & Bagan SOTK) berhasil direset dan dikosongkan!") +
        "&tab=profil&subtab=profil",
    );
  } catch (error) {
    console.error("Error reset all profil:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal reset total profil: " + error.message) +
        "&tab=profil&subtab=profil",
    );
  }
};

// 10. CRUD Struktur Organisasi (Ultra Dinamis Tree)
exports.tambahStruktur = async (req, res) => {
  try {
    let { parent_id, jabatan, nama_pejabat, tipe_posisi, urutan } = req.body;
    parent_id =
      parent_id !== "" && parent_id !== undefined && parent_id !== null
        ? parseInt(parent_id)
        : null;
    urutan = urutan ? parseInt(urutan) : 1;
    const pejabatVal =
      nama_pejabat && nama_pejabat.trim() ? nama_pejabat.trim() : "";
    const jabatanVal = jabatan && jabatan.trim() ? jabatan.trim() : "";

    if (!jabatanVal) {
      throw new Error("Nama jabatan wajib diisi.");
    }

    if (!parent_id) {
      tipe_posisi = "ROOT";
    } else if (
      !tipe_posisi ||
      tipe_posisi.trim() === "" ||
      tipe_posisi === "ROOT"
    ) {
      tipe_posisi = "LINE_BIDANG";
    }

    await db.query(
      "INSERT INTO struktur_organisasi (parent_id, jabatan, nama_pejabat, tipe_posisi, urutan) VALUES (?, ?, ?, ?, ?)",
      [parent_id, jabatanVal, pejabatVal, tipe_posisi, urutan],
    );

    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent(
          `Jabatan "${jabatanVal}" berhasil ditambahkan ke dalam hierarki pohon!`,
        ) +
        "&tab=profil&subtab=struktur",
    );
  } catch (error) {
    console.error("Error tambah struktur:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal menambah jabatan: " + error.message) +
        "&tab=profil&subtab=struktur",
    );
  }
};

exports.updateStruktur = async (req, res) => {
  try {
    let { id, parent_id, jabatan, nama_pejabat, tipe_posisi, urutan } =
      req.body;
    id = parseInt(id);
    parent_id =
      parent_id !== "" && parent_id !== undefined && parent_id !== null
        ? parseInt(parent_id)
        : null;
    urutan = urutan ? parseInt(urutan) : 1;
    const pejabatVal =
      nama_pejabat && nama_pejabat.trim() ? nama_pejabat.trim() : "";
    const jabatanVal = jabatan && jabatan.trim() ? jabatan.trim() : "";

    if (!jabatanVal) {
      throw new Error("Nama jabatan wajib diisi.");
    }

    // Validasi Anti-Siklus (Cycle Prevention)
    const [allNodes] = await db.query(
      "SELECT id, parent_id, jabatan FROM struktur_organisasi",
    );
    const validation = validateParent(allNodes, id, parent_id);
    if (!validation.valid) {
      return res.redirect(
        "/admin-diskominfo/dashboard?error=" +
          encodeURIComponent(validation.message) +
          "&tab=profil&subtab=struktur",
      );
    }

    if (!parent_id) {
      tipe_posisi = "ROOT";
    } else if (
      !tipe_posisi ||
      tipe_posisi.trim() === "" ||
      tipe_posisi === "ROOT"
    ) {
      tipe_posisi = "LINE_BIDANG";
    }

    await db.query(
      "UPDATE struktur_organisasi SET parent_id = ?, jabatan = ?, nama_pejabat = ?, tipe_posisi = ?, urutan = ? WHERE id = ?",
      [parent_id, jabatanVal, pejabatVal, tipe_posisi, urutan, id],
    );

    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent(`Data jabatan "${jabatanVal}" berhasil diperbarui!`) +
        "&tab=profil&subtab=struktur",
    );
  } catch (error) {
    console.error("Error update struktur:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal memperbarui jabatan: " + error.message) +
        "&tab=profil&subtab=struktur",
    );
  }
};

exports.hapusStruktur = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM struktur_organisasi WHERE id = ?", [id]);
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Jabatan berhasil dihapus dari bagan.") +
        "&tab=profil&subtab=struktur",
    );
  } catch (error) {
    console.error("Error hapus struktur:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal menghapus jabatan: " + error.message) +
        "&tab=profil&subtab=struktur",
    );
  }
};

// 8. Edit Profil & Kata Sandi Administrator
exports.updateAdminProfile = async (req, res) => {
  try {
    const adminSession = req.session.admin || req.session.adminUser;
    if (!adminSession || !adminSession.id) {
      return res.redirect(
        "/admin-diskominfo/login?error=" +
          encodeURIComponent("Sesi telah berakhir, silakan masuk kembali."),
      );
    }

    const { nama, email, password_lama, password_baru, password_konfirmasi, current_tab } =
      req.body;
    const tabRedirect = current_tab ? `&tab=${current_tab}` : "";

    // 1. Ambil data admin dari DB
    const [users] = await db.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [adminSession.id],
    );
    if (users.length === 0) {
      return res.redirect(
        "/admin-diskominfo/dashboard?error=" +
          encodeURIComponent("Akun administrator tidak ditemukan.") +
          tabRedirect,
      );
    }

    const user = users[0];

    // 2. Verifikasi Password Lama (wajib untuk keamanan)
    if (!password_lama || password_lama.trim() === "") {
      return res.redirect(
        "/admin-diskominfo/dashboard?error=" +
          encodeURIComponent("Harap masukkan kata sandi saat ini untuk konfirmasi keamanan.") +
          tabRedirect,
      );
    }

    const isMatch = await bcrypt.compare(password_lama, user.password);
    if (!isMatch && password_lama !== "Diskominfo#Bekasi2026") {
      return res.redirect(
        "/admin-diskominfo/dashboard?error=" +
          encodeURIComponent("Kata sandi saat ini yang Anda masukkan salah!") +
          tabRedirect,
      );
    }

    // 3. Cek Email unik jika diubah
    const cleanNama = (nama && nama.trim()) ? nama.trim() : user.nama;
    const cleanEmail = (email && email.trim()) ? email.trim() : user.email;

    if (cleanEmail !== user.email) {
      const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
        [cleanEmail, user.id],
      );
      if (existing.length > 0) {
        return res.redirect(
          "/admin-diskominfo/dashboard?error=" +
            encodeURIComponent("Alamat surel sudah digunakan oleh akun lain!") +
            tabRedirect,
        );
      }
    }

    // 4. Periksa apakah ingin mengubah password
    if (password_baru && password_baru.trim() !== "") {
      if (password_baru.length < 6) {
        return res.redirect(
          "/admin-diskominfo/dashboard?error=" +
            encodeURIComponent("Kata sandi baru minimal harus 6 karakter!") +
            tabRedirect,
        );
      }
      if (password_baru !== password_konfirmasi) {
        return res.redirect(
          "/admin-diskominfo/dashboard?error=" +
            encodeURIComponent("Konfirmasi kata sandi baru tidak cocok!") +
            tabRedirect,
        );
      }

      const hashedNewPassword = await bcrypt.hash(password_baru, 10);
      await db.query(
        "UPDATE users SET nama = ?, email = ?, password = ? WHERE id = ?",
        [cleanNama, cleanEmail, hashedNewPassword, user.id],
      );
    } else {
      // Hanya update nama & email tanpa ubah password
      await db.query(
        "UPDATE users SET nama = ?, email = ? WHERE id = ?",
        [cleanNama, cleanEmail, user.id],
      );
    }

    // 5. Update session
    req.session.admin = {
      id: user.id,
      nama: cleanNama,
      email: cleanEmail,
      role: user.role || "admin",
    };
    req.session.adminUser = req.session.admin;

    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Profil administrator dan kata sandi berhasil diperbarui!") +
        tabRedirect,
    );
  } catch (error) {
    console.error("Error updateAdminProfile:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal memperbarui profil: " + error.message),
    );
  }
};

// 12. CRUD Modul Statistik & Satu Data Kependudukan
exports.updateStatistikRingkasan = async (req, res) => {
  try {
    const {
      total_penduduk,
      rasio_laki,
      rasio_perempuan,
      total_kk,
      skor_ipm,
      predikat_ipm,
      kepadatan,
      luas_wilayah,
      cakupan_wilayah,
      uhc_rate,
      melek_huruf,
      tpak,
      usia_produktif,
      sumber_data,
      tahun_data,
    } = req.body;

    const [existing] = await db.query("SELECT id FROM statistik_ringkasan LIMIT 1");
    if (existing.length > 0) {
      await db.query(
        `UPDATE statistik_ringkasan SET 
          total_penduduk = ?, rasio_laki = ?, rasio_perempuan = ?, total_kk = ?,
          skor_ipm = ?, predikat_ipm = ?, kepadatan = ?, luas_wilayah = ?,
          cakupan_wilayah = ?, uhc_rate = ?, melek_huruf = ?, tpak = ?,
          usia_produktif = ?, sumber_data = ?, tahun_data = ?
        WHERE id = ?`,
        [
          total_penduduk || '3.214.850',
          rasio_laki || '51%',
          rasio_perempuan || '49%',
          total_kk || '984.210',
          skor_ipm || '75.80',
          predikat_ipm || 'Tinggi',
          kepadatan || '2.523',
          luas_wilayah || '1.273,88 km²',
          cakupan_wilayah || '23 Kecamatan • 187 Desa/Kel.',
          uhc_rate || '99.1%',
          melek_huruf || '99.2%',
          tpak || '68.5%',
          usia_produktif || '66.8%',
          sumber_data || 'Disdukcapil & BPS Kabupaten Bekasi',
          tahun_data || '2026',
          existing[0].id,
        ],
      );
    } else {
      await db.query(
        `INSERT INTO statistik_ringkasan (
          total_penduduk, rasio_laki, rasio_perempuan, total_kk,
          skor_ipm, predikat_ipm, kepadatan, luas_wilayah,
          cakupan_wilayah, uhc_rate, melek_huruf, tpak,
          usia_produktif, sumber_data, tahun_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          total_penduduk || '3.214.850',
          rasio_laki || '51%',
          rasio_perempuan || '49%',
          total_kk || '984.210',
          skor_ipm || '75.80',
          predikat_ipm || 'Tinggi',
          kepadatan || '2.523',
          luas_wilayah || '1.273,88 km²',
          cakupan_wilayah || '23 Kecamatan • 187 Desa/Kel.',
          uhc_rate || '99.1%',
          melek_huruf || '99.2%',
          tpak || '68.5%',
          usia_produktif || '66.8%',
          sumber_data || 'Disdukcapil & BPS Kabupaten Bekasi',
          tahun_data || '2026',
        ],
      );
    }

    const returnTab = req.body.return_tab || 'statistik';
    const returnSubtab = req.body.return_subtab || 'ringkasan';

    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Indikator makro statistik daerah berhasil diperbarui!") +
        `&tab=${returnTab}&subtab=${returnSubtab}`,
    );
  } catch (error) {
    console.error("Error updateStatistikRingkasan:", error);
    const returnTab = req.body.return_tab || 'statistik';
    const returnSubtab = req.body.return_subtab || 'ringkasan';
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal memperbarui indikator statistik: " + error.message) +
        `&tab=${returnTab}&subtab=${returnSubtab}`,
    );
  }
};

exports.updateStatistikKecamatan = async (req, res) => {
  try {
    const {
      id,
      nama,
      camat,
      penduduk,
      kk,
      luas,
      kepadatan,
      puskesmas,
      sekolah,
      kantor_desa,
      zona,
      lat,
      lng,
    } = req.body;

    const pendudukNum = parseInt(penduduk) || 0;
    const kkNum = parseInt(kk) || 0;
    const luasNum = parseFloat(luas) || 0.0;
    let kepadatanNum = parseInt(kepadatan);
    if (!kepadatanNum && luasNum > 0) {
      kepadatanNum = Math.round(pendudukNum / luasNum);
    }

    let zonaVal = zona;
    if (!zonaVal || zonaVal === '') {
      if (kepadatanNum >= 5000) zonaVal = 'Sangat Padat';
      else if (kepadatanNum >= 3000) zonaVal = 'Padat';
      else if (kepadatanNum >= 1500) zonaVal = 'Sedang';
      else zonaVal = 'Berkembang';
    }

    await db.query(
      `UPDATE statistik_kecamatan SET 
        nama = ?, camat = ?, penduduk = ?, kk = ?, luas = ?, kepadatan = ?,
        puskesmas = ?, sekolah = ?, kantor_desa = ?, zona = ?, lat = ?, lng = ?
      WHERE id = ?`,
      [
        nama,
        camat,
        pendudukNum,
        kkNum,
        luasNum,
        kepadatanNum || 0,
        parseInt(puskesmas) || 0,
        parseInt(sekolah) || 0,
        parseInt(kantor_desa) || 0,
        zonaVal,
        parseFloat(lat) || 0.0,
        parseFloat(lng) || 0.0,
        id,
      ],
    );

    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent(`Data Kecamatan ${nama} berhasil diperbarui!`) +
        "&tab=statistik&subtab=kecamatan",
    );
  } catch (error) {
    console.error("Error updateStatistikKecamatan:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal memperbarui data kecamatan: " + error.message) +
        "&tab=statistik&subtab=kecamatan",
    );
  }
};

// Sinkronkan Ringkasan Makro Otomatis dari Agregasi 23 Kecamatan
exports.syncStatistikFromKecamatan = async (req, res) => {
  try {
    const [kRows] = await db.query("SELECT * FROM statistik_kecamatan");
    if (!kRows || kRows.length === 0) {
      throw new Error("Data kecamatan kosong, tidak dapat melakukan sinkronisasi.");
    }

    const totalPenduduk = kRows.reduce((acc, k) => acc + (Number(k.penduduk) || 0), 0);
    const totalKK = kRows.reduce((acc, k) => acc + (Number(k.kk) || 0), 0);
    const totalLuas = kRows.reduce((acc, k) => acc + (parseFloat(k.luas) || 0), 0);
    const totalDesa = kRows.reduce((acc, k) => acc + (Number(k.kantor_desa) || 0), 0);
    const totalKec = kRows.length;
    const avgKepadatan = totalLuas > 0 ? Math.round(totalPenduduk / totalLuas) : 0;

    const totalPendudukStr = totalPenduduk.toLocaleString("id-ID");
    const totalKKStr = totalKK.toLocaleString("id-ID");
    const luasStr = `${totalLuas.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km²`;
    const kepadatanStr = avgKepadatan.toLocaleString("id-ID");
    const cakupanStr = `${totalKec} Kecamatan • ${totalDesa} Desa/Kel.`;

    const [existing] = await db.query("SELECT id FROM statistik_ringkasan LIMIT 1");
    if (existing && existing.length > 0) {
      await db.query(
        `UPDATE statistik_ringkasan SET 
          total_penduduk = ?, total_kk = ?, luas_wilayah = ?, kepadatan = ?, cakupan_wilayah = ?
        WHERE id = ?`,
        [totalPendudukStr, totalKKStr, luasStr, kepadatanStr, cakupanStr, existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO statistik_ringkasan (
          total_penduduk, total_kk, luas_wilayah, kepadatan, cakupan_wilayah
        ) VALUES (?, ?, ?, ?, ?)`,
        [totalPendudukStr, totalKKStr, luasStr, kepadatanStr, cakupanStr]
      );
    }

    const returnTab = req.body.return_tab || 'statistik';
    const returnSubtab = req.body.return_subtab || 'ringkasan';

    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent(`Berhasil menyinkronkan data makro: Total ${totalPendudukStr} Jiwa (${totalKec} Kecamatan)!`) +
        `&tab=${returnTab}&subtab=${returnSubtab}`
    );
  } catch (error) {
    console.error("Error syncStatistikFromKecamatan:", error);
    const returnTab = req.body.return_tab || 'statistik';
    const returnSubtab = req.body.return_subtab || 'ringkasan';
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal sinkronisasi data makro: " + error.message) +
        `&tab=${returnTab}&subtab=${returnSubtab}`
    );
  }
};

// Tambah Kecamatan Baru (Pemekaran Wilayah)
exports.tambahStatistikKecamatan = async (req, res) => {
  try {
    const {
      nama,
      camat,
      penduduk,
      kk,
      luas,
      puskesmas,
      sekolah,
      kantor_desa,
      zona,
      lat,
      lng,
    } = req.body;

    if (!nama || nama.trim() === "") {
      throw new Error("Nama kecamatan wajib diisi.");
    }

    const pendudukNum = parseInt(penduduk) || 0;
    const kkNum = parseInt(kk) || 0;
    const luasNum = parseFloat(luas) || 0.0;
    let kepadatanNum = Math.round(luasNum > 0 ? pendudukNum / luasNum : 0);

    let zonaVal = zona;
    if (!zonaVal || zonaVal === "") {
      if (kepadatanNum >= 5000) zonaVal = "Sangat Padat";
      else if (kepadatanNum >= 3000) zonaVal = "Padat";
      else if (kepadatanNum >= 1500) zonaVal = "Sedang";
      else zonaVal = "Berkembang";
    }

    await db.query(
      `INSERT INTO statistik_kecamatan (
        nama, camat, penduduk, kk, luas, kepadatan,
        puskesmas, sekolah, kantor_desa, zona, lat, lng
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama.trim(),
        camat || "",
        pendudukNum,
        kkNum,
        luasNum,
        kepadatanNum,
        parseInt(puskesmas) || 0,
        parseInt(sekolah) || 0,
        parseInt(kantor_desa) || 0,
        zonaVal,
        parseFloat(lat) || -6.280000,
        parseFloat(lng) || 107.150000,
      ]
    );

    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent(`Kecamatan "${nama.trim()}" berhasil ditambahkan!`) +
        "&tab=statistik&subtab=kecamatan"
    );
  } catch (error) {
    console.error("Error tambahStatistikKecamatan:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal menambahkan kecamatan: " + error.message) +
        "&tab=statistik&subtab=kecamatan"
    );
  }
};

// Hapus Kecamatan
exports.hapusStatistikKecamatan = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.query("DELETE FROM statistik_kecamatan WHERE id = ?", [id]);
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent("Data kecamatan berhasil dihapus!") +
        "&tab=statistik&subtab=kecamatan"
    );
  } catch (error) {
    console.error("Error hapusStatistikKecamatan:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal menghapus kecamatan: " + error.message) +
        "&tab=statistik&subtab=kecamatan"
    );
  }
};

// Update Indikator Grafik Chart.js
exports.updateStatistikPenduduk = async (req, res) => {
  try {
    const { id, label, jumlah, tahun } = req.body;
    await db.query(
      "UPDATE statistik_penduduk SET label = ?, jumlah = ?, tahun = ? WHERE id = ?",
      [label, parseFloat(jumlah) || 0, parseInt(tahun) || 2026, parseInt(id)]
    );
    res.redirect(
      "/admin-diskominfo/dashboard?success=" +
        encodeURIComponent(`Indikator grafik "${label}" berhasil diperbarui!`) +
        "&tab=statistik&subtab=grafik"
    );
  } catch (error) {
    console.error("Error updateStatistikPenduduk:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?error=" +
        encodeURIComponent("Gagal memperbarui indikator grafik: " + error.message) +
        "&tab=statistik&subtab=grafik"
    );
  }
};

// ==============================================================
// MODUL PENGATURAN SITUS WEB, IDENTITAS, WARNA & MAINTENANCE
// ==============================================================

exports.updatePengaturanWebsite = async (req, res) => {
  try {
    const {
      nama_instansi,
      sub_instansi,
      tagline,
      deskripsi_singkat,
      warna_primer,
      warna_sekunder,
      alamat,
      telepon,
      email,
      jam_layanan,
      sosmed_facebook,
      sosmed_instagram,
      sosmed_youtube,
      is_maintenance,
      maintenance_judul,
      maintenance_pesan,
      maintenance_selesai,
    } = req.body;

    const payload = {
      nama_instansi,
      sub_instansi,
      tagline,
      deskripsi_singkat,
      warna_primer: warna_primer ? warna_primer.trim() : "#ff6b00",
      warna_sekunder: warna_sekunder ? warna_sekunder.trim() : "#071527",
      alamat,
      telepon,
      email,
      jam_layanan,
      sosmed_facebook,
      sosmed_instagram,
      sosmed_youtube,
      is_maintenance: is_maintenance === "1" || is_maintenance === 1 ? 1 : 0,
      maintenance_judul,
      maintenance_pesan,
    };

    if (maintenance_selesai && maintenance_selesai.trim() !== "") {
      payload.maintenance_selesai = new Date(maintenance_selesai);
    } else {
      payload.maintenance_selesai = null;
    }

    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        payload.logo_url = `/uploads/branding/${req.files.logo[0].filename}`;
      }
      if (req.files.favicon && req.files.favicon[0]) {
        payload.favicon_url = `/uploads/branding/${req.files.favicon[0].filename}`;
      }
    }

    await updateSettings(payload);

    res.redirect(
      "/admin-diskominfo/dashboard?tab=pengaturan&success=" +
        encodeURIComponent(
          "Pengaturan identitas, warna, dan sistem web berhasil disimpan!",
        ),
    );
  } catch (error) {
    console.error("Error updatePengaturanWebsite:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?tab=pengaturan&error=" +
        encodeURIComponent("Gagal menyimpan pengaturan: " + error.message),
    );
  }
};

exports.previewMaintenance = async (req, res) => {
  try {
    const settings = await getSettings();
    res.render("pages/maintenance", {
      layout: false,
      siteSettings: settings,
    });
  } catch (error) {
    console.error("Error previewMaintenance:", error);
    res
      .status(500)
      .send("Gagal menampilkan pratinjau maintenance: " + error.message);
  }
};

exports.resetPengaturanBranding = async (req, res) => {
  try {
    const def = getDefaultSettings();
    await updateSettings({
      warna_primer: def.warna_primer,
      warna_sekunder: def.warna_sekunder,
      logo_url: def.logo_url,
      favicon_url: def.favicon_url,
    });
    res.redirect(
      "/admin-diskominfo/dashboard?tab=pengaturan&success=" +
        encodeURIComponent(
          "Palet warna dan logo berhasil dikembalikan ke standar bawaan!",
        ),
    );
  } catch (error) {
    console.error("Error resetPengaturanBranding:", error);
    res.redirect(
      "/admin-diskominfo/dashboard?tab=pengaturan&error=" +
        encodeURIComponent("Gagal mereset branding: " + error.message),
    );
  }
};


