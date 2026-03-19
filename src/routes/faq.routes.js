const express = require("express");
const router = express.Router();
const controller = require("../controllers/faq.controller");
const multer = require("multer");
const upload = multer(); // To support multipart/form-data parsing simply

router.post("/add", upload.none(), controller.addFaq);
router.post("/list", upload.none(), controller.getAllFaqs);
router.get("/list", controller.getAllFaqs); // Provide GET fallback for lists
router.put("/update", upload.none(), controller.updateFaq);
router.delete("/delete", upload.none(), controller.deleteFaq);

module.exports = router;
