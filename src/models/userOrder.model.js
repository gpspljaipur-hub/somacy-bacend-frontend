const pool = require("../config/db");

// ADD ORDER
const addOrder = async (data, items) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderQuery = `
      INSERT INTO orders
      (user_id,order_name,order_image,delivery_date,order_type,
      beneficiary_name,delivery_address,total_items,total_amount,total_mrp,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id
    `;

    const values = [
      data.user_id,
      data.order_name,
      data.order_image,
      data.delivery_date,
      data.order_type,
      data.beneficiary_name,
      data.delivery_address,
      data.total_items,
      data.total_amount,
      data.total_mrp,
      data.status,
    ];

    const result = await client.query(orderQuery, values);

    const order_id = result.rows[0].id;

    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items
        (order_id,item_name,item_details,quantity,price,mrp)
        VALUES ($1,$2,$3,$4,$5,$6)
      `;

      const itemValues = [
        order_id,
        item.item_name,
        item.item_details,
        item.quantity,
        item.price,
        item.mrp,
      ];

      await client.query(itemQuery, itemValues);
    }

    await client.query("COMMIT");

    return { order_id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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

// ORDERS DETAILS BY ID
const getOrderDetails = async ({ user_id, order_id }) => {
  let query = `
  SELECT 
  o.*, 
  oi.item_name,
  oi.item_details,
  oi.quantity,
  oi.price,
  oi.mrp
  FROM orders o
  LEFT JOIN order_items oi
  ON oi.order_id = o.id
  WHERE 1=1
  `;

  const params = [];
  let index = 1;

  if (order_id) {
    query += ` AND o.id=$${index}`;
    params.push(order_id);
    index++;
  }

  if (user_id) {
    query += ` AND o.user_id=$${index}`;
    params.push(user_id);
  }

  const { rows } = await pool.query(query, params);

  return rows;
};

module.exports = {
  addOrder,
  getOrders,
  deleteOrder,
  countOrders,
  getOrderDetails,
};
