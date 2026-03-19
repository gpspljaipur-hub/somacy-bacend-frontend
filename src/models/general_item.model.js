const prisma = require("../config/prisma");

const addGeneralItem = async (data) => {
    return await prisma.general_items.create({
        data: {
          name: data.name,
          image: data.image,
          amount: data.amount ? parseFloat(data.amount) : 0,
          discount: data.discount ? parseFloat(data.discount) : 0,
          status: data.status !== undefined ? parseInt(data.status) : 1
        }
    });
};

const getAllGeneralItems = async (limit = 20, offset = 0, search = '') => {
    return await prisma.general_items.findMany({
        where: search ? {
            name: { contains: search, mode: 'insensitive' }
        } : {},
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

const countGeneralItems = async (search = '') => {
    return await prisma.general_items.count({
        where: search ? {
            name: { contains: search, mode: 'insensitive' }
        } : {}
    });
};

const getGeneralItemById = async (id) => {
    return await prisma.general_items.findUnique({
        where: { id: parseInt(id) }
    });
};

const updateGeneralItem = async (id, data) => {
    return await prisma.general_items.update({
        where: { id: parseInt(id) },
        data: {
            name: data.name,
            image: data.image,
            amount: data.amount ? parseFloat(data.amount) : undefined,
            discount: data.discount ? parseFloat(data.discount) : undefined,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

const deleteGeneralItem = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.general_items.deleteMany({
        where: { id: { in: ids } }
    });
};

const getExportData = async () => {
    return await prisma.general_items.findMany({
        orderBy: { id: 'desc' }
    });
};

module.exports = {
    addGeneralItem,
    getAllGeneralItems,
    countGeneralItems,
    getGeneralItemById,
    updateGeneralItem,
    deleteGeneralItem,
    getExportData
};
