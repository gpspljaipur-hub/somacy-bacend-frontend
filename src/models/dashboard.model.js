const pool = require("../config/db");

const getDashboardStats = async () => {
    // 1. Basic counts
    const countsQuery = `
        SELECT 
            (SELECT COUNT(*) FROM medicine_orders) as total_orders,
            (SELECT COUNT(*) FROM medicines) as total_medicines,
            (SELECT COUNT(*) FROM categories) as total_categories,
            (SELECT COUNT(*) FROM brands) as total_brands,
            (SELECT COUNT(*) FROM banners) as total_banners,
            (SELECT COUNT(*) FROM coupons) as total_coupons,
            (SELECT COUNT(*) FROM delivery_boys) as total_delivery_boys,
            (SELECT COUNT(*) FROM customers) as total_customers,
            (SELECT COUNT(*) FROM testimonials) as total_testimonials
    `;
    const { rows: countRows } = await pool.query(countsQuery);
    const basicCounts = countRows[0];

    // 2. Specific status counts
    const statusCountsQuery = `
        SELECT
            (SELECT COUNT(*) FROM medicine_orders WHERE created_at >= NOW() - INTERVAL '48 hours') as new_orders,
            (SELECT COUNT(*) FROM customers WHERE created_at >= NOW() - INTERVAL '24 hours') as new_customers,
            (SELECT COUNT(*) FROM medicines WHERE stock_quantity < 10 AND stock_quantity > 0) as low_stock,
            (SELECT COUNT(*) FROM medicines WHERE (stock_quantity = 0 OR stock_status ILIKE 'Out of Stock')) as out_of_stock,
            (SELECT SUM(total_price) FROM medicine_orders WHERE current_status ILIKE 'completed') as total_revenue
    `;
    const { rows: statusRows } = await pool.query(statusCountsQuery);
    const statusCounts = statusRows[0];


    // 3. Recent Orders
    const recentOrdersQuery = `
        SELECT o.*, c.name as customer_name, c.mobile as customer_mobile
        FROM medicine_orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC
        LIMIT 5
    `;
    const { rows: recentOrders } = await pool.query(recentOrdersQuery);

    return {
        ...basicCounts,
        ...statusCounts,
        recent_orders: recentOrders
    };
};

module.exports = {
    getDashboardStats
};
