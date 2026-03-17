const express = require("express");
const router = express.Router();
const multer = require("multer");

const cartController = require("../controllers/userCart.controller");

const upload = multer(); // memory storage

router.post("/add", upload.none(), cartController.addToCart);
router.post("/list", upload.none(), cartController.getCart);
router.post("/remove", upload.none(), cartController.removeCartItem);

module.exports = router;
