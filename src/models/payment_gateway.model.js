const pool = require("../config/db");

// ADD PAYMENT GATEWAY
const addPaymentGateway = async ({ gateway_name, gateway_image, status }) => {
    const query = `
    INSERT INTO payment_gateways (gateway_name, gateway_image, status)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

    const values = [
        gateway_name || null,
        gateway_image || null,
        status || 1,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET ALL PAYMENT GATEWAYS
const getAllPaymentGateways = async (limit = 20, offset = 0, search = '') => {
    let query = "SELECT * FROM payment_gateways";
    const params = [];

    if (search) {
        query += " WHERE gateway_name ILIKE $1";
        params.push(`%${search}%`);
    }

    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// GET COUNT OF PAYMENT GATEWAYS
const countPaymentGateways = async (search = '') => {
    let query = "SELECT COUNT(*) FROM payment_gateways";
    const params = [];

    if (search) {
        query += " WHERE gateway_name ILIKE $1";
        params.push(`%${search}%`);
    }

    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET PAYMENT GATEWAY BY ID
const getPaymentGatewayById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM payment_gateways WHERE id = $1", [
        id,
    ]);
    return rows[0];
};

// UPDATE PAYMENT GATEWAY
const updatePaymentGateway = async (id, data) => {
    const query = `
    UPDATE payment_gateways
    SET gateway_name = $1,
        gateway_image = $2,
        status = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *;
  `;

    const values = [
        data.gateway_name || null,
        data.gateway_image || null,
        data.status || 1,
        id,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE PAYMENT GATEWAY (Supports bulk)
const deletePaymentGateway = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM payment_gateways WHERE id = ANY($1::int[])", [ids]);
};

// GET ALL PAYMENT GATEWAYS FOR EXPORT
const getExportData = async () => {
    const { rows } = await pool.query("SELECT id, gateway_name, status, created_at FROM payment_gateways ORDER BY id DESC");
    return rows;
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
