const pool = require("../config/db");

// ADD TO CART
const addToCart = async (user_id, item_id, item_type, item_name, price) => {
  const checkQuery = `
 SELECT * FROM user_cart
 WHERE user_id=$1 AND item_id=$2 AND item_type=$3
 `;

  const existing = await pool.query(checkQuery, [user_id, item_id, item_type]);

  if (existing.rows.length > 0) {
    const updateQuery = `
   UPDATE user_cart
   SET quantity = quantity + 1
   WHERE user_id=$1 AND item_id=$2 AND item_type=$3
   RETURNING *
   `;

    const { rows } = await pool.query(updateQuery, [
      user_id,
      item_id,
      item_type,
    ]);

    return rows[0];
  }

  const insertQuery = `
 INSERT INTO user_cart (user_id,item_id,item_type,item_name,price)
 VALUES ($1,$2,$3,$4,$5)
 RETURNING *
 `;

  const { rows } = await pool.query(insertQuery, [
    user_id,
    item_id,
    item_type,
    item_name,
    price,
  ]);

  return rows[0];
};

// GET CART
const getCart = async (user_id) => {
  const query = `
  SELECT 
  id,
  item_id,
  item_type,
  item_name,
  price,
  quantity,
  (price * quantity) as total_price
  FROM user_cart
  WHERE user_id = $1
  ORDER BY id DESC
  `;

  const { rows } = await pool.query(query, [user_id]);

  return rows;
};

module.exports = {
  getCart,
};

// REMOVE ITEM
const removeCartItem = async (id) => {
  const query = `DELETE FROM user_cart WHERE id=$1`;

  await pool.query(query, [id]);
};

module.exports = {
  addToCart,
  getCart,
  removeCartItem,
};
