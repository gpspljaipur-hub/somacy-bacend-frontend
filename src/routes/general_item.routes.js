const express = require("express");
const router = express.Router();
const controller = require("../controllers/general_item.controller");
const upload = require("../middlewares/general_item.middleware");
const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.single("image"), controller.addGeneralItem);
router.post("/", upload.none(), controller.getGeneralItems);
router.put("/update", upload.single("image"), controller.updateGeneralItem);
router.delete("/delete", upload.none(), controller.deleteGeneralItem);
router.post("/import", excelUpload.single("file"), controller.importGeneralItems);

module.exports = router;
