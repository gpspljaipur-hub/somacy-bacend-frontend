require("dotenv").config();
const pool = require("../src/config/db");

const addCouponImageField = async () => {
    try {
        await pool.query(`
      ALTER TABLE coupons 
      ADD COLUMN IF NOT EXISTS coupon_image VARCHAR(255);
    `);
        console.log("🟢 Coupons table updated with coupon_image field.");
    } catch (err) {
        console.error("🔴 Error updating coupons table:", err);
    } finally {
        pool.end();
    }
};

addCouponImageField();
