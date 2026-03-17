const pool = require("../config/db");

// ADD BRAND
const addBrand = async (data) => {
    const query = `
    INSERT INTO brands (brand_name, brand_image, is_popular, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

    const values = [
        data.brand_name || null,
        data.brand_image || null,
        data.is_popular !== undefined ? data.is_popular : false,
        data.status !== undefined ? data.status : 1,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET ALL BRANDS
const getAllBrands = async (limit = 20, offset = 0, search = '') => {
    let query = "SELECT * FROM brands";
    const params = [];
    if (search) {
        query += " WHERE brand_name ILIKE $1";
        params.push(`%${search}%`);
    }
    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// COUNT BRANDS
const countBrands = async (search = '') => {
    let query = "SELECT COUNT(*) FROM brands";
    const params = [];
    if (search) {
        query += " WHERE brand_name ILIKE $1";
        params.push(`%${search}%`);
    }
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET BRAND BY ID
const getBrandById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM brands WHERE id = $1", [id]);
    return rows[0];
};

// UPDATE BRAND
const updateBrand = async (id, data) => {
    const query = `
    UPDATE brands
    SET brand_name = $1,
        brand_image = $2,
        is_popular = $3,
        status = $4,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *;
  `;

    const values = [
        data.brand_name,
        data.brand_image,
        data.is_popular,
        data.status,
        id,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE BRAND (Supports bulk)
const deleteBrand = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM brands WHERE id = ANY($1::int[])", [ids]);
};

// GET ALL BRANDS FOR EXPORT
const getExportData = async () => {
    const { rows } = await pool.query("SELECT id, brand_name, brand_image, is_popular, status, created_at FROM brands ORDER BY id DESC");
    return rows;
};

// GET BRAND BY NAME
const getBrandByName = async (name) => {
    if (!name) return null;
    const { rows } = await pool.query("SELECT * FROM brands WHERE brand_name ILIKE $1", [name]);
    return rows[0];
};

module.exports = {
    addBrand,
    getAllBrands,
    getBrandById,
    getBrandByName,
    updateBrand,
    deleteBrand,
    countBrands,
    getExportData
};
