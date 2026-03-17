const express = require("express");
const router = express.Router();
const controller = require("../controllers/customer.controller");
const multer = require("multer");
const upload = multer();
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.none(), controller.getCustomers);
router.put("/update", upload.none(), controller.updateCustomer);
router.delete("/delete", upload.none(), controller.deleteCustomer);
router.post("/add", upload.none(), controller.addCustomer); // Added for convenience
router.post("/import", excelUpload.single("file"), controller.importCustomers);

router.get("/addresses/:id", controller.getAddresses);

module.exports = router;
