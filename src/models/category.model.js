const prisma = require("../config/prisma");

// ADD CATEGORY
const addCategory = async ({ category_name, category_image, status }) => {
    return await prisma.categories.create({
        data: {
            category_name: category_name || null,
            category_image: category_image || null,
            status: status !== undefined ? parseInt(status) : 1,
        }
    });
};

// GET ALL CATEGORIES
const getAllCategories = async (limit = 20, offset = 0, search = '') => {
    return await prisma.categories.findMany({
        where: search ? {
            category_name: { contains: search, mode: 'insensitive' }
        } : {},
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// GET COUNT OF CATEGORIES
const countCategories = async (search = '') => {
    return await prisma.categories.count({
        where: search ? {
            category_name: { contains: search, mode: 'insensitive' }
        } : {}
    });
};

// GET CATEGORY BY ID
const getCategoryById = async (id) => {
    return await prisma.categories.findUnique({
        where: { id: parseInt(id) }
    });
};

// UPDATE CATEGORY
const updateCategory = async (id, data) => {
    return await prisma.categories.update({
        where: { id: parseInt(id) },
        data: {
            category_name: data.category_name,
            category_image: data.category_image,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

// DELETE CATEGORY (Supports bulk)
const deleteCategory = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.categories.deleteMany({
        where: { id: { in: ids } }
    });
};

// GET ALL CATEGORIES FOR EXPORT
const getExportData = async () => {
    return await prisma.categories.findMany({
        orderBy: { id: 'desc' }
    });
};

// GET CATEGORY BY NAME
const getCategoryByName = async (name) => {
    if (!name) return null;
    return await prisma.categories.findFirst({
        where: { category_name: { contains: name, mode: 'insensitive' } }
    });
};

module.exports = {
    addCategory,
    getAllCategories,
    getCategoryById,
    getCategoryByName,
    updateCategory,
    deleteCategory,
    countCategories,
    getExportData
};
