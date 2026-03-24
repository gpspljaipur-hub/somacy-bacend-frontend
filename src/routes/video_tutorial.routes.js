const express = require("express");
const router = express.Router();
const controller = require("../controllers/video_tutorial.controller");
const upload = require("../middlewares/video_tutorial.middleware");

router.post("/add", upload.single("thumbnail"), controller.addTutorial);
router.post("/", upload.none(), controller.getTutorials);
router.put("/update", upload.single("thumbnail"), controller.updateTutorial);
router.delete("/delete", upload.none(), controller.deleteTutorial);

module.exports = router;
