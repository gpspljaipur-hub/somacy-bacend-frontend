const express = require("express");
const router = express.Router();
const controller = require("../controllers/coupon.controller");
const upload = require("../middlewares/coupon_upload.middleware");
const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.single("coupon_image"), controller.addCoupon);
router.post("/", upload.none(), controller.getCoupons);
router.put("/update", upload.single("coupon_image"), controller.updateCoupon);
router.delete("/delete", upload.none(), controller.deleteCoupon);
router.post("/import", excelUpload.single("file"), controller.importCoupons);


module.exports = router;
