const express = require("express");
const router = express.Router();
const multer = require("multer");

const categoryController = require("../controllers/lab_test_categories.controller");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/uploads/lab_test_categories");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/add", upload.single("image"), categoryController.addCategory);
router.post("/list", upload.none(), categoryController.getCategories);
router.get("/list", categoryController.getCategories);
router.put("/update", upload.single("image"), categoryController.updateCategory);
router.delete("/delete", upload.none(), categoryController.deleteCategory);

module.exports = router;
