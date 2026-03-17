require("dotenv").config();
const pool = require("../src/config/db");

const checkSchema = async () => {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'coupons';
        `);
        console.log("Current columns in coupons table:", res.rows.map(r => r.column_name));
    } catch (err) {
        console.error("Error checking schema:", err);
    } finally {
        pool.end();
    }
};

checkSchema();
