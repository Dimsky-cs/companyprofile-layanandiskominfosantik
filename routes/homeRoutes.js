const express = require("express");
const router = express.Router();
const homeController = require("../controllers/homeController");

// Halaman Utama
router.get("/", homeController.getHomePage);

// Endpoint Quick Tracker
router.post("/track", homeController.trackStatus);

module.exports = router;
