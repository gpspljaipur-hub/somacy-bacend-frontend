const express = require("express");
const router = express.Router();
const controller = require("../controllers/delivery_boy.controller");
const multer = require("multer");
const upload = multer(); // For parsing form-data
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.none(), controller.addDeliveryBoy);
router.post("/", upload.none(), controller.getDeliveryBoys);
router.put("/update", upload.none(), controller.updateDeliveryBoy);
router.delete("/delete", upload.none(), controller.deleteDeliveryBoy);
router.post("/import", excelUpload.single("file"), controller.importDeliveryBoys);


module.exports = router;
