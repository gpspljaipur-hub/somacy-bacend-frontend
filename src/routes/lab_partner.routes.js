const express = require("express");
const router = express.Router();
const controller = require("../controllers/lab_partner.controller");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "src/uploads/lab_partners");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

// Lab Partner CRUD
router.post("/add", upload.single("logo"), controller.addPartner);
router.post("/list", upload.none(), controller.getPartners);
router.put("/update", upload.single("logo"), controller.updatePartner);
router.delete("/delete", upload.none(), controller.deletePartner);

module.exports = router;
