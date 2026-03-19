const express = require("express");
const router = express.Router();
const controller = require("../controllers/appointment.controller");
const multer = require("multer");
const upload = multer();

// Appointment routes
router.post("/book", upload.none(), controller.bookAppointment);
router.post("/user-list", upload.none(), controller.getUserAppointments);
router.post("/update-status", upload.none(), controller.updateStatus);
router.put("/update", upload.none(), controller.updateAppointment);
router.delete("/delete", upload.none(), controller.deleteAppointment);

module.exports = router;
