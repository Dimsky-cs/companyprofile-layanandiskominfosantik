const express = require("express");
const router = express.Router();
const pengaduanController = require("../controllers/pengaduanController");
const { uploadPengaduan } = require("../middlewares/uploadMiddleware");

// 1. Halaman Pengaduan & Live Board
router.get("/", pengaduanController.getPengaduanPage);

// 2. Submit Aduan dengan Upload Foto Bukti
router.post(
  "/kirim",
  uploadPengaduan.single("foto_bukti"),
  pengaduanController.submitPengaduan,
);

module.exports = router;
