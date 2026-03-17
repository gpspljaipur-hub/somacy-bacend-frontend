const pool = require("../config/db");

const addDevice = async (data) => {
    const query = `
        INSERT INTO devices (name, device_image, amount, is_rghs, discount, rghs_discount, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;
    const values = [
        data.name,
        data.device_image,
        data.amount || 0,
        data.is_rghs || false,
        data.discount || 0,
        data.rghs_discount || 0,
        data.status !== undefined ? data.status : 1
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const getAllDevices = async (limit = 20, offset = 0, search = '') => {
    let query = "SELECT * FROM devices";
    const params = [];
    if (search) {
        query += " WHERE name ILIKE $1";
        params.push(`%${search}%`);
    }
    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const { rows } = await pool.query(query, params);
    return rows;
};

const countDevices = async (search = '') => {
    let query = "SELECT COUNT(*) FROM devices";
    const params = [];
    if (search) {
        query += " WHERE name ILIKE $1";
        params.push(`%${search}%`);
    }
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

const getDeviceById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM devices WHERE id = $1", [id]);
    return rows[0];
};

const updateDevice = async (id, data) => {
    const query = `
        UPDATE devices
        SET name = $1,
            device_image = $2,
            amount = $3,
            is_rghs = $4,
            discount = $5,
            rghs_discount = $6,
            status = $7,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *;
    `;
    const values = [
        data.name,
        data.device_image,
        data.amount,
        data.is_rghs,
        data.discount,
        data.rghs_discount,
        data.status,
        id
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const deleteDevice = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM devices WHERE id = ANY($1::int[])", [ids]);
};

const getExportData = async () => {
    const { rows } = await pool.query("SELECT * FROM devices ORDER BY id DESC");
    return rows;
};

module.exports = {
    addDevice,
    getAllDevices,
    countDevices,
    getDeviceById,
    updateDevice,
    deleteDevice,
    getExportData
};
