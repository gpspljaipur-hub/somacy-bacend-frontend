const pool = require("../config/db");

// ADD FAQ
const addFaq = async (data) => {
  const query = `
    INSERT INTO faqs (question, answer, status)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [
    data.question,
    data.answer || null,
    data.status !== undefined ? data.status : 1,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// GET ALL FAQS
const getAllFaqs = async (limit = 20, offset = 0, search = "") => {
  let query = "SELECT * FROM faqs";
  const params = [];
  
  if (search) {
    query += " WHERE question ILIKE $1";
    params.push(`%${search}%`);
  }
  
  query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const { rows } = await pool.query(query, params);
  return rows;
};

// COUNT FAQS
const countFaqs = async (search = "") => {
  let query = "SELECT COUNT(*) FROM faqs";
  const params = [];
  
  if (search) {
    query += " WHERE question ILIKE $1";
    params.push(`%${search}%`);
  }
  
  const { rows } = await pool.query(query, params);
  return parseInt(rows[0].count);
};

// GET FAQ BY ID
const getFaqById = async (id) => {
  const query = "SELECT * FROM faqs WHERE id = $1";
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

// UPDATE FAQ
const updateFaq = async (id, data) => {
  const query = `
    UPDATE faqs
    SET question = $1, answer = $2, status = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *;
  `;
  const values = [
    data.question,
    data.answer || null,
    data.status !== undefined ? data.status : 1,
    id,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// DELETE FAQ
const deleteFaq = async (id) => {
  const query = "DELETE FROM faqs WHERE id = $1";
  await pool.query(query, [id]);
};

module.exports = {
  addFaq,
  getAllFaqs,
  countFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
};
