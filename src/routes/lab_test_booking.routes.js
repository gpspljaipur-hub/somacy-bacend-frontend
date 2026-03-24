const express = require("express");
const router = express.Router();
const controller = require("../controllers/lab_test_booking.controller");
const multer = require("multer");
const upload = multer();

// Lab Test Booking CRUD
router.post("/book", upload.none(), controller.bookLabTest);
router.post("/list", upload.none(), controller.getUserLabAppointments);
router.post("/update-status", upload.none(), controller.updateStatus);
router.delete("/delete", upload.none(), controller.deleteAppointment);

module.exports = router;
