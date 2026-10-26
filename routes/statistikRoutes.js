const express = require("express");
const router = express.Router();
const statistikController = require("../controllers/statistikController");

router.get("/", statistikController.getStatistikPage);
router.get("/export-csv", statistikController.exportCSV);

module.exports = router;
