const prisma = require("../config/prisma");

// GET ALL CUSTOMERS
const getAllCustomers = async (limit = 20, offset = 0, search = '') => {
    return await prisma.customers.findMany({
        where: search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { mobile: { contains: search, mode: 'insensitive' } }
            ]
        } : {},
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// COUNT CUSTOMERS
const countCustomers = async (search = '') => {
    return await prisma.customers.count({
        where: search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { mobile: { contains: search, mode: 'insensitive' } }
            ]
        } : {}
    });
};

// GET CUSTOMER BY ID
const getCustomerById = async (id) => {
    return await prisma.customers.findUnique({
        where: { id: parseInt(id) }
    });
};

// UPDATE CUSTOMER
const updateCustomer = async (id, data) => {
    return await prisma.customers.update({
        where: { id: parseInt(id) },
        data: {
            name: data.name,
            email: data.email,
            mobile: data.mobile,
            total_orders: data.total_orders ? parseInt(data.total_orders) : undefined,
            status: data.status ? parseInt(data.status) : undefined,
            address: data.address,
            updated_at: new Date()
        }
    });
};

// DELETE CUSTOMER (Supports bulk)
const deleteCustomer = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.customers.deleteMany({
        where: { id: { in: ids } }
    });
};

// ADD CUSTOMER (For Seeding/Testing)
const addCustomer = async (data) => {
    return await prisma.customers.create({
        data: {
            name: data.name || null,
            email: data.email || null,
            mobile: data.mobile || null,
            total_orders: data.total_orders ? parseInt(data.total_orders) : 0,
            status: data.status ? parseInt(data.status) : 1,
            address: data.address || null
        }
    });
};

// GET CUSTOMER ADDRESSES (From Order History)
const getCustomerAddresses = async (id) => {
    const orders = await prisma.medicine_orders.findMany({
        where: { customer_id: parseInt(id) },
        select: { address: true, created_at: true },
        distinct: ['address'],
        orderBy: { created_at: 'desc' }
    });
    return orders;
};

// GET ALL CUSTOMERS FOR EXPORT
const getExportData = async () => {
    return await prisma.customers.findMany({
        orderBy: { id: 'desc' }
    });
};

module.exports = {
    getAllCustomers,
    countCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    addCustomer,
    getCustomerAddresses,
    getExportData
};
