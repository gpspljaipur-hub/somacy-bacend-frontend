const pool = require("../config/db");

// ADD ORDER
const addOrder = async (data) => {
  const query = `
  INSERT INTO orders
  (user_id,order_name,order_image,delivery_date,order_type)
  VALUES ($1,$2,$3,$4,$5)
  RETURNING *
  `;

  const values = [
    data.user_id,
    data.order_name,
    data.order_image,
    data.delivery_date,
    data.order_type,
  ];

  const { rows } = await pool.query(query, values);

  return rows[0];
};

// GET ORDERS WITH PAGINATION + TYPE
const getOrders = async (user_id, page, limit, order_type) => {
  const offset = (page - 1) * limit;

  let query = `
  SELECT *
  FROM orders
  WHERE user_id = $1
  `;

  const params = [user_id];
  let index = 2;

  if (order_type) {
    query += ` AND order_type = $${index}`;
    params.push(order_type);
    index++;
  }

  query += `
  ORDER BY id DESC
  LIMIT $${index}
  OFFSET $${index + 1}
  `;

  params.push(limit, offset);

  const { rows } = await pool.query(query, params);

  return rows;
};

// COUNT TOTAL ORDERS
const countOrders = async (user_id, order_type) => {
  let query = `
  SELECT COUNT(*) as total
  FROM orders
  WHERE user_id=$1
  `;

  const params = [user_id];
  let index = 2;

  if (order_type) {
    query += ` AND order_type=$${index}`;
    params.push(order_type);
  }

  const { rows } = await pool.query(query, params);

  return rows[0].total;
};

// DELETE ORDER
const deleteOrder = async (id) => {
  const query = `
  DELETE FROM orders
  WHERE id=$1
  `;

  await pool.query(query, [id]);
};

module.exports = {
  addOrder,
  getOrders,
  deleteOrder,
  countOrders,
};
