require("dotenv").config();
const pool = require("../src/config/db");

const updateAdminsTable = async () => {
    try {
        await pool.query(`
      ALTER TABLE admins 
      ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Admin',
      ADD COLUMN IF NOT EXISTS store_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS store_address TEXT,
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS state VARCHAR(100),
      ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
    `);
        console.log("🟢 Admins table updated with new fields from Figma UI.");
    } catch (err) {
        console.error("🔴 Error updating admins table:", err);
    } finally {
        pool.end();
    }
};

updateAdminsTable();
