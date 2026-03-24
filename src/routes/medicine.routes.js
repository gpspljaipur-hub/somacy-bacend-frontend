const express = require("express");
const router = express.Router();
const controller = require("../controllers/medicine.controller");
const upload = require("../middlewares/medicine.middleware");

const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.array("medicine_images", 4), controller.addMedicine);
router.post("/", upload.none(), controller.getMedicines);
router.post("/details", upload.none(), controller.getMedicineDetails);
router.put("/update", upload.array("medicine_images", 4), controller.updateMedicine);
router.delete("/delete", upload.none(), controller.deleteMedicine);
router.post("/import", excelUpload.single("file"), controller.importMedicines);


module.exports = router;
