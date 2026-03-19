const prisma = require("../config/prisma");

const addDevice = async (data) => {
    return await prisma.devices.create({
        data: {
            name: data.name,
            device_image: data.device_image,
            amount: data.amount ? parseFloat(data.amount) : 0,
            is_rghs: !!data.is_rghs,
            discount: data.discount ? parseFloat(data.discount) : 0,
            rghs_discount: data.rghs_discount ? parseFloat(data.rghs_discount) : 0,
            status: data.status !== undefined ? parseInt(data.status) : 1
        }
    });
};

const getAllDevices = async (limit = 20, offset = 0, search = '') => {
    return await prisma.devices.findMany({
        where: search ? {
            name: { contains: search, mode: 'insensitive' }
        } : {},
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

const countDevices = async (search = '') => {
    return await prisma.devices.count({
        where: search ? {
            name: { contains: search, mode: 'insensitive' }
        } : {}
    });
};

const getDeviceById = async (id) => {
    return await prisma.devices.findUnique({
        where: { id: parseInt(id) }
    });
};

const updateDevice = async (id, data) => {
    return await prisma.devices.update({
        where: { id: parseInt(id) },
        data: {
            name: data.name,
            device_image: data.device_image,
            amount: data.amount ? parseFloat(data.amount) : undefined,
            is_rghs: data.is_rghs !== undefined ? !!data.is_rghs : undefined,
            discount: data.discount ? parseFloat(data.discount) : undefined,
            rghs_discount: data.rghs_discount ? parseFloat(data.rghs_discount) : undefined,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

const deleteDevice = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.devices.deleteMany({
        where: { id: { in: ids } }
    });
};

const getExportData = async () => {
    return await prisma.devices.findMany({
        orderBy: { id: 'desc' }
    });
};

module.exports = {
    addDevice,
    getAllDevices,
    countDevices,
    getDeviceById,
    updateDevice,
    deleteDevice,
    getExportData
};
