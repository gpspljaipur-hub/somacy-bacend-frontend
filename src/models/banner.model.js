const pool = require("../config/db");

// ADD BANNER
const addBanner = async ({ banner_image, category_id, status }) => {
    const query = `
    INSERT INTO banners (banner_image, category_id, status)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

    const values = [banner_image, category_id || null, status || 1];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET ALL BANNERS (With Category Name)
const getAllBanners = async (limit = 20, offset = 0, search = '') => {
    let query = `
    SELECT b.*, c.category_name 
    FROM banners b
    LEFT JOIN categories c ON b.category_id = c.id
  `;
    const params = [];
    if (search) {
        query += " WHERE c.category_name ILIKE $1";
        params.push(`%${search}%`);
    }
    query += ` ORDER BY b.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// ...

// COUNT BANNERS
const countBanners = async (search = '') => {
    let query = `
    SELECT COUNT(*) 
    FROM banners b
    LEFT JOIN categories c ON b.category_id = c.id
    `;
    const params = [];
    if (search) {
        query += " WHERE c.category_name ILIKE $1";
        params.push(`%${search}%`);
    }
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET BANNER BY ID
const getBannerById = async (id) => {
    const query = `
    SELECT b.*, c.category_name 
    FROM banners b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

// UPDATE BANNER
const updateBanner = async (id, data) => {
    const query = `
    UPDATE banners
    SET banner_image = $1,
        category_id = $2,
        status = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *;
  `;

    const values = [
        data.banner_image,
        data.category_id || null,
        data.status || 1,
        id,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE BANNER (Supports bulk)
const deleteBanner = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM banners WHERE id = ANY($1::int[])", [ids]);
};

// GET ALL BANNERS FOR EXPORT
const getExportData = async () => {
    const query = `
    SELECT b.id, b.banner_image, c.category_name, b.status, b.created_at
    FROM banners b
    LEFT JOIN categories c ON b.category_id = c.id
    ORDER BY b.id DESC
  `;
    const { rows } = await pool.query(query);
    return rows;
};

module.exports = {
    addBanner,
    getAllBanners,
    getBannerById,
    updateBanner,
    deleteBanner,
    countBanners,
    getExportData
};
