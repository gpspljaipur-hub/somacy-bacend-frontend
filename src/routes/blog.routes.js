const express = require("express");
const router = express.Router();
const controller = require("../controllers/blog.controller");
const upload = require("../middlewares/blog_upload.middleware");

// CRUD for Blogs
router.post("/add", upload.single("image"), controller.addBlog);
router.post("/list", upload.none(), controller.getBlogsList);
router.post("/details", upload.none(), controller.getBlogDetails);
router.put("/update", upload.single("image"), controller.updateBlog);
router.delete("/delete", upload.none(), controller.deleteBlog);
router.post("/upload-editor-image", upload.single("image"), controller.uploadEditorImage);

module.exports = router;
