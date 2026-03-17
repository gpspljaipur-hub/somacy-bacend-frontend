require("dotenv").config();
const pool = require("../src/config/db");
const bcrypt = require("bcryptjs");

const initDb = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("Admins table ensured.");

        // Check if any admin exists, if not create a default one
        const { rows } = await pool.query("SELECT * FROM admins LIMIT 1");
        if (rows.length === 0) {
            const hashedPwd = await bcrypt.hash("admin123", 10);
            await pool.query(
                "INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)",
                ["Admin", "admin@somacy.com", hashedPwd]
            );
            console.log("Default admin created: admin@somacy.com / admin123");
        }
    } catch (err) {
        console.error("Error initializing DB:", err);
    } finally {
        pool.end();
    }
};

initDb();
