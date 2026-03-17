const pool = require("../config/db");

// GET ALL CUSTOMERS
const getAllCustomers = async (limit = 20, offset = 0, search = '') => {
    let query = "SELECT * FROM customers";
    const params = [];

    if (search) {
        // Only handle valid numeric search for mobile to prevent postgres errors if strictly typed, 
        // but here assuming mobile is text/varchar in DB or safe to cast
        query += " WHERE name ILIKE $1 OR email ILIKE $1 OR mobile::text ILIKE $1";
        params.push(`%${search}%`);
    }

    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// COUNT CUSTOMERS
const countCustomers = async (search = '') => {
    let query = "SELECT COUNT(*) FROM customers";
    const params = [];

    if (search) {
        query += " WHERE name ILIKE $1 OR email ILIKE $1 OR mobile::text ILIKE $1";
        params.push(`%${search}%`);
    }

    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET CUSTOMER BY ID
const getCustomerById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
    return rows[0];
};

// UPDATE CUSTOMER
const updateCustomer = async (id, data) => {
    const query = `
    UPDATE customers
    SET name = $1,
        email = $2,
        mobile = $3,
        total_orders = $4,
        status = $5,
        address = $6,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING *;
  `;

    const values = [
        data.name,
        data.email,
        data.mobile,
        data.total_orders,
        data.status,
        data.address,
        id,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE CUSTOMER (Supports bulk)
const deleteCustomer = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM customers WHERE id = ANY($1::int[])", [ids]);
};

// ADD CUSTOMER (For Seeding/Testing)
const addCustomer = async (data) => {
    const query = `
      INSERT INTO customers (name, email, mobile, total_orders, status, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
        data.name || null,
        data.email || null,
        data.mobile || null,
        data.total_orders || 0,
        data.status || 1,
        data.address || null
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET CUSTOMER ADDRESSES (From Order History)
const getCustomerAddresses = async (id) => {
    const query = `
        SELECT DISTINCT address, MAX(created_at) as last_used 
        FROM medicine_orders 
        WHERE customer_id = $1 
        GROUP BY address 
        ORDER BY last_used DESC;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows;
};

// GET ALL CUSTOMERS FOR EXPORT
const getExportData = async () => {
    const { rows } = await pool.query("SELECT id, name, email, mobile, total_orders, status, address, created_at FROM customers ORDER BY id DESC");
    return rows;
};

module.exports = {
    getAllCustomers,
    countCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    addCustomer,
    getCustomerAddresses,
    getExportData
};
