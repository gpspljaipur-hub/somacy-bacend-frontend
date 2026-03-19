const prisma = require("../config/prisma");

// ADD COUPON
const addCoupon = async (data) => {
    return await prisma.coupons.create({
        data: {
            coupon_code: data.coupon_code || null,
            coupon_title: data.coupon_title || null,
            coupon_description: data.coupon_description || null,
            expiry_date: data.expiry_date ? new Date(data.expiry_date) : null,
            min_order_amount: data.min_order_amount ? parseFloat(data.min_order_amount) : 0,
            discount: data.discount ? parseFloat(data.discount) : 0,
            status: data.status !== undefined ? parseInt(data.status) : 1,
            coupon_image: data.coupon_image || null,
        }
    });
};

// GET ALL COUPONS
const getAllCoupons = async (limit = 20, offset = 0, search = '') => {
    return await prisma.coupons.findMany({
        where: search ? {
            OR: [
                { coupon_code: { contains: search, mode: 'insensitive' } },
                { coupon_title: { contains: search, mode: 'insensitive' } }
            ]
        } : {},
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// COUNT COUPONS
const countCoupons = async (search = '') => {
    return await prisma.coupons.count({
        where: search ? {
            OR: [
                { coupon_code: { contains: search, mode: 'insensitive' } },
                { coupon_title: { contains: search, mode: 'insensitive' } }
            ]
        } : {}
    });
};

// GET COUPON BY ID
const getCouponById = async (id) => {
    return await prisma.coupons.findUnique({
        where: { id: parseInt(id) }
    });
};

// UPDATE COUPON
const updateCoupon = async (id, data) => {
    return await prisma.coupons.update({
        where: { id: parseInt(id) },
        data: {
            coupon_code: data.coupon_code,
            coupon_title: data.coupon_title,
            coupon_description: data.coupon_description,
            expiry_date: data.expiry_date ? new Date(data.expiry_date) : undefined,
            min_order_amount: data.min_order_amount ? parseFloat(data.min_order_amount) : undefined,
            discount: data.discount ? parseFloat(data.discount) : undefined,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            coupon_image: data.coupon_image,
            updated_at: new Date()
        }
    });
};

// DELETE COUPON (Supports bulk)
const deleteCoupon = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.coupons.deleteMany({
        where: { id: { in: ids } }
    });
};

// GET ALL COUPONS FOR EXPORT
const getExportData = async () => {
    return await prisma.coupons.findMany({
        orderBy: { id: 'desc' }
    });
};

module.exports = {
    addCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    countCoupons,
    getExportData
};
