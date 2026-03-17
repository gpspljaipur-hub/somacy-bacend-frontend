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

const getCategories = async () => {
  const { rows } = await pool.query(
    "SELECT * FROM lab_test_categories ORDER BY id DESC",
  );

  return rows;
};

module.exports = {
  addCategory,
  getCategories,
};
