const pool = require("../config/db");

// GET ALL TESTIMONIALS
const getAllTestimonials = async (limit = 20, offset = 0, search = '') => {
    let query = "SELECT * FROM testimonials";
    const params = [];

    if (search) {
        query += " WHERE name ILIKE $1 OR designation ILIKE $1 OR content ILIKE $1";
        params.push(`%${search}%`);
    }

    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// COUNT TESTIMONIALS
const countTestimonials = async (search = '') => {
    let query = "SELECT COUNT(*) FROM testimonials";
    const params = [];

    if (search) {
        query += " WHERE name ILIKE $1 OR designation ILIKE $1 OR content ILIKE $1";
        params.push(`%${search}%`);
    }

    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET TESTIMONIAL BY ID
const getTestimonialById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM testimonials WHERE id = $1", [id]);
    return rows[0];
};

// ADD TESTIMONIAL
const addTestimonial = async (data) => {
    const query = `
      INSERT INTO testimonials (name, designation, content, image, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
        data.name,
        data.designation || '',
        data.content || '',
        data.image || null,
        data.status !== undefined ? data.status : 1
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE TESTIMONIAL (Supports bulk)
const deleteTestimonial = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM testimonials WHERE id = ANY($1::int[])", [ids]);
};

// UPDATE TESTIMONIAL (If needed in future, though user only asked for list, add, delete)
const updateTestimonial = async (id, data) => {
    const query = `
    UPDATE testimonials
    SET name = $1,
        designation = $2,
        content = $3,
        image = COALESCE($4, image), -- Only update image if provided
        status = $5,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *;
  `;

    const values = [
        data.name,
        data.designation,
        data.content,
        data.image, // Can be null if not updating
        data.status,
        id,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
}

// GET ALL TESTIMONIALS FOR EXPORT
const getExportData = async () => {
    const { rows } = await pool.query("SELECT id, name, designation, content, image, status, created_at FROM testimonials ORDER BY id DESC");
    return rows;
};

module.exports = {
    getAllTestimonials,
    countTestimonials,
    getTestimonialById,
    addTestimonial,
    deleteTestimonial,
    updateTestimonial,
    getExportData
};
