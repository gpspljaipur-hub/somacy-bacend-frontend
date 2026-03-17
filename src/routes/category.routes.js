const express = require("express");
const router = express.Router();
const controller = require("../controllers/category.controller");
const upload = require("../middlewares/upload.middleware");

const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.single("category_image"), controller.addCategory);
router.post("/", upload.none(), controller.getCategories);
router.put("/update", upload.single("category_image"), controller.updateCategory);
router.delete("/delete", upload.none(), controller.deleteCategory);
router.post("/import", excelUpload.single("file"), controller.importCategories);


module.exports = router;
