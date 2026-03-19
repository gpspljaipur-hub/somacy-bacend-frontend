const prisma = require("../config/prisma");

// ADD PAYMENT GATEWAY
const addPaymentGateway = async ({ gateway_name, gateway_image, status }) => {
    return await prisma.payment_gateways.create({
        data: {
            gateway_name: gateway_name || null,
            gateway_image: gateway_image || null,
            status: status !== undefined ? parseInt(status) : 1,
        }
    });
};

// GET ALL PAYMENT GATEWAYS
const getAllPaymentGateways = async (limit = 20, offset = 0, search = '') => {
    return await prisma.payment_gateways.findMany({
        where: search ? {
            gateway_name: { contains: search, mode: 'insensitive' }
        } : {},
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// GET COUNT OF PAYMENT GATEWAYS
const countPaymentGateways = async (search = '') => {
    return await prisma.payment_gateways.count({
        where: search ? {
            gateway_name: { contains: search, mode: 'insensitive' }
        } : {}
    });
};

// GET PAYMENT GATEWAY BY ID
const getPaymentGatewayById = async (id) => {
    return await prisma.payment_gateways.findUnique({
        where: { id: parseInt(id) }
    });
};

// UPDATE PAYMENT GATEWAY
const updatePaymentGateway = async (id, data) => {
    return await prisma.payment_gateways.update({
        where: { id: parseInt(id) },
        data: {
            gateway_name: data.gateway_name,
            gateway_image: data.gateway_image,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

// DELETE PAYMENT GATEWAY (Supports bulk)
const deletePaymentGateway = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.payment_gateways.deleteMany({
        where: { id: { in: ids } }
    });
};

// GET ALL PAYMENT GATEWAYS FOR EXPORT
const getExportData = async () => {
    return await prisma.payment_gateways.findMany({
        orderBy: { id: 'desc' }
    });
};

module.exports = {
    addPaymentGateway,
    getAllPaymentGateways,
    getPaymentGatewayById,
    updatePaymentGateway,
    deletePaymentGateway,
    countPaymentGateways,
    getExportData
};
