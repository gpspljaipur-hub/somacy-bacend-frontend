const pool = require("../config/db");

const getSettings = async () => {
    // Assuming only 1 row for settings
    const result = await pool.query("SELECT * FROM system_settings LIMIT 1");
    return result.rows[0];
};

const updateSettings = async (data) => {
    const {
        dashboard_name, short_name, currency, timezone, show_prescription,
        logo, user_app_id, user_app_key, delivery_app_id, delivery_app_key,
        store_name, store_mobile, store_email, contact_us, store_address, about_us,
        latitude, longitude, delivery_radius, per_km_price,
        referral_amount, sign_up_amount, privacy_policy, terms_conditions
    } = data;

    // Check if row exists
    const check = await pool.query("SELECT id FROM system_settings LIMIT 1");

    if (check.rows.length === 0) {
        // Insert if empty (should be handled by init_db but safe to have)
        const query = `
            INSERT INTO system_settings (
                dashboard_name, short_name, currency, timezone, show_prescription, logo,
                user_app_id, user_app_key, delivery_app_id, delivery_app_key,
                store_name, store_mobile, store_email, contact_us, store_address, about_us,
                latitude, longitude, delivery_radius, per_km_price,
                referral_amount, sign_up_amount, privacy_policy, terms_conditions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            RETURNING *;
       `;
        const values = [
            dashboard_name, short_name, currency, timezone, show_prescription, logo,
            user_app_id, user_app_key, delivery_app_id, delivery_app_key,
            store_name, store_mobile, store_email, contact_us, store_address, about_us,
            latitude, longitude, delivery_radius, per_km_price,
            referral_amount, sign_up_amount, privacy_policy, terms_conditions
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    } else {
        // Update first row
        const id = check.rows[0].id;
        // Construct dynamic update query to handle partial updates if needed, though usually full form is sent
        // Using explicit update for clarity
        const query = `
            UPDATE system_settings SET
                dashboard_name = COALESCE($1, dashboard_name),
                short_name = COALESCE($2, short_name),
                currency = COALESCE($3, currency),
                timezone = COALESCE($4, timezone),
                show_prescription = COALESCE($5, show_prescription),
                logo = COALESCE($6, logo),
                user_app_id = COALESCE($7, user_app_id),
                user_app_key = COALESCE($8, user_app_key),
                delivery_app_id = COALESCE($9, delivery_app_id),
                delivery_app_key = COALESCE($10, delivery_app_key),
                store_name = COALESCE($11, store_name),
                store_mobile = COALESCE($12, store_mobile),
                store_email = COALESCE($13, store_email),
                contact_us = COALESCE($14, contact_us),
                store_address = COALESCE($15, store_address),
                about_us = COALESCE($16, about_us),
                latitude = COALESCE($17, latitude),
                longitude = COALESCE($18, longitude),
                delivery_radius = COALESCE($19, delivery_radius),
                per_km_price = COALESCE($20, per_km_price),
                referral_amount = COALESCE($21, referral_amount),
                sign_up_amount = COALESCE($22, sign_up_amount),
                privacy_policy = COALESCE($23, privacy_policy),
                terms_conditions = COALESCE($24, terms_conditions),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $25
            RETURNING *;
        `;
        const values = [
            dashboard_name, short_name, currency, timezone, show_prescription, logo,
            user_app_id, user_app_key, delivery_app_id, delivery_app_key,
            store_name, store_mobile, store_email, contact_us, store_address, about_us,
            latitude, longitude, delivery_radius, per_km_price,
            referral_amount, sign_up_amount, privacy_policy, terms_conditions,
            id
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }
};

module.exports = {
    getSettings,
    updateSettings
};
