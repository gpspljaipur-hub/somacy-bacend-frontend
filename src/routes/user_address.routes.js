const express = require("express");
const router = express.Router();
const controller = require("../controllers/user_address.controller");
const multer = require("multer");
const upload = multer();

// User Address CRUD
router.post("/add", upload.none(), controller.addAddress);
router.post("/list", upload.none(), controller.getAddresses);
router.post("/delete", upload.none(), controller.deleteAddress);

module.exports = router;
