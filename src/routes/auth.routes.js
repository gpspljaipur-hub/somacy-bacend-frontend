const express = require("express");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const multer = require("multer");
const upload = multer();

router.post("/login", upload.none(), controller.login);
router.post("/signup", upload.none(), controller.signup);
router.post("/forgot-password", upload.none(), controller.forgotPassword);
router.post("/reset-password", upload.none(), controller.resetPassword);
// Update uses file upload now
router.put("/update", upload.single('imageUrl'), controller.updateProfile);
router.post("/verify-email-change", upload.none(), controller.verifyEmailChange);
router.get("/user-profile", controller.getProfile);
router.post("/logout", controller.logout);


module.exports = router;
