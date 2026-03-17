const pool = require("../config/db");

// ADD CATEGORY
const addCategory = async ({ category_name, category_image, status }) => {
    const query = `
    INSERT INTO categories (category_name, category_image, status)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

    const values = [
        category_name || null,
        category_image || null,
        status || 1,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET ALL CATEGORIES
const getAllCategories = async (limit = 20, offset = 0, search = '') => {
    let query = "SELECT * FROM categories";
    const params = [];

    if (search) {
        query += " WHERE category_name ILIKE $1";
        params.push(`%${search}%`);
    }

    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// ...

// GET COUNT OF CATEGORIES
const countCategories = async (search = '') => {
    let query = "SELECT COUNT(*) FROM categories";
    const params = [];

    if (search) {
        query += " WHERE category_name ILIKE $1";
        params.push(`%${search}%`);
    }

    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET CATEGORY BY ID
const getCategoryById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [
        id,
    ]);
    return rows[0];
};

// UPDATE CATEGORY
const updateCategory = async (id, data) => {
    const query = `
    UPDATE categories
    SET category_name = $1,
        category_image = $2,
        status = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *;
  `;

    const values = [
        data.category_name || null,
        data.category_image || null,
        data.status || 1,
        id,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE CATEGORY (Supports bulk)
const deleteCategory = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM categories WHERE id = ANY($1::int[])", [ids]);
};



// GET ALL CATEGORIES FOR EXPORT
const getExportData = async () => {
    const { rows } = await pool.query("SELECT id, category_name, category_image, status, created_at FROM categories ORDER BY id DESC");
    return rows;
};

// GET CATEGORY BY NAME
const getCategoryByName = async (name) => {
    if (!name) return null;
    const { rows } = await pool.query("SELECT * FROM categories WHERE category_name ILIKE $1", [name]);
    return rows[0];
};

module.exports = {
    addCategory,
    getAllCategories,
    getCategoryById,
    getCategoryByName,
    updateCategory,
    deleteCategory,
    countCategories,
    getExportData
};
