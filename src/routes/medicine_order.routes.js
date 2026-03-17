const express = require("express");
const router = express.Router();
const controller = require("../controllers/medicine_order.controller");
const multer = require("multer");
const path = require("path");

// Configure Multer for prescription uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "src/uploads/prescriptions");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Create the directory if it doesn't exist (handled by Multer mostly, but good practice)
const fs = require('fs');
const uploadDir = 'src/uploads/prescriptions';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes
router.post("/add", upload.array("prescriptions", 10), controller.addOrder);
router.post("/list", upload.none(), controller.getOrders);
router.post("/preview", upload.none(), controller.getOrderDetails);
router.post("/update", upload.none(), controller.updateOrderAction);
router.delete("/delete", upload.none(), controller.deleteOrder);
router.post("/update-payment", upload.none(), controller.updatePaymentStatus);


module.exports = router;

