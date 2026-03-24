const prisma = require("../config/prisma");

// ADD ORDER (Refined with Tracking)
const addOrder = async (data, items) => {
    return await prisma.$transaction(async (tx) => {
        const order = await tx.orders.create({
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
                },
                order_tracking: {
                    create: {
                        status: 'pending',
                        message: 'Your order has been placed successfully.'
                    }
                }
            }
        });
        return order;
    });
};

// GET ORDERS (My Orders)
const getOrders = async (user_id, page, limit, order_type, status) => {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = { user_id: parseInt(user_id) };
    if (order_type) where.order_type = order_type;
    if (status) where.status = status;

    return await prisma.orders.findMany({
        where,
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: offset
    });
};

// COUNT ORDERS
const countOrders = async (user_id, order_type, status) => {
    let where = { user_id: parseInt(user_id) };
    if (order_type) where.order_type = order_type;
    if (status) where.status = status;
    const count = await prisma.orders.count({ where });
    return count.toString();
};

// ORDER DETAILS (Refined for nested structure)
const getOrderDetails = async ({ user_id, order_id }) => {
    return await prisma.orders.findUnique({
        where: { id: parseInt(order_id) },
        include: {
            order_items: true,
            order_tracking: {
                orderBy: { created_at: 'desc' }
            }
        }
    });
};

// TRACK ORDER
const trackOrder = async (order_id) => {
    return await prisma.order_tracking.findMany({
        where: { order_id: parseInt(order_id) },
        orderBy: { created_at: 'desc' }
    });
};

// UPDATE ORDER STATUS (WITH TRACKING LOG)
const updateOrderStatus = async (order_id, status, message) => {
    return await prisma.$transaction(async (tx) => {
        const order = await tx.orders.update({
            where: { id: parseInt(order_id) },
            data: { 
                status: status,
                updated_at: new Date()
            }
        });

        await tx.order_tracking.create({
            data: {
                order_id: parseInt(order_id),
                status: status,
                message: message || `Your order status has been updated to ${status}.`
            }
        });
        return order;
    });
};

// DELETE ORDER
const deleteOrder = async (id) => {
    return await prisma.orders.delete({
        where: { id: parseInt(id) }
    });
};

module.exports = {
    addOrder,
    getOrders,
    countOrders,
    getOrderDetails,
    trackOrder,
    updateOrderStatus,
    deleteOrder
};
