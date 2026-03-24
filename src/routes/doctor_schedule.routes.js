const express = require("express");
const router = express.Router();
const controller = require("../controllers/doctor_schedule.controller");
const multer = require("multer");
const upload = multer();

// CRUD for Doctor Schedule
router.post("/add", upload.none(), controller.addSchedule);
router.post("/list", upload.none(), controller.getSchedule);
router.put("/update", upload.none(), controller.updateSchedule);
router.delete("/delete", upload.none(), controller.deleteSchedule);
router.post("/availability", upload.none(), controller.getDoctorAvailability);

module.exports = router;
