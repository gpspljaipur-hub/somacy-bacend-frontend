const categoryModel = require("../models/lab_test_category.model");

const addCategory = async (req, res) => {
  try {
    const { category_name, status } = req.body;

    if (!category_name) {
      return res.status(400).json({ status: 0, message: "Category name is required" });
    }

    const image = req.file ? `/uploads/lab_test_categories/${req.file.filename}` : null;

    const category = await categoryModel.addCategory({
      category_name,
      image,
      status: status !== undefined ? Number(status) : 1,
    });

    res.status(201).json({
      status: 1,
      message: "Category added successfully",
      data: category,
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 20;
    const search = req.body.search || "";
    const offset = (page - 1) * limit;

    const categories = await categoryModel.getCategories(limit, offset, search);
    const total = await categoryModel.countCategories(search);

    res.json({
      status: 1,
      message: "Categories fetched successfully",
      total_count: total,
      data: categories,
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id, category_name, status } = req.body;

    if (!id) {
      return res.status(400).json({ status: 0, message: "Category ID is required" });
    }

    const existing = await categoryModel.getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ status: 0, message: "Category not found" });
    }

    let image = existing.image;
    if (req.file) {
      image = `/uploads/lab_test_categories/${req.file.filename}`;
    } else if (req.body.image === "" || req.body.image === "null" || req.body.image === null) {
      image = null;
    }

    const updated = await categoryModel.updateCategory(id, {
      category_name: category_name || existing.category_name,
      image,
      status: status !== undefined ? Number(status) : existing.status,
    });

    res.json({
      status: 1,
      message: "Category updated successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ status: 0, message: "Category ID is required" });
    }

    const existing = await categoryModel.getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ status: 0, message: "Category not found" });
    }

    await categoryModel.deleteCategory(id);

    res.json({
      status: 1,
      message: "Category deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

module.exports = {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
