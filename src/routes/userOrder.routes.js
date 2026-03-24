const express = require("express");
const router = express.Router();
const multer = require("multer");

const orderController = require("../controllers/userOrder.controller");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/orders");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/add", upload.single("image"), orderController.addOrder);

router.post("/list", upload.none(), orderController.getOrders);
router.post("/delete", upload.none(), orderController.deleteOrder);

router.post(
  "/order-details",
  upload.none(), // this parses form-data
  orderController.getOrderDetails,
);
router.post("/track-order", upload.none(), orderController.trackOrder); 
router.post("/update-status", upload.none(), orderController.updateStatus); 

module.exports = router;
