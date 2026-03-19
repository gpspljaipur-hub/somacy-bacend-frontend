const express = require("express");
const router = express.Router();
const controller = require("../controllers/doctor.controller");
const upload = require("../middlewares/doctor_upload.middleware");

// CRUD for Doctors
router.post("/add", upload.single("image"), controller.addDoctor);
router.post("/list", upload.none(), controller.getDoctors);
router.post("/details", upload.none(), controller.getDoctorDetails);
router.put("/update", upload.single("image"), controller.updateDoctor);
router.delete("/delete", upload.none(), controller.deleteDoctor);

module.exports = router;
