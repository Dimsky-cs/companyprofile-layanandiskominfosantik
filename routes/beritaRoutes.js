const express = require("express");
const router = express.Router();
const beritaController = require("../controllers/beritaController");

// 1. Halaman Index Berita (List & Filter)
router.get("/", beritaController.getBeritaList);

// 2. Halaman Detail Berita (Single Article)
router.get("/:slug", beritaController.getBeritaDetail);

module.exports = router;
