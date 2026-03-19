const prisma = require("./prisma");
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
    const adminCount = await prisma.admins.count();
    if (adminCount === 0) {
      const hashedPwd = await bcrypt.hash("admin123", 10);
      await prisma.admins.create({
        data: {
          name: "Admin",
          email: "admin@somacy.com",
          password: hashedPwd
        }
      });
      console.log("👤 Default admin created: admin@somacy.com / admin123");
    }

    // ─── SEED DEFAULT SYSTEM SETTINGS ────────────────────────────────────────
    const settingsCount = await prisma.system_settings.count();
    if (settingsCount === 0) {
      await prisma.system_settings.create({
        data: {
          dashboard_name: 'SOMACY',
          short_name: 'NK',
          currency: '₹',
          timezone: 'Asia/Kolkata',
          show_prescription: 'Yes',
          store_name: 'Somacy Medical',
          store_email: 'admin@somacy.com'
        }
      });
      console.log("⚙️ Default system settings created.");
    }
  } catch (err) {
    console.error("❌ Error initializing Database:", err.message);
  }
};

module.exports = initDatabase;
