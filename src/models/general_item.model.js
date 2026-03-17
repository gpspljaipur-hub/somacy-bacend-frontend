const pool = require("../config/db");

const addGeneralItem = async (data) => {
    const query = `
        INSERT INTO general_items (name, image, amount, discount, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [
        data.name,
        data.image,
        data.amount || 0,
        data.discount || 0,
        data.status !== undefined ? data.status : 1
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const getAllGeneralItems = async (limit = 20, offset = 0, search = '') => {
    let query = "SELECT * FROM general_items";
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

const countGeneralItems = async (search = '') => {
    let query = "SELECT COUNT(*) FROM general_items";
    const params = [];
    if (search) {
        query += " WHERE name ILIKE $1";
        params.push(`%${search}%`);
    }
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

const getGeneralItemById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM general_items WHERE id = $1", [id]);
    return rows[0];
};

const updateGeneralItem = async (id, data) => {
    const query = `
        UPDATE general_items
        SET name = $1,
            image = $2,
            amount = $3,
            discount = $4,
            status = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING *;
    `;
    const values = [
        data.name,
        data.image,
        data.amount,
        data.discount,
        data.status,
        id
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const deleteGeneralItem = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM general_items WHERE id = ANY($1::int[])", [ids]);
};

const getExportData = async () => {
    const { rows } = await pool.query("SELECT * FROM general_items ORDER BY id DESC");
    return rows;
};

module.exports = {
    addGeneralItem,
    getAllGeneralItems,
    countGeneralItems,
    getGeneralItemById,
    updateGeneralItem,
    deleteGeneralItem,
    getExportData
};
