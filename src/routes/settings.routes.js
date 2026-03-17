const express = require("express");
const router = express.Router();
const controller = require("../controllers/settings.controller");
const multer = require("multer");
const path = require("path");

// Configure Multer for Logo Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "src/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `logo_${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

router.get("/", controller.getSettings);
router.put("/", upload.single("logo"), controller.updateSettings); // Can be PUT or POST

module.exports = router;
