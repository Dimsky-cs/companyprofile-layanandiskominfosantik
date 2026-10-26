const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isAdminAuth } = require("../middlewares/authMiddleware");
const {
  uploadBerita,
  uploadGaleri,
  uploadSurat,
  uploadBranding,
} = require("../middlewares/uploadMiddleware");

// Fallback aman agar router tidak pernah crash jika fungsi belum terdefinisi
const safeHandler = (fn) =>
  typeof fn === "function"
    ? fn
    : (req, res) => res.redirect("/admin-diskominfo/dashboard");

// 1. Auth Login & Logout
router.get("/login", safeHandler(adminController.getLoginPage));
router.post("/login", safeHandler(adminController.processLogin));
router.get("/logout", safeHandler(adminController.logout));

// 2. Protected Dashboard
router.get(
  "/dashboard",
  isAdminAuth,
  safeHandler(adminController.getDashboard),
);

// Edit Profil & Kata Sandi Administrator
router.post(
  "/admin-profile/update",
  isAdminAuth,
  safeHandler(adminController.updateAdminProfile),
);

// 3. Approval Persuratan & Upload Surat Hasil Resmi
router.post(
  "/surat/update",
  isAdminAuth,
  uploadSurat.single("file_surat_hasil"),
  safeHandler(adminController.updateSuratStatus),
);

router.get(
  "/surat/hapus/:id",
  isAdminAuth,
  safeHandler(adminController.hapusSurat),
);

// 4. Tanggapan Pengaduan Warga
router.post(
  "/pengaduan/update",
  isAdminAuth,
  safeHandler(adminController.updateAduanStatus),
);

// 5. CRUD Berita (Lengkap)
router.post(
  "/berita/tambah",
  isAdminAuth,
  uploadBerita.single("gambar"),
  safeHandler(adminController.tambahBerita),
);

router.post(
  "/berita/update",
  isAdminAuth,
  uploadBerita.single("gambar"),
  safeHandler(adminController.updateBerita),
);

router.get(
  "/berita/hapus/:id",
  isAdminAuth,
  safeHandler(adminController.hapusBerita),
);

// 6. CRUD Galeri
router.post(
  "/galeri/tambah",
  isAdminAuth,
  uploadGaleri.single("file_upload"),
  safeHandler(adminController.tambahGaleri),
);
router.post(
  "/galeri/update",
  isAdminAuth,
  uploadGaleri.single("file_upload"),
  safeHandler(adminController.updateGaleri),
);
router.get(
  "/galeri/hapus/:id",
  isAdminAuth,
  safeHandler(adminController.hapusGaleri),
);

// 7. Modul Profil Dinas & Struktur Organisasi
router.post(
  "/profil/update",
  isAdminAuth,
  safeHandler(adminController.updateProfilDinas),
);
router.post(
  "/profil/reset",
  isAdminAuth,
  safeHandler(adminController.resetProfilDinas),
);
router.post(
  "/profil/reset-all",
  isAdminAuth,
  safeHandler(adminController.resetAllProfil),
);
router.post(
  "/profil/save-bagan-config",
  isAdminAuth,
  safeHandler(adminController.saveBaganConfig),
);
router.post(
  "/struktur/tambah",
  isAdminAuth,
  safeHandler(adminController.tambahStruktur),
);
router.post(
  "/struktur/update",
  isAdminAuth,
  safeHandler(adminController.updateStruktur),
);
router.get(
  "/struktur/hapus/:id",
  isAdminAuth,
  safeHandler(adminController.hapusStruktur),
);
router.post(
  "/struktur/reset-all",
  isAdminAuth,
  safeHandler(adminController.resetStrukturOrganisasi),
);

// Modul Statistik & Satu Data Kependudukan
router.post(
  "/statistik/ringkasan/update",
  isAdminAuth,
  safeHandler(adminController.updateStatistikRingkasan),
);
router.post(
  "/statistik/sync",
  isAdminAuth,
  safeHandler(adminController.syncStatistikFromKecamatan),
);
router.post(
  "/statistik/kecamatan/tambah",
  isAdminAuth,
  safeHandler(adminController.tambahStatistikKecamatan),
);
router.post(
  "/statistik/kecamatan/update",
  isAdminAuth,
  safeHandler(adminController.updateStatistikKecamatan),
);
router.get(
  "/statistik/kecamatan/hapus/:id",
  isAdminAuth,
  safeHandler(adminController.hapusStatistikKecamatan),
);
router.post(
  "/statistik/penduduk/update",
  isAdminAuth,
  safeHandler(adminController.updateStatistikPenduduk),
);

// Modul Pengaturan Situs Web, Identitas, Warna & Mode Maintenance
router.post(
  "/pengaturan/update",
  isAdminAuth,
  uploadBranding.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  safeHandler(adminController.updatePengaturanWebsite),
);

router.get(
  "/pengaturan/preview-maintenance",
  isAdminAuth,
  safeHandler(adminController.previewMaintenance),
);

router.post(
  "/pengaturan/reset-branding",
  isAdminAuth,
  safeHandler(adminController.resetPengaturanBranding),
);

module.exports = router;
