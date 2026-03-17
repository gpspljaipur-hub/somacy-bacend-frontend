const express = require("express");
const router = express.Router();
const controller = require("../controllers/banner.controller");
const upload = require("../middlewares/banner.middleware");

const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.single("banner_image"), controller.addBanner);
router.post("/", upload.none(), controller.getBanners);
router.put("/update", upload.single("banner_image"), controller.updateBanner);
router.delete("/delete", upload.none(), controller.deleteBanner);
router.post("/import", excelUpload.single("file"), controller.importBanners);


module.exports = router;
