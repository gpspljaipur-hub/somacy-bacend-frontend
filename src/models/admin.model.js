const pool = require("../config/db");

const findByEmail = async (email) => {
    const { rows } = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
    return rows[0];
};

const findByMobileOrEmail = async (identifier) => {
    const query = `
        SELECT * FROM admins 
        WHERE email = $1 OR mobile = $1 
        LIMIT 1;
    `;
    const { rows } = await pool.query(query, [identifier]);
    return rows[0];
};

const getAdminById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM admins WHERE id = $1", [id]);
    return rows[0];
};

const createAdmin = async (data) => {
    const query = `
    INSERT INTO admins (
      name, email, password, mobile, role, 
      store_name, store_address, city, state, pincode,
      drug_license_no, gst_no
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, name, email, role;
  `;
    const values = [
        data.name || null,
        data.email || null,
        data.password || null,
        data.mobile || null,
        data.role || 'Admin',
        data.store_name || null,
        data.store_address || null,
        data.city || null,
        data.state || null,
        data.pincode || null,
        data.drug_license_no || null,
        data.gst_no || null
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const updateOTP = async (email, otp, expiry) => {
    const query = `
        UPDATE admins 
        SET otp = $1, otp_expiry = $2 
        WHERE email = $3 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [otp, expiry, email]);
    return rows[0];
};

const resetPassword = async (email, newHashedPassword) => {
    const query = `
        UPDATE admins 
        SET password = $1, otp = NULL, otp_expiry = NULL 
        WHERE email = $2 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [newHashedPassword, email]);
    return rows[0];
};

const updateAdmin = async (id, data) => {
    const query = `
        UPDATE admins
        SET name = $1,
            email = $2,
            mobile = $3,
            role = $4,
            store_name = $5,
            store_address = $6,
            city = $7,
            state = $8,
            pincode = $9,
            drug_license_no = $10,
            gst_no = $11,
            profile_image = $12,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING id, name, email, mobile, role, store_name, store_address, city, state, pincode, drug_license_no, gst_no, profile_image;
    `;
    const values = [
        data.name,
        data.email,
        data.mobile,
        data.role,
        data.store_name,
        data.store_address,
        data.city,
        data.state,
        data.pincode,
        data.drug_license_no,
        data.gst_no,
        data.profile_image || null,
        id
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const setTempEmailAndOtp = async (id, tempEmail, otp, expiry) => {
    const query = `
        UPDATE admins 
        SET temp_new_email = $1, otp = $2, otp_expiry = $3 
        WHERE id = $4
        RETURNING id;
    `;
    await pool.query(query, [tempEmail, otp, expiry, id]);
};

const verifyEmailChange = async (id) => {
    const query = `
        UPDATE admins 
        SET email = temp_new_email, temp_new_email = NULL, otp = NULL, otp_expiry = NULL 
        WHERE id = $1
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

const deleteAdmin = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM admins WHERE id = ANY($1::int[])", [ids]);
};

// GET ALL ADMINS FOR EXPORT
const getExportData = async () => {
    const { rows } = await pool.query("SELECT id, name, email, mobile, role, store_name, city, state, created_at FROM admins ORDER BY id DESC");
    return rows;
};

module.exports = {
    findByEmail,
    findByMobileOrEmail,
    createAdmin,
    updateOTP,
    resetPassword,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    setTempEmailAndOtp,
    verifyEmailChange,
    getExportData
};
