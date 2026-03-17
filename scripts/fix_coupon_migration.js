require("dotenv").config();
const pool = require("../src/config/db");

const runMigration = async () => {
    console.log("Starting migration...");
    try {
        console.log("Connecting to DB...");
        const client = await pool.connect();
        console.log("Connected.");

        console.log("Running ALTER TABLE...");
        await client.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS coupon_image VARCHAR(255);`);
        console.log("ALTER TABLE executed.");

        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'coupons';
        `);
        console.log("Current columns:", res.rows.map(r => r.column_name));

        client.release();
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
        console.log("Pool closed.");
    }
};

runMigration();
