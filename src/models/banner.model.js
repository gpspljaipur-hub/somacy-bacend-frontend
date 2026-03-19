const prisma = require("../config/prisma");

// ADD BANNER
const addBanner = async ({ banner_image, category_id, status }) => {
    return await prisma.banners.create({
        data: {
            banner_image: banner_image,
            category_id: category_id ? parseInt(category_id) : null,
            status: status !== undefined ? parseInt(status) : 1
        }
    });
};

// GET ALL BANNERS (With Category Name)
const getAllBanners = async (limit = 20, offset = 0, search = '') => {
    const banners = await prisma.banners.findMany({
        where: search ? {
            categories: {
                category_name: { contains: search, mode: 'insensitive' }
            }
        } : {},
        include: {
            categories: true
        },
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });

    return banners.map(b => ({
        ...b,
        category_name: b.categories ? b.categories.category_name : null
    }));
};

// COUNT BANNERS
const countBanners = async (search = '') => {
    return await prisma.banners.count({
        where: search ? {
            categories: {
                category_name: { contains: search, mode: 'insensitive' }
            }
        } : {}
    });
};

// GET BANNER BY ID
const getBannerById = async (id) => {
    const b = await prisma.banners.findUnique({
        where: { id: parseInt(id) },
        include: {
            categories: true
        }
    });
    if (!b) return null;
    return {
        ...b,
        category_name: b.categories ? b.categories.category_name : null
    };
};

// UPDATE BANNER
const updateBanner = async (id, data) => {
    return await prisma.banners.update({
        where: { id: parseInt(id) },
        data: {
            banner_image: data.banner_image,
            category_id: data.category_id ? parseInt(data.category_id) : null,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

// DELETE BANNER (Supports bulk)
const deleteBanner = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.banners.deleteMany({
        where: { id: { in: ids } }
    });
};

// GET ALL BANNERS FOR EXPORT
const getExportData = async () => {
    const banners = await prisma.banners.findMany({
        include: {
            categories: true
        },
        orderBy: { id: 'desc' }
    });
    return banners.map(b => ({
        id: b.id,
        banner_image: b.banner_image,
        category_name: b.categories ? b.categories.category_name : null,
        status: b.status,
        created_at: b.created_at
    }));
};

module.exports = {
    addBanner,
    getAllBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
    countBanners,
    getExportData
};
