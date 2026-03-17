const categoryModel = require("../models/lab_test_category.model");

const addCategory = async (req, res) => {
  try {
    const { category_name } = req.body;
    const image = req.file ? req.file.filename : null;

    const category = await categoryModel.addCategory({
      category_name,
      image,
    });

    res.json({
      status: 1,
      message: "Category added successfully",
      data: category,
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: err.message,
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getCategories();

    res.json({
      status: 1,
      data: categories,
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: err.message,
    });
  }
};

module.exports = {
  addCategory,
  getCategories,
};
