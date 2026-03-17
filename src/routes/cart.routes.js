const express = require("express");
const router = express.Router();
const controller = require("../controllers/cart.controller");
const multer = require("multer");
const upload = multer();

// CART ROUTES
router.post("/set", upload.none(), controller.setCart);
router.post("/update", upload.none(), controller.updateCart);
router.post("/list", upload.none(), controller.getCart);
router.post("/delete-item", upload.none(), controller.deleteItem);


module.exports = router;
