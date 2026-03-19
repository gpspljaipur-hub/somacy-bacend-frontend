const prisma = require("../config/prisma");

// ADD BRAND
const addBrand = async (data) => {
    return await prisma.brands.create({
        data: {
            brand_name: data.brand_name || null,
            brand_image: data.brand_image || null,
            is_popular: data.is_popular !== undefined ? !!data.is_popular : false,
            status: data.status !== undefined ? parseInt(data.status) : 1,
        }
    });
};

// GET ALL BRANDS
const getAllBrands = async (limit = 20, offset = 0, search = '') => {
    return await prisma.brands.findMany({
        where: search ? {
            brand_name: { contains: search, mode: 'insensitive' }
        } : {},
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// COUNT BRANDS
const countBrands = async (search = '') => {
    return await prisma.brands.count({
        where: search ? {
            brand_name: { contains: search, mode: 'insensitive' }
        } : {}
    });
};

// GET BRAND BY ID
const getBrandById = async (id) => {
    return await prisma.brands.findUnique({
        where: { id: parseInt(id) }
    });
};

// UPDATE BRAND
const updateBrand = async (id, data) => {
    return await prisma.brands.update({
        where: { id: parseInt(id) },
        data: {
            brand_name: data.brand_name,
            brand_image: data.brand_image,
            is_popular: data.is_popular !== undefined ? !!data.is_popular : undefined,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

// DELETE BRAND (Supports bulk)
const deleteBrand = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.brands.deleteMany({
        where: { id: { in: ids } }
    });
};

// GET ALL BRANDS FOR EXPORT
const getExportData = async () => {
    return await prisma.brands.findMany({
        orderBy: { id: 'desc' }
    });
};

// GET BRAND BY NAME
const getBrandByName = async (name) => {
    if (!name) return null;
    return await prisma.brands.findFirst({
        where: { brand_name: { contains: name, mode: 'insensitive' } }
    });
};

module.exports = {
    addBrand,
    getAllBrands,
    getBrandById,
    getBrandByName,
    updateBrand,
    deleteBrand,
    countBrands,
    getExportData
};
