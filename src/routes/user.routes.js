const express = require("express");
const router = express.Router();
const multer = require("multer");

const userController = require("../controllers/user.controller");

const upload = multer();

router.post("/register", upload.none(), userController.createUser);
router.post("/login", upload.none(), userController.loginUser);


module.exports = router;
