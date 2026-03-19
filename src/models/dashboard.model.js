const prisma = require("../config/prisma");

const getDashboardStats = async () => {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    const [
        total_orders,
        total_medicines,
        total_categories,
        total_brands,
        total_banners,
        total_coupons,
        total_delivery_boys,
        total_customers,
        total_testimonials,
        new_orders,
        new_customers,
        low_stock,
        out_of_stock,
        revenueData,
        recent_orders
    ] = await Promise.all([
        prisma.medicine_orders.count(),
        prisma.medicines.count(),
        prisma.categories.count(),
        prisma.brands.count(),
        prisma.banners.count(),
        prisma.coupons.count(),
        prisma.delivery_boys.count(),
        prisma.customers.count(),
        prisma.testimonials.count(),
        prisma.medicine_orders.count({ where: { created_at: { gte: fortyEightHoursAgo } } }),
        prisma.customers.count({ where: { created_at: { gte: twentyFourHoursAgo } } }),
        prisma.medicines.count({ where: { stock_quantity: { lt: 10, gt: 0 } } }),
        prisma.medicines.count({ 
            where: { 
                OR: [
                    { stock_quantity: 0 },
                    { stock_status: { contains: 'Out of Stock', mode: 'insensitive' } }
                ]
            } 
        }),
        prisma.medicine_orders.aggregate({
            _sum: { total_price: true },
            where: { current_status: { contains: 'completed', mode: 'insensitive' } }
        }),
        prisma.medicine_orders.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            include: {
                customers: true
            }
        })
    ]);

    return {
        total_orders,
        total_medicines,
        total_categories,
        total_brands,
        total_banners,
        total_coupons,
        total_delivery_boys,
        total_customers,
        total_testimonials,
        new_orders,
        new_customers,
        low_stock,
        out_of_stock,
        total_revenue: revenueData._sum.total_price || 0,
        recent_orders: recent_orders.map(o => ({
            ...o,
            customer_name: o.customers ? o.customers.name : null,
            customer_mobile: o.customers ? o.customers.mobile : null
        }))
    };
};

module.exports = {
    getDashboardStats
};
