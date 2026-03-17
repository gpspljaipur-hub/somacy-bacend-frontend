require("dotenv").config();
const pool = require("../src/config/db");

const migrate = async () => {
    try {
        console.log("🚀 Starting Medicine Order & Cart Migration...");

        // 1. Update medicine_orders table
        await pool.query(`
            ALTER TABLE medicine_orders 
            ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'Normal',
            ADD COLUMN IF NOT EXISTS prescription_image TEXT,
            ADD COLUMN IF NOT EXISTS customer_id_manual INTEGER; -- In case we need to link to customers not in the table yet
        `);
        console.log("✅ medicine_orders table updated.");

        // 2. Create system_cart table (for the "Set Cart" feature)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_cart (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES medicine_orders(id) ON DELETE CASCADE,
                medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
                num_strips INTEGER DEFAULT 1,
                pack_type VARCHAR(50), -- e.g., Syrup, Tablet
                quantity INTEGER DEFAULT 1,
                price DECIMAL(10,2) DEFAULT 0,
                discount DECIMAL(10,2) DEFAULT 0,
                item_total DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ system_cart table ensured.");

        // 3. Ensure medicine_orders has status fields in sync with UI
        // We'll use order_flow for the technical state and current_status for the UI state
        // UI states: pending, completed, cancelled
        // Over Flow (order_flow): waiting for accept/reject, waiting for assign, waiting for delivery boy decision, out for delivery

        console.log("🎉 Migration completed successfully.");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        pool.end();
    }
};

migrate();
