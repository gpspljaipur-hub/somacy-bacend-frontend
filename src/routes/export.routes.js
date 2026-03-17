const express = require("express");
const router = express.Router();
const controller = require("../controllers/export.controller");
const multer = require("multer");
const upload = multer();

router.post("/", upload.none(), controller.exportData);

module.exports = router;
