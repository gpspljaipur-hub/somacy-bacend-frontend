require("dotenv").config();
const pool = require("../src/config/db");

const addOtpFields = async () => {
    try {
        await pool.query(`
      ALTER TABLE admins 
      ADD COLUMN IF NOT EXISTS otp VARCHAR(6),
      ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP;
    `);
        console.log("🟢 Admins table updated with OTP fields.");
    } catch (err) {
        console.error("🔴 Error updating admins table:", err);
    } finally {
        pool.end();
    }
};

addOtpFields();
