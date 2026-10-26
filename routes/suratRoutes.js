const express = require("express");
const router = express.Router();
const suratController = require("../controllers/suratController");
const { uploadSurat } = require("../middlewares/uploadMiddleware");

// 1. Tampilkan Halaman Persuratan & Lacak
router.get("/", suratController.getSuratPage);

// 2. Submit Form Pengajuan (Dengan Upload Lampiran)
router.post(
  "/ajukan",
  uploadSurat.single("berkas_lampiran"),
  suratController.submitSurat,
);

// 3. Cetak Tanda Terima Digital
router.get("/cetak/:nomorSurat", suratController.cetakTandaTerima);

// 4. Cetak / Unduh Surat Permohonan Digital Pemohon
router.get("/cetak-permohonan/:nomorSurat", suratController.cetakPermohonanPemohon);

// 5. Cetak / Unduh Surat Balasan Resmi Diskominfo (Ber-KOP & QR TTE)
router.get("/cetak-resmi/:nomorSurat", suratController.cetakSuratResmiDinas);

// 6. Verifikasi Keabsahan QR Code
router.get("/verifikasi/:nomorSurat", suratController.verifikasiSurat);

module.exports = router;
