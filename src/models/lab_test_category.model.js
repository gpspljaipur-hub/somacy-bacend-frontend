const prisma = require("../config/prisma");

const addCategory = async (data) => {
  return await prisma.lab_test_categories.create({
    data: {
      category_name: data.category_name,
      image: data.image || null,
      status: data.status ?? 1,
    }
  });
};

const getCategories = async (limit = 20, offset = 0, search = "") => {
  return await prisma.lab_test_categories.findMany({
    where: search ? {
      category_name: { contains: search, mode: 'insensitive' }
    } : {},
    orderBy: { id: 'desc' },
    take: parseInt(limit),
    skip: parseInt(offset)
  });
};

const countCategories = async (search = "") => {
  return await prisma.lab_test_categories.count({
    where: search ? {
      category_name: { contains: search, mode: 'insensitive' }
    } : {}
  });
};

const getCategoryById = async (id) => {
  return await prisma.lab_test_categories.findUnique({
    where: { id: parseInt(id) }
  });
};

const updateCategory = async (id, data) => {
  return await prisma.lab_test_categories.update({
    where: { id: parseInt(id) },
    data: {
      category_name: data.category_name,
      image: data.image,
      status: data.status,
    }
  });
};

const deleteCategory = async (id) => {
  await prisma.lab_test_categories.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = {
  addCategory,
  getCategories,
  countCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
