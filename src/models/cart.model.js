const prisma = require("../config/prisma");

// SET CART (Add or Update)
const setCartItem = async (data) => {
    return await prisma.system_cart.create({
        data: {
            order_id: data.order_id ? parseInt(data.order_id) : null,
            medicine_id: data.medicine_id ? parseInt(data.medicine_id) : null,
            num_strips: data.num_strips ? parseInt(data.num_strips) : 1,
            pack_type: data.pack_type || null,
            quantity: data.quantity ? parseInt(data.quantity) : 1,
            price: data.price ? parseFloat(data.price) : 0,
            discount: data.discount ? parseFloat(data.discount) : 0,
            item_total: data.item_total ? parseFloat(data.item_total) : 0
        }
    });
};

// LIST CART DATA BY ORDER ID
const getCartByOrderId = async (orderId, limit = 20, offset = 0) => {
    const items = await prisma.system_cart.findMany({
        where: { order_id: parseInt(orderId) },
        include: {
            medicines: true
        },
        orderBy: { id: 'asc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });

    return items.map(c => ({
        ...c,
        medicine_name: c.medicines ? c.medicines.medicine_name : null,
        medicine_type: c.medicines ? c.medicines.medicine_type : null
    }));
};

// COUNT CART ITEMS BY ORDER ID
const countCartItemsByOrderId = async (orderId) => {
    return await prisma.system_cart.count({
        where: { order_id: parseInt(orderId) }
    });
};

// LIST ALL CART DATA
const getAllCartItems = async (limit = 20, offset = 0) => {
    const items = await prisma.system_cart.findMany({
        include: {
            medicines: true,
            medicine_orders: true
        },
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });

    return items.map(c => ({
        ...c,
        medicine_name: c.medicines ? c.medicines.medicine_name : null,
        medicine_type: c.medicines ? c.medicines.medicine_type : null,
        customer_id: c.medicine_orders ? c.medicine_orders.customer_id : null
    }));
};

// COUNT ALL CART ITEMS
const countAllCartItems = async () => {
    return await prisma.system_cart.count();
};

// DELETE ITEM FROM CART (Supports bulk)
const deleteCartItem = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.system_cart.deleteMany({
        where: { id: { in: ids } }
    });
};

// CLEAR CART FOR AN ORDER
const clearCartByOrderId = async (orderId) => {
    await prisma.system_cart.deleteMany({
        where: { order_id: parseInt(orderId) }
    });
};

// GET ALL CART ITEMS FOR EXPORT
const getExportData = async () => {
    const items = await prisma.system_cart.findMany({
        include: {
            medicines: true
        },
        orderBy: { id: 'desc' }
    });

    return items.map(c => ({
        id: c.id,
        order_id: c.order_id,
        medicine_name: c.medicines ? c.medicines.medicine_name : null,
        medicine_image: (c.medicines && c.medicines.medicine_images) ? c.medicines.medicine_images[0] : null,
        num_strips: c.num_strips,
        pack_type: c.pack_type,
        quantity: c.quantity,
        price: c.price,
        discount: c.discount,
        item_total: c.item_total,
        created_at: c.created_at
    }));
};

module.exports = {
    setCartItem,
    getCartByOrderId,
    getAllCartItems,
    deleteCartItem,
    clearCartByOrderId,
    getExportData,
    countCartItemsByOrderId,
    countAllCartItems
};
