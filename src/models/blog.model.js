const pool = require("../config/db");

// ADD BLOG
const addBlog = async ({ title, description, content, image, category, status }) => {
    const query = `
        INSERT INTO blogs (title, description, content, image, category, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [
        title,
        description || null,
        content || null,
        image || null,
        category || 'All',
        status !== undefined ? Number(status) : 1
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET ALL BLOGS
const getAllBlogs = async (limit = 10, offset = 0, search = '', category = 'All') => {
    let query = "SELECT * FROM blogs";
    const params = [];

    let whereClause = [];
    if (search) {
        whereClause.push(`(title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
    }
    if (category && category !== 'All') {
        whereClause.push(`category = $${params.length + 1}`);
        params.push(category);
    }

    if (whereClause.length > 0) {
        query += " WHERE " + whereClause.join(" AND ");
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// COUNT BLOGS
const countBlogs = async (search = '', category = 'All') => {
    let query = "SELECT COUNT(*) FROM blogs";
    const params = [];

    let whereClause = [];
    if (search) {
        whereClause.push(`(title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
    }
    if (category && category !== 'All') {
        whereClause.push(`category = $${params.length + 1}`);
        params.push(category);
    }

    if (whereClause.length > 0) {
        query += " WHERE " + whereClause.join(" AND ");
    }

    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET BLOG BY ID
const getBlogById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM blogs WHERE id = $1", [id]);
    return rows[0];
};

// GET RECENT BLOGS
const getRecentBlogs = async (limit = 5, excludeId = null) => {
    let query = "SELECT * FROM blogs";
    const params = [limit];

    if (excludeId) {
        query += " WHERE id != $2";
        params.push(excludeId);
    }

    query += " ORDER BY created_at DESC LIMIT $1";
    const { rows } = await pool.query(query, params);
    return rows;
};

// UPDATE BLOG
const updateBlog = async (id, data) => {
    const query = `
        UPDATE blogs
        SET title = $1,
            description = $2,
            content = $3,
            image = $4,
            category = $5,
            status = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *;
    `;
    const values = [
        data.title,
        data.description,
        data.content,
        data.image,
        data.category,
        data.status,
        id
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE BLOG
const deleteBlog = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM blogs WHERE id = ANY($1::int[])", [ids.map(Number)]);
};

module.exports = {
    addBlog,
    getAllBlogs,
    countBlogs,
    getBlogById,
    getRecentBlogs,
    updateBlog,
    deleteBlog,
};
