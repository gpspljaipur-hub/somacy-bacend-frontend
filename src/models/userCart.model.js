const prisma = require("../config/prisma");

// ADD TO CART
const addToCart = async (user_id, item_id, item_type, item_name, price) => {
    const existing = await prisma.user_cart.findFirst({
        where: {
            user_id: parseInt(user_id),
            item_id: parseInt(item_id),
            item_type: item_type
        }
    });

    if (existing) {
        return await prisma.user_cart.update({
            where: { id: existing.id },
            data: {
                quantity: existing.quantity + 1
            }
        });
    }

    return await prisma.user_cart.create({
        data: {
            user_id: parseInt(user_id),
            item_id: parseInt(item_id),
            item_type: item_type,
            item_name: item_name,
            price: parseFloat(price),
            quantity: 1
        }
    });
};

// GET CART
const getCart = async (user_id) => {
    const cartItems = await prisma.user_cart.findMany({
        where: { user_id: parseInt(user_id) },
        orderBy: { id: 'desc' }
    });

    return cartItems.map(item => ({
        ...item,
        total_price: parseFloat(item.price) * item.quantity
    }));
};

// REMOVE ITEM
const removeCartItem = async (id) => {
    await prisma.user_cart.delete({
        where: { id: parseInt(id) }
    });
};

module.exports = {
    addToCart,
    getCart,
    removeCartItem,
};
