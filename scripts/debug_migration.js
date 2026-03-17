const fs = require('fs');
const path = require('path');
require("dotenv").config();
const { Pool } = require("pg");

const logFile = path.join(__dirname, 'migration_log.txt');

const log = (message) => {
    const timestamp = new Date().toISOString();
    const msg = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, msg);
};

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const runMigration = async () => {
    log("Starting debug migration...");
    try {
        log("Connecting to DB...");
        const client = await pool.connect();
        log("Connected successfully.");

        log("Checking if column exists...");
        const checkRes = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'coupons' AND column_name = 'coupon_image';
        `);

        if (checkRes.rows.length > 0) {
            log("Column 'coupon_image' ALREADY EXISTS.");
        } else {
            log("Column 'coupon_image' DOES NOT EXIST. Adding it now...");
            await client.query(`ALTER TABLE coupons ADD COLUMN coupon_image VARCHAR(255);`);
            log("ALTER TABLE executed successfully.");
        }

        const verifyRes = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'coupons';
        `);
        log("Current columns in coupons table: " + verifyRes.rows.map(r => r.column_name).join(', '));

        client.release();
    } catch (err) {
        log("Migration failed with error: " + err.message);
        log("Stack: " + err.stack);
    } finally {
        await pool.end();
        log("Pool closed.");
    }
};

runMigration();
