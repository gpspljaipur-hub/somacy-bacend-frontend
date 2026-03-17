const express = require("express");
const router = express.Router();
const controller = require("../controllers/device.controller");
const upload = require("../middlewares/device.middleware");
const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.single("device_image"), controller.addDevice);
router.post("/", upload.none(), controller.getDevices);
router.put("/update", upload.single("device_image"), controller.updateDevice);
router.delete("/delete", upload.none(), controller.deleteDevice);
router.post("/import", excelUpload.single("file"), controller.importDevices);

module.exports = router;
