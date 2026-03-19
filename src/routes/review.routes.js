const express = require("express");
const router = express.Router();
const controller = require("../controllers/review.controller");
const multer = require("multer");
const upload = multer();

router.post("/add", upload.none(), controller.addReview);
router.delete("/delete", upload.none(), controller.deleteReview);

module.exports = router;
