const prisma = require("../config/prisma");

// ADD ORDER
const addOrder = async (data, items) => {
    return await prisma.orders.create({
        data: {
            user_id: parseInt(data.user_id),
            order_name: data.order_name,
            order_image: data.order_image,
            delivery_date: data.delivery_date ? new Date(data.delivery_date) : null,
            order_type: data.order_type,
            beneficiary_name: data.beneficiary_name,
            delivery_address: data.delivery_address,
            total_items: parseInt(data.total_items) || 0,
            total_amount: parseFloat(data.total_amount) || 0,
            total_mrp: parseFloat(data.total_mrp) || 0,
            status: data.status || 'pending',
            order_items: {
                create: items.map(item => ({
                    item_name: item.item_name,
                    item_details: item.item_details,
                    quantity: parseInt(item.quantity) || 1,
                    price: parseFloat(item.price) || 0,
                    mrp: parseFloat(item.mrp) || 0
                }))
            }
        }
    });
};

// GET ORDERS WITH PAGINATION + TYPE
const getOrders = async (user_id, page, limit, order_type) => {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = { user_id: parseInt(user_id) };
    if (order_type) {
        where.order_type = order_type;
    }

    return await prisma.orders.findMany({
        where,
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: offset
    });
};

// COUNT TOTAL ORDERS
const countOrders = async (user_id, order_type) => {
    let where = { user_id: parseInt(user_id) };
    if (order_type) {
        where.order_type = order_type;
    }

    const count = await prisma.orders.count({ where });
    return count.toString(); // Keeping compatibility with parseInt/total mapping if needed
};

// DELETE ORDER
const deleteOrder = async (id) => {
    await prisma.orders.delete({
        where: { id: parseInt(id) }
    });
};

// ORDERS DETAILS BY ID
const getOrderDetails = async ({ user_id, order_id }) => {
    let where = {};
    if (order_id) where.id = parseInt(order_id);
    if (user_id) where.user_id = parseInt(user_id);

    const orders = await prisma.orders.findMany({
        where,
        include: {
            order_items: true
        }
    });

    // Flatten for compatibility with current frontend (returning one row per item)
    let result = [];
    orders.forEach(order => {
        if (order.order_items.length > 0) {
            order.order_items.forEach(item => {
                result.push({
                    ...order,
                    item_name: item.item_name,
                    item_details: item.item_details,
                    quantity: item.quantity,
                    price: item.price,
                    mrp: item.mrp
                });
            });
        } else {
            result.push({
                ...order,
                item_name: null,
                item_details: null,
                quantity: null,
                price: null,
                mrp: null
            });
        }
    });

    return result;
};

module.exports = {
    addOrder,
    getOrders,
    deleteOrder,
    countOrders,
    getOrderDetails,
};
