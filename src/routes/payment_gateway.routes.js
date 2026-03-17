const express = require("express");
const router = express.Router();
const controller = require("../controllers/payment_gateway.controller");
const upload = require("../middlewares/payment_gateway_upload.middleware");

const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.single("gateway_image"), controller.addPaymentGateway);
router.post("/", upload.none(), controller.getPaymentGateways);
router.put("/update", upload.single("gateway_image"), controller.updatePaymentGateway);
router.delete("/delete", upload.none(), controller.deletePaymentGateway);
router.post("/import", excelUpload.single("file"), controller.importPaymentGateways);


module.exports = router;
