const pool = require("../config/db");

// SET CART (Add or Update)
const setCartItem = async (data) => {
    const { order_id, medicine_id, num_strips, pack_type, quantity, price, discount, item_total } = data;

    const query = `
        INSERT INTO system_cart (order_id, medicine_id, num_strips, pack_type, quantity, price, discount, item_total)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
    `;
    const values = [order_id, medicine_id, num_strips, pack_type, quantity, price, discount, item_total];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// LIST CART DATA BY ORDER ID
const getCartByOrderId = async (orderId, limit = 20, offset = 0) => {
    const query = `
        SELECT c.*, m.medicine_name, m.medicine_type 
        FROM system_cart c
        LEFT JOIN medicines m ON c.medicine_id = m.id
        WHERE c.order_id = $1
        ORDER BY c.id ASC
        LIMIT $2 OFFSET $3;
    `;
    const { rows } = await pool.query(query, [orderId, limit, offset]);
    return rows;
};

// COUNT CART ITEMS BY ORDER ID
const countCartItemsByOrderId = async (orderId) => {
    const query = "SELECT COUNT(*) FROM system_cart WHERE order_id = $1";
    const { rows } = await pool.query(query, [orderId]);
    return parseInt(rows[0].count);
};

// LIST ALL CART DATA
const getAllCartItems = async (limit = 20, offset = 0) => {
    const query = `
        SELECT c.*, m.medicine_name, m.medicine_type, o.customer_id
        FROM system_cart c
        LEFT JOIN medicines m ON c.medicine_id = m.id
        LEFT JOIN medicine_orders o ON c.order_id = o.id
        ORDER BY c.id DESC
        LIMIT $1 OFFSET $2;
    `;
    const { rows } = await pool.query(query, [limit, offset]);
    return rows;
};

// COUNT ALL CART ITEMS
const countAllCartItems = async () => {
    const query = "SELECT COUNT(*) FROM system_cart";
    const { rows } = await pool.query(query);
    return parseInt(rows[0].count);
};

// DELETE ITEM FROM CART (Supports bulk)
const deleteCartItem = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM system_cart WHERE id = ANY($1::int[])", [ids]);
};

// CLEAR CART FOR AN ORDER
const clearCartByOrderId = async (orderId) => {
    await pool.query("DELETE FROM system_cart WHERE order_id = $1", [orderId]);
};

// GET ALL CART ITEMS FOR EXPORT
const getExportData = async () => {
    const query = `
        SELECT c.id, c.order_id, m.medicine_name, (m.medicine_images)[1] as medicine_image, c.num_strips, c.pack_type, c.quantity, c.price, c.discount, c.item_total, c.created_at
        FROM system_cart c
        LEFT JOIN medicines m ON c.medicine_id = m.id
        ORDER BY c.id DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
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
