const pool = require("./db");
const bcrypt = require("bcryptjs");

const initDatabase = async () => {
  try {
    console.log("🛠️ Initializing Database Tables...");

    // 1. ADMINS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile VARCHAR(20),
        role VARCHAR(50) DEFAULT 'Admin',
        store_name VARCHAR(255),
        store_address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        drug_license_no VARCHAR(255),
        gst_no VARCHAR(20),
        otp VARCHAR(6),
        otp_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure new columns exist
    await pool.query(`
      ALTER TABLE admins 
      ADD COLUMN IF NOT EXISTS drug_license_no VARCHAR(255),
      ADD COLUMN IF NOT EXISTS gst_no VARCHAR(20),
      ADD COLUMN IF NOT EXISTS profile_image TEXT,
      ADD COLUMN IF NOT EXISTS temp_new_email VARCHAR(255);
    `);

    // 2. CATEGORIES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        category_name VARCHAR(255),
        category_image TEXT,
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. BRANDS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        brand_name VARCHAR(255),
        brand_image TEXT,
        is_popular BOOLEAN DEFAULT FALSE,
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. BANNERS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        banner_image TEXT,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. COUPONS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        coupon_code VARCHAR(50),
        coupon_title VARCHAR(255),
        coupon_description TEXT,
        expiry_date DATE,
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        discount DECIMAL(10,2) DEFAULT 0,
        status INTEGER DEFAULT 1,
        coupon_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Ensure coupon_image column exists for existing tables
    await pool.query(`
            ALTER TABLE coupons 
            ADD COLUMN IF NOT EXISTS coupon_image VARCHAR(255);
        `);

    // 6. DELIVERY BOYS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_boys (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        mobile VARCHAR(20),
        email VARCHAR(255),
        commission_percentage DECIMAL(5,2) DEFAULT 0,
        address TEXT,
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. CUSTOMERS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        mobile VARCHAR(20),
        address TEXT,
        total_orders INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
    `);

    // 8. MEDICINES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id SERIAL PRIMARY KEY,
        medicine_name VARCHAR(255),
        medicine_images TEXT[],
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
        medicine_description TEXT,
        medicine_type VARCHAR(100),
        price DECIMAL(10,2) DEFAULT 0,
        medicine_discount DECIMAL(10,2) DEFAULT 0,
        rghs_discount DECIMAL(10,2) DEFAULT 0,
        stock_status VARCHAR(50) DEFAULT 'In Stock',
        stock_quantity INTEGER DEFAULT 0,
        prescription_required BOOLEAN DEFAULT FALSE,
        medicine_rghs BOOLEAN DEFAULT FALSE,
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure new columns exist for medicines
    await pool.query(`
      ALTER TABLE medicines 
      ADD COLUMN IF NOT EXISTS medicine_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS medicine_discount DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS rghs_discount DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS medicine_images TEXT[],
      ADD COLUMN IF NOT EXISTS pack_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS medicine_rghs BOOLEAN DEFAULT FALSE;
    `);

    // 9. MEDICINE ORDERS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicine_orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        delivery_boy_id INTEGER REFERENCES delivery_boys(id) ON DELETE SET NULL,
        total_price DECIMAL(10,2) DEFAULT 0,
        sub_total_price DECIMAL(10,2) DEFAULT 0,
        delivery_charge DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50),
        "RGHS_Tid" VARCHAR(255),
        address TEXT,
        current_status VARCHAR(50) DEFAULT 'Pending',
        order_flow VARCHAR(100) DEFAULT 'Waiting for accept/reject',
        order_type VARCHAR(20) DEFAULT 'Non-RGHS',
        prescription_images TEXT[],
        customer_id_manual INTEGER,
        user_action VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure new columns exist for existing tables
    await pool.query(`
      ALTER TABLE medicine_orders 
      ADD COLUMN IF NOT EXISTS "RGHS_Tid" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'Non-RGHS',
      ADD COLUMN IF NOT EXISTS prescription_images TEXT[],
      ADD COLUMN IF NOT EXISTS customer_id_manual INTEGER,
      ADD COLUMN IF NOT EXISTS user_action VARCHAR(20) DEFAULT 'pending';
    `);

    await pool.query('ALTER TABLE medicine_orders ALTER COLUMN payment_method DROP DEFAULT;');

    // 10. MEDICINE ORDER ITEMS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicine_order_items(
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES medicine_orders(id) ON DELETE CASCADE,
      medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
      quantity INTEGER DEFAULT 1,
      price DECIMAL(10, 2) DEFAULT 0,
      discount DECIMAL(10, 2) DEFAULT 0,
      item_total DECIMAL(10, 2) DEFAULT 0
    );
    `);

    // 10.5 SYSTEM CART TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_cart(
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES medicine_orders(id) ON DELETE CASCADE,
      medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
      num_strips INTEGER DEFAULT 1,
      pack_type VARCHAR(50),
      quantity INTEGER DEFAULT 1,
      price DECIMAL(10, 2) DEFAULT 0,
      discount DECIMAL(10, 2) DEFAULT 0,
      item_total DECIMAL(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    // 11. PAYMENT GATEWAYS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_gateways(
      id SERIAL PRIMARY KEY,
      gateway_name VARCHAR(255),
      gateway_image TEXT,
      status INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    // 12. TESTIMONIALS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS testimonials(
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      designation VARCHAR(255),
      content TEXT,
      image TEXT,
      status INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    // 13. LAB TESTS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lab_tests (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(255),
        amount DECIMAL(10, 2) DEFAULT 0,
        discount DECIMAL(10, 2) DEFAULT 0,
        rghs_discount DECIMAL(10, 2) DEFAULT 0,
        is_rghs BOOLEAN DEFAULT FALSE,
        description TEXT,
        image VARCHAR(255),
        lab_test_type VARCHAR(100),
        status INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure new columns exist for lab_tests
    await pool.query(`
      ALTER TABLE lab_tests 
      ADD COLUMN IF NOT EXISTS image VARCHAR(255),
      ADD COLUMN IF NOT EXISTS lab_test_type VARCHAR(100) DEFAULT 'Singular',
      ADD COLUMN IF NOT EXISTS package_name VARCHAR(255);

      ALTER TABLE lab_tests ALTER COLUMN test_name DROP NOT NULL;
    `);

    // 13.5 LAB TEST ITEMS (For Combo Packages)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lab_test_items (
        id SERIAL PRIMARY KEY,
        combo_id INTEGER REFERENCES lab_tests(id) ON DELETE CASCADE,
        test_id INTEGER REFERENCES lab_tests(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 14. DEVICES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        device_image VARCHAR(255),
        amount DECIMAL(10, 2) DEFAULT 0,
        is_rghs BOOLEAN DEFAULT FALSE,
        discount DECIMAL(5, 2) DEFAULT 0,
        rghs_discount DECIMAL(5, 2) DEFAULT 0,
        status INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 15. GENERAL ITEMS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS general_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        amount DECIMAL(10, 2) DEFAULT 0,
        discount DECIMAL(5, 2) DEFAULT 0,
        status INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ All Database Tables Ensured.");

    // Check if default admin exists
    const { rows } = await pool.query("SELECT * FROM admins LIMIT 1");
    if (rows.length === 0) {
      const hashedPwd = await bcrypt.hash("admin123", 10);
      await pool.query(
        "INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)",
        ["Admin", "admin@somacy.com", hashedPwd]
      );
      console.log("👤 Default admin created: admin@somacy.com / admin123");
    }

    // 13. SYSTEM SETTINGS TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings(
      id SERIAL PRIMARY KEY,
      dashboard_name VARCHAR(255) DEFAULT 'SOMACY',
      short_name VARCHAR(50) DEFAULT 'NK',
      currency VARCHAR(10) DEFAULT '₹',
      timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
      show_prescription VARCHAR(10) DEFAULT 'Yes',
      logo VARCHAR(255),

      user_app_id VARCHAR(255),
      user_app_key VARCHAR(255),
      delivery_app_id VARCHAR(255),
      delivery_app_key VARCHAR(255),

      store_name VARCHAR(255),
      store_mobile VARCHAR(20),
      store_email VARCHAR(255),
      contact_us VARCHAR(20),
      store_address TEXT,
      about_us TEXT,

      latitude VARCHAR(50),
      longitude VARCHAR(50),
      delivery_radius VARCHAR(50),
      per_km_price VARCHAR(50),

      referral_amount VARCHAR(50),
      sign_up_amount VARCHAR(50),

      privacy_policy TEXT,
      terms_conditions TEXT,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);

    // Ensure default settings row exists
    const { rows: settingsRows } = await pool.query("SELECT * FROM system_settings LIMIT 1");
    if (settingsRows.length === 0) {
      await pool.query(`
        INSERT INTO system_settings(
      dashboard_name, short_name, currency, timezone, show_prescription,
      store_name, store_email
    ) VALUES(
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
