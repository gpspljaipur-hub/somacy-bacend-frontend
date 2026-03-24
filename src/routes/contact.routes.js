const express = require("express");
const router = express.Router();
const controller = require("../controllers/contact.controller");

router.post("/submit", controller.submitContactForm);
router.post("/submissions", controller.getContactSubmissions); // Admin list
router.post("/info", controller.getContactInfo); // Frontend left panel
router.put("/info/update", controller.updateContactInfo); // Backend update

module.exports = router;
