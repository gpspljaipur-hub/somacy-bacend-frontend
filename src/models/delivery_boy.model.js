const pool = require("../config/db");

// ADD DELIVERY BOY
const addDeliveryBoy = async (data) => {
    const query = `
    INSERT INTO delivery_boys (name, mobile, email, commission_percentage, address, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

    const values = [
        data.name || null,
        data.mobile || null,
        data.email || null,
        data.commission_percentage || 0,
        data.address || null,
        data.status !== undefined ? data.status : 1,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET ALL DELIVERY BOYS
const getAllDeliveryBoys = async (limit = 20, offset = 0, search = '') => {
    let query = "SELECT * FROM delivery_boys";
    const params = [];
    if (search) {
        query += " WHERE (name ILIKE $1 OR mobile ILIKE $1 OR email ILIKE $1)";
        params.push(`%${search}%`);
    }
    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// COUNT DELIVERY BOYS
const countDeliveryBoys = async (search = '') => {
    let query = "SELECT COUNT(*) FROM delivery_boys";
    const params = [];
    if (search) {
        query += " WHERE (name ILIKE $1 OR mobile ILIKE $1 OR email ILIKE $1)";
        params.push(`%${search}%`);
    }
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET DELIVERY BOY BY ID
const getDeliveryBoyById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM delivery_boys WHERE id = $1", [id]);
    return rows[0];
};

// UPDATE DELIVERY BOY
const updateDeliveryBoy = async (id, data) => {
    const query = `
    UPDATE delivery_boys
    SET name = $1,
        mobile = $2,
        email = $3,
        commission_percentage = $4,
        address = $5,
        status = $6,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING *;
  `;

    const values = [
        data.name,
        data.mobile,
        data.email,
        data.commission_percentage,
        data.address,
        data.status,
        id,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE DELIVERY BOY (Supports bulk)
const deleteDeliveryBoy = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM delivery_boys WHERE id = ANY($1::int[])", [ids]);
};

// GET ALL DELIVERY BOYS FOR EXPORT
const getExportData = async () => {
    const { rows } = await pool.query("SELECT id, name, mobile, email, commission_percentage, address, status, created_at FROM delivery_boys ORDER BY id DESC");
    return rows;
};

module.exports = {
    addDeliveryBoy,
    getAllDeliveryBoys,
    getDeliveryBoyById,
    updateDeliveryBoy,
    deleteDeliveryBoy,
    countDeliveryBoys,
    getExportData
};
