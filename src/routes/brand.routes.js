const express = require("express");
const router = express.Router();
const controller = require("../controllers/brand.controller");
const upload = require("../middlewares/brand.middleware");

const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.single("brand_image"), controller.addBrand);
router.post("/", upload.none(), controller.getBrands);
router.put("/update", upload.single("brand_image"), controller.updateBrand);
router.delete("/delete", upload.none(), controller.deleteBrand);
router.post("/import", excelUpload.single("file"), controller.importBrands);
// 

module.exports = router;
