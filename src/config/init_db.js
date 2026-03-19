const pool = require("./db");
const bcrypt = require("bcryptjs");
const { execSync } = require("child_process");

const initDatabase = async () => {
  try {
    console.log("🛠️ Syncing Database Schema with Prisma...");
    
    // Automatically runs Prisma db push to apply schema.prisma state to the DB
    try {
      execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
      console.log("✅ All Database Tables Ensured via Prisma.");
    } catch (pushErr) {
      console.error("⚠️ Prisma schema sync had an issue:", pushErr.message);
    }

    // ─── SEED DEFAULT ADMIN ───────────────────────────────────────────────────
    const { rows } = await pool.query("SELECT * FROM admins LIMIT 1");
    if (rows.length === 0) {
      const hashedPwd = await bcrypt.hash("admin123", 10);
      await pool.query(
        "INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)",
        ["Admin", "admin@somacy.com", hashedPwd],
      );
      console.log("👤 Default admin created: admin@somacy.com / admin123");
    }

    // ─── SEED DEFAULT SYSTEM SETTINGS ────────────────────────────────────────
    const { rows: settingsRows } = await pool.query(
      "SELECT * FROM system_settings LIMIT 1",
    );
    if (settingsRows.length === 0) {
      await pool.query(`
        INSERT INTO system_settings (
          dashboard_name, short_name, currency, timezone, show_prescription,
          store_name, store_email
        ) VALUES (
          'SOMACY', 'NK', '₹', 'Asia/Kolkata', 'Yes',
          'Somacy Medical', 'admin@somacy.com'
        )
      `);
      console.log("⚙️ Default system settings created.");
    }
  } catch (err) {
    console.error("❌ Error initializing Database:", err.message);
  }
};

module.exports = initDatabase;
