const blogModel = require("../models/blog.model");

// ADD BLOG
const addBlog = async (req, res) => {
    try {
        const { title, description, content, category, status } = req.body;
        const image = req.file ? `/uploads/blogs/${req.file.filename}` : null;

        const data = await blogModel.addBlog({
            title,
            description,
            content,
            image,
            category: category || "All",
            status: status !== undefined ? Number(status) : 1
        });

        res.status(201).json({
            status: 1,
            message: "Blog added successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET NORMAL BLOG LIST (Pagination & Search)
const getBlogsList = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', category = 'All' } = req.body;
        const offset = (Number(page) - 1) * Number(limit);

        const data = await blogModel.getAllBlogs(Number(limit), offset, search, category);
        const total = await blogModel.countBlogs(search, category);

        res.json({
            status: 1,
            message: "Blogs fetched successfully",
            total_count: total,
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET DETAILED BLOG (By ID + Recent Blogs)
const getBlogDetails = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Blog ID is required" });

        const blog = await blogModel.getBlogById(id);
        if (!blog) return res.status(404).json({ status: 0, message: "Blog not found" });

        const recent = await blogModel.getRecentBlogs(5, id);

        res.json({
            status: 1,
            message: "Blog details fetched successfully",
            data: {
                blog,
                recent_blogs: recent
            }
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE BLOG
const updateBlog = async (req, res) => {
    try {
        const { id, title, description, content, category, status } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Blog ID is required" });

        const existing = await blogModel.getBlogById(id);
        if (!existing) return res.status(404).json({ status: 0, message: "Blog not found" });

        let image = existing.image;
        if (req.file) {
            image = `/uploads/blogs/${req.file.filename}`;
        } else if (req.body.image === "" || req.body.image === "null" || req.body.remove_image === "true") {
            image = null;
        }

        const updated = await blogModel.updateBlog(id, {
            title: title !== undefined ? title : existing.title,
            description: description !== undefined ? description : existing.description,
            content: content !== undefined ? content : existing.content,
            image,
            category: category !== undefined ? category : existing.category,
            status: status !== undefined ? Number(status) : existing.status
        });

        res.json({
            status: 1,
            message: "Blog updated successfully",
            data: updated
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE BLOG
const deleteBlog = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "ID(s) required" });

        await blogModel.deleteBlog(id);

        res.json({
            status: 1,
            message: "Blog(s) deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    addBlog,
    getBlogsList,
    getBlogDetails,
    updateBlog,
    deleteBlog
};
