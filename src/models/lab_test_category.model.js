const pool = require("../config/db");

const addCategory = async (data) => {
  const query = `
    INSERT INTO lab_test_categories (category_name, image, status)
    VALUES ($1,$2,$3)
    RETURNING *
  `;

  const values = [data.category_name, data.image || null, data.status ?? 1];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getCategories = async (limit = 20, offset = 0, search = "") => {
  let query = "SELECT * FROM lab_test_categories";
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

const countCategories = async (search = "") => {
  let query = "SELECT COUNT(*) FROM lab_test_categories";
  const params = [];

  if (search) {
    query += " WHERE category_name ILIKE $1";
    params.push(`%${search}%`);
  }

  const { rows } = await pool.query(query, params);
  return parseInt(rows[0].count);
};

const getCategoryById = async (id) => {
  const { rows } = await pool.query(
    "SELECT * FROM lab_test_categories WHERE id = $1",
    [id]
  );
  return rows[0];
};

const updateCategory = async (id, data) => {
  const query = `
    UPDATE lab_test_categories
    SET category_name = $1, image = $2, status = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
  `;
  const values = [data.category_name, data.image, data.status, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const deleteCategory = async (id) => {
  await pool.query("DELETE FROM lab_test_categories WHERE id = $1", [id]);
};

module.exports = {
  addCategory,
  getCategories,
  countCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
