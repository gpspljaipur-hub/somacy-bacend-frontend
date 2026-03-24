const express = require("express");
const router = express.Router();
const controller = require("../controllers/lab_test_schedule.controller");
const multer = require("multer");
const upload = multer();

// Lab Test Schedule CRUD
router.post("/add", upload.none(), controller.addSchedule);
router.post("/list", upload.none(), controller.getSchedule);
router.put("/update", upload.none(), controller.updateSchedule);
router.delete("/delete", upload.none(), controller.deleteSchedule);

// Availability View (Combined)
router.post("/availability", upload.none(), controller.getLabTestAvailability);

module.exports = router;
