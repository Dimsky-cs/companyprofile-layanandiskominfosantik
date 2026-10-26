const express = require("express");
const router = express.Router();
const galeriController = require("../controllers/galeriController");

router.get("/", galeriController.getGaleriPage);

module.exports = router;
