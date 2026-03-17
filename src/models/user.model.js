const pool = require("../config/db");

// GET USER BY MOBILE
const getUserByMobile = async (mobile) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE mobile = $1", [
    mobile,
  ]);

  return rows[0];
};

// ADD USER
const createUser = async (data) => {
  const query = `
        INSERT INTO users (first_name, last_name, mobile, password, otp, address)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *;
    `;

  const values = [
    data.first_name || null,
    data.last_name || null,
    data.mobile,
    data.password,
    data.otp || null,
    data.address || null,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = {
  getUserByMobile,
  createUser,
};
