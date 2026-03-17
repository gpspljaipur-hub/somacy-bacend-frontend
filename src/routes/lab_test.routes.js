const express = require("express");
const router = express.Router();
const controller = require("../controllers/lab_test.controller");
const upload = require("../middlewares/lab_test.middleware");
const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.single("image"), controller.addLabTest);
router.post("/", upload.none(), controller.getLabTests);
router.put("/update", upload.single("image"), controller.updateLabTest);
router.delete("/delete", upload.none(), controller.deleteLabTest);
router.post("/import", excelUpload.single("file"), controller.importLabTests);

module.exports = router;
