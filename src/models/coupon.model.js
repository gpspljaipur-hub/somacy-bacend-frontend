const pool = require("../config/db");

// ADD COUPON
const addCoupon = async (data) => {
    const query = `
    INSERT INTO coupons (
      coupon_code, coupon_title, coupon_description, 
      expiry_date, min_order_amount, discount, status, coupon_image
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

    const values = [
        data.coupon_code || null,
        data.coupon_title || null,
        data.coupon_description || null,
        data.expiry_date || null,
        data.min_order_amount || 0,
        data.discount || 0,
        data.status !== undefined ? data.status : 1,
        data.coupon_image || null,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET ALL COUPONS
const getAllCoupons = async (limit = 20, offset = 0, search = '') => {
    let query = "SELECT * FROM coupons";
    const params = [];
    if (search) {
        query += " WHERE (coupon_code ILIKE $1 OR coupon_title ILIKE $1)";
        params.push(`%${search}%`);
    }
    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// COUNT COUPONS
const countCoupons = async (search = '') => {
    let query = "SELECT COUNT(*) FROM coupons";
    const params = [];
    if (search) {
        query += " WHERE (coupon_code ILIKE $1 OR coupon_title ILIKE $1)";
        params.push(`%${search}%`);
    }
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET COUPON BY ID
const getCouponById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM coupons WHERE id = $1", [id]);
    return rows[0];
};

// UPDATE COUPON
const updateCoupon = async (id, data) => {
    const query = `
    UPDATE coupons
    SET coupon_code = $1,
        coupon_title = $2,
        coupon_description = $3,
        expiry_date = $4,
        min_order_amount = $5,
        discount = $6,
        status = $7,
        coupon_image = $8,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
    RETURNING *;
  `;

    const values = [
        data.coupon_code,
        data.coupon_title,
        data.coupon_description,
        data.expiry_date,
        data.min_order_amount,
        data.discount,
        data.status,
        data.coupon_image,
        id,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE COUPON (Supports bulk)
const deleteCoupon = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM coupons WHERE id = ANY($1::int[])", [ids]);
};

// GET ALL COUPONS FOR EXPORT
const getExportData = async () => {
    const { rows } = await pool.query("SELECT id, coupon_code, coupon_title, coupon_description, coupon_image, expiry_date, min_order_amount, discount, status, created_at FROM coupons ORDER BY id DESC");
    return rows;
};

module.exports = {
    addCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    countCoupons,
    getExportData
};
