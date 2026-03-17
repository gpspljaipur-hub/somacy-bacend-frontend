const pool = require("../config/db");

// ADD MEDICINE
const addMedicine = async (data) => {
    const query = `
    INSERT INTO medicines (
      medicine_name, medicine_images, category_id, brand_id, 
      medicine_description, medicine_type, price, medicine_discount, 
      rghs_discount, stock_status, stock_quantity, 
      prescription_required, status, pack_type, medicine_rghs
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *;
  `;

    const values = [
        data.medicine_name || null,
        data.medicine_images || [], // Expecting an array
        data.category_id || null,
        data.brand_id || null,
        data.medicine_description || null,
        data.medicine_type || null,
        data.price || 0,
        data.medicine_discount || 0,
        data.rghs_discount || 0,
        data.stock_status || 'In Stock',
        data.stock_quantity || 0,
        data.prescription_required !== undefined ? data.prescription_required : false,
        data.status !== undefined ? data.status : 1,
        data.pack_type || null,
        data.medicine_rghs !== undefined ? data.medicine_rghs : false
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET ALL MEDICINES
const getAllMedicines = async (limit = 20, offset = 0, search = '') => {
    let query = `
    SELECT m.id, m.medicine_name, m.medicine_images, m.medicine_description, m.medicine_type, 
           m.price, m.medicine_discount, m.rghs_discount, m.stock_status, m.stock_quantity, 
           m.prescription_required, m.status, m.pack_type, m.medicine_rghs, m.created_at, m.updated_at,
           m.category_id, m.brand_id,
           c.category_name, b.brand_name 
    FROM medicines m
    LEFT JOIN categories c ON m.category_id = c.id
    LEFT JOIN brands b ON m.brand_id = b.id
  `;
    const params = [];
    if (search) {
        query += " WHERE m.medicine_name ILIKE $1";
        params.push(`%${search}%`);
    }

    query += ` ORDER BY m.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// COUNT MEDICINES
const countMedicines = async (search = '') => {
    let query = "SELECT COUNT(*) FROM medicines";
    const params = [];
    if (search) {
        query += " WHERE medicine_name ILIKE $1";
        params.push(`%${search}%`);
    }
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET MEDICINE BY ID
const getMedicineById = async (id) => {
    const query = `
    SELECT m.id, m.medicine_name, m.medicine_images, m.medicine_description, m.medicine_type, 
           m.price, m.medicine_discount, m.rghs_discount, m.stock_status, m.stock_quantity, 
           m.prescription_required, m.status, m.pack_type, m.medicine_rghs, m.created_at, m.updated_at,
           m.category_id, m.brand_id,
           c.category_name, b.brand_name 
    FROM medicines m
    LEFT JOIN categories c ON m.category_id = c.id
    LEFT JOIN brands b ON m.brand_id = b.id
    WHERE m.id = $1
  `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

// UPDATE MEDICINE
const updateMedicine = async (id, data) => {
    const query = `
    UPDATE medicines
    SET medicine_name = $1,
        medicine_images = $2,
        category_id = $3,
        brand_id = $4,
        medicine_description = $5,
        medicine_type = $6,
        price = $7,
        medicine_discount = $8,
        rghs_discount = $9,
        stock_status = $10,
        stock_quantity = $11,
        prescription_required = $12,
        status = $13,
        pack_type = $14,
        medicine_rghs = $15,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $16
    RETURNING *;
  `;

    const values = [
        data.medicine_name,
        data.medicine_images,
        data.category_id,
        data.brand_id,
        data.medicine_description,
        data.medicine_type,
        data.price,
        data.medicine_discount,
        data.rghs_discount,
        data.stock_status,
        data.stock_quantity,
        data.prescription_required,
        data.status,
        data.pack_type,
        data.medicine_rghs,
        id,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE MEDICINE (Supports bulk)
const deleteMedicine = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM medicines WHERE id = ANY($1::int[])", [ids]);
};

// GET ALL MEDICINES FOR EXPORT
const getExportData = async () => {
    const query = `
    SELECT m.id, m.medicine_name, array_to_string(m.medicine_images, ', ') as medicine_images, c.category_name, b.brand_name, 
           m.medicine_type, m.price, m.medicine_discount, m.rghs_discount,
           m.stock_status, m.stock_quantity, m.prescription_required, m.status, m.pack_type,
           CASE WHEN m.medicine_rghs = TRUE THEN 'Yes' ELSE 'No' END as medicine_rghs, 
           m.created_at
    FROM medicines m
    LEFT JOIN categories c ON m.category_id = c.id
    LEFT JOIN brands b ON m.brand_id = b.id
    ORDER BY m.id DESC
  `;
    const { rows } = await pool.query(query);
    return rows;
};

module.exports = {
    addMedicine,
    getAllMedicines,
    countMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
    getExportData
};
