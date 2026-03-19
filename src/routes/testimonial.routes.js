const express = require("express");
const router = express.Router();
const controller = require("../controllers/testimonial.controller");
const multer = require("multer");
const path = require("path");

// Configure Multer for Image Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "src/uploads/testimonials");
    },
    filename: (req, file, cb) => {
        cb(null, `testimonial_${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post("/", upload.none(), controller.getTestimonials);
router.post("/add", upload.single("image"), controller.addTestimonial);
router.delete("/delete", upload.none(), controller.deleteTestimonial);

module.exports = router;
