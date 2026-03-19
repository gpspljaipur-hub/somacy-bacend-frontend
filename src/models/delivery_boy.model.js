const prisma = require("../config/prisma");

// ADD DELIVERY BOY
const addDeliveryBoy = async (data) => {
    return await prisma.delivery_boys.create({
        data: {
            name: data.name || null,
            mobile: data.mobile || null,
            email: data.email || null,
            commission_percentage: data.commission_percentage ? parseFloat(data.commission_percentage) : 0,
            address: data.address || null,
            status: data.status !== undefined ? parseInt(data.status) : 1,
        }
    });
};

// GET ALL DELIVERY BOYS
const getAllDeliveryBoys = async (limit = 20, offset = 0, search = '') => {
    const where = search ? {
        OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ]
    } : {};

    return await prisma.delivery_boys.findMany({
        where,
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// COUNT DELIVERY BOYS
const countDeliveryBoys = async (search = '') => {
    const where = search ? {
        OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { mobile: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ]
    } : {};

    return await prisma.delivery_boys.count({ where });
};

// GET DELIVERY BOY BY ID
const getDeliveryBoyById = async (id) => {
    return await prisma.delivery_boys.findUnique({
        where: { id: parseInt(id) }
    });
};

// UPDATE DELIVERY BOY
const updateDeliveryBoy = async (id, data) => {
    return await prisma.delivery_boys.update({
        where: { id: parseInt(id) },
        data: {
            name: data.name,
            mobile: data.mobile,
            email: data.email,
            commission_percentage: data.commission_percentage ? parseFloat(data.commission_percentage) : undefined,
            address: data.address,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

// DELETE DELIVERY BOY (Supports bulk)
const deleteDeliveryBoy = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.delivery_boys.deleteMany({
        where: { id: { in: ids } }
    });
};

// GET ALL DELIVERY BOYS FOR EXPORT
const getExportData = async () => {
    return await prisma.delivery_boys.findMany({
        orderBy: { id: 'desc' }
    });
};

module.exports = {
    addDeliveryBoy,
    getAllDeliveryBoys,
    getDeliveryBoyById,
    updateDeliveryBoy,
    deleteDeliveryBoy,
    countDeliveryBoys,
    getExportData
};
