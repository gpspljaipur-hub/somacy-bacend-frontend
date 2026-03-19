const prisma = require("../config/prisma");

// ADD ORDER
const addOrder = async (data, items) => {
    return await prisma.$transaction(async (tx) => {
        // First create the order shell
        const order = await tx.medicine_orders.create({
            data: {
                customer_id: data.customer_id ? parseInt(data.customer_id) : null,
                total_price: 0, // Will update after items
                sub_total_price: 0, // Will update after items
                delivery_charge: data.delivery_charge ? parseFloat(data.delivery_charge) : 0,
                doctor_name: data.doctor_name || null,
                prescription_date: data.prescription_date ? new Date(data.prescription_date) : null,
                payment_method: data.payment_method || null,
                RGHS_Tid: data.RGHS_Tid || null,
                address: data.address || null,
                current_status: data.current_status || "pending",
                order_flow: data.order_flow || "Waiting for accept/reject",
                order_type: data.order_type || "Non-RGHS",
                prescription_images: data.prescription_images || [],
                user_action: "pending"
            }
        });

        if (items && items.length > 0) {
            const medicineIds = items.filter(i => i.medicine_id).map(i => parseInt(i.medicine_id));
            const medicines = await tx.medicines.findMany({
                where: { id: { in: medicineIds } }
            });
            const medMap = new Map(medicines.map(m => [m.id, m]));

            let subTotal = 0;
            const orderItemsData = [];

            for (const item of items) {
                if (!item.medicine_id) continue;
                const med = medMap.get(parseInt(item.medicine_id));

                if (!med) {
                    throw new Error(`Medicine with ID ${item.medicine_id} not found in the medical store.`);
                }

                // --- Stock Validation ---
                const requestedQty = item.quantity || 1;
                const availableStock = parseInt(med.stock_quantity || 0);
                if (requestedQty > availableStock) {
                    throw new Error(`Insufficient stock for ${med.medicine_name}. Available: ${availableStock}, Requested: ${requestedQty}`);
                }

                const price = parseFloat(med.price) || 0;
                const isRghsCovered = (data.order_type === 'RGHS' && med.medicine_rghs === true);
                const discountRate = (isRghsCovered ? parseFloat(med.rghs_discount) : parseFloat(med.medicine_discount)) || 0;

                const discountAmount = (price * (discountRate / 100));
                const finalPrice = price - discountAmount;
                const itemTotal = finalPrice * (item.quantity || 1);

                if (!isRghsCovered) {
                    subTotal += itemTotal;
                }

                orderItemsData.push({
                    order_id: order.id,
                    medicine_id: med.id,
                    quantity: requestedQty,
                    price: price,
                    discount: discountRate,
                    item_total: itemTotal
                });
            }

            // Bulk create items
            await tx.medicine_order_items.createMany({
                data: orderItemsData
            });

            const netTotal = subTotal + parseFloat(data.delivery_charge || 0);
            return await tx.medicine_orders.update({
                where: { id: order.id },
                data: {
                    sub_total_price: subTotal,
                    total_price: netTotal
                }
            });
        }

        return order;
    });
};

// GET ALL ORDERS
const getAllOrders = async (status = null, limit = 20, offset = 0, order_type = null, search = '') => {
    let where = {};
    if (status && status !== 'All') {
        where.current_status = { contains: status, mode: 'insensitive' };
    }
    if (order_type && order_type !== 'All') {
        where.order_type = order_type;
    }
    if (search) {
        where.OR = [
            { id: isNaN(search) ? undefined : parseInt(search) },
            { customers: { name: { contains: search, mode: 'insensitive' } } },
            { RGHS_Tid: { contains: search, mode: 'insensitive' } },
            { customers: { mobile: { contains: search, mode: 'insensitive' } } }
        ].filter(Boolean);
    }

    const orders = await prisma.medicine_orders.findMany({
        where,
        include: {
            customers: true,
            delivery_boys: true
        },
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });

    return orders.map(o => ({
        ...o,
        customer_name: o.customers ? o.customers.name : null,
        delivery_boy_name: o.delivery_boys ? o.delivery_boys.name : null
    }));
};

// COUNT ORDERS
const countOrders = async (status = null, order_type = null, search = '') => {
    let where = {};
    if (status && status !== 'All') {
        where.current_status = { contains: status, mode: 'insensitive' };
    }
    if (order_type && order_type !== 'All') {
        where.order_type = order_type;
    }
    if (search) {
        where.OR = [
            { id: isNaN(search) ? undefined : parseInt(search) },
            { customers: { name: { contains: search, mode: 'insensitive' } } },
            { RGHS_Tid: { contains: search, mode: 'insensitive' } },
            { customers: { mobile: { contains: search, mode: 'insensitive' } } }
        ].filter(Boolean);
    }

    return await prisma.medicine_orders.count({ where });
};

// GET ORDER BY ID (For Preview Modal)
const getOrderById = async (id) => {
    const order = await prisma.medicine_orders.findUnique({
        where: { id: parseInt(id) },
        include: {
            customers: true,
            delivery_boys: true,
            medicine_order_items: {
                include: {
                    medicines: true
                }
            }
        }
    });

    if (!order) return null;

    // Map for compatibility
    const result = {
        ...order,
        customer_name: order.customers ? order.customers.name : null,
        customer_mobile: order.customers ? order.customers.mobile : null,
        customer_email: order.customers ? order.customers.email : null,
        delivery_boy_name: order.delivery_boys ? order.delivery_boys.name : null,
        items: order.medicine_order_items.map(item => {
            const originalPrice = parseFloat(item.price);
            const discountRate = parseFloat(item.discount) || 0;
            const discountAmount = (originalPrice * (discountRate / 100));

            let displayTotal = parseFloat(item.item_total);
            let displayPrice = originalPrice - discountAmount;

            if (order.order_type === 'RGHS' && item.medicines && item.medicines.medicine_rghs === true) {
                displayTotal = 0;
                displayPrice = 0;
            }

            return {
                ...item,
                medicine_name: item.medicines ? item.medicines.medicine_name : null,
                medicine_image: (item.medicines && item.medicines.medicine_images) ? item.medicines.medicine_images[0] : null,
                medicine_rghs: item.medicines ? item.medicines.medicine_rghs : null,
                item_total: displayTotal,
                price: displayPrice,
                original_price: originalPrice,
                discount_amount: discountAmount,
                discount_percentage: discountRate
            };
        })
    };

    return result;
};

// UPDATE ORDER
const updateOrder = async (id, data) => {
    return await prisma.medicine_orders.update({
        where: { id: parseInt(id) },
        data: {
            current_status: data.current_status ?? undefined,
            order_flow: data.order_flow ?? undefined,
            delivery_boy_id: data.delivery_boy_id ? parseInt(data.delivery_boy_id) : undefined,
            updated_at: new Date()
        }
    });
};

// UPDATE PAYMENT STATUS & USER ACTION
const updatePaymentStatus = async (orderId, status) => {
    return await prisma.$transaction(async (tx) => {
        const userAction = (status === true || status === "true") ? 'accepted' : 'pending';
        const order = await tx.medicine_orders.update({
            where: { id: parseInt(orderId) },
            data: {
                user_action: userAction,
                updated_at: new Date()
            }
        });

        if ((status === true || status === "true")) {
            const items = await tx.medicine_order_items.findMany({
                where: { order_id: parseInt(orderId) }
            });

            for (const item of items) {
                await tx.medicines.update({
                    where: { id: item.medicine_id },
                    data: {
                        stock_quantity: { decrement: item.quantity }
                    }
                });
            }
        }

        return order;
    });
};

// DELETE ORDER
const deleteOrder = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    return await prisma.$transaction(async (tx) => {
        await tx.system_cart.deleteMany({ where: { order_id: { in: ids } } });
        await tx.medicine_order_items.deleteMany({ where: { order_id: { in: ids } } });
        await tx.medicine_orders.deleteMany({ where: { id: { in: ids } } });
    });
};

// GET ALL ORDERS FOR EXPORT
const getExportData = async () => {
    const orders = await prisma.medicine_orders.findMany({
        include: {
            customers: true,
            delivery_boys: true
        },
        orderBy: { id: 'desc' }
    });

    return orders.map(o => ({
        id: o.id,
        customer_name: o.customers ? o.customers.name : null,
        total_price: o.total_price,
        sub_total_price: o.sub_total_price,
        delivery_charge: o.delivery_charge,
        payment_method: o.payment_method,
        RGHS_Tid: o.RGHS_Tid,
        address: o.address,
        current_status: o.current_status,
        order_flow: o.order_flow,
        order_type: o.order_type,
        prescription_images: o.prescription_images ? o.prescription_images.join(', ') : '',
        user_action: o.user_action,
        delivery_boy_name: o.delivery_boys ? o.delivery_boys.name : null,
        created_at: o.created_at
    }));
};

const getCustomReportData = async (orderType, period) => {
    // For this complex report with aggregates and date logic, queryRaw is best.
    let whereClause = "WHERE 1=1";
    const values = [];

    if (orderType && orderType !== 'All') {
        values.push(orderType);
        whereClause += ` AND o.order_type = $${values.length}`;
    }

    if (period) {
        switch (period.toLowerCase()) {
            case 'today':
                whereClause += ` AND DATE(o.created_at) = CURRENT_DATE`;
                break;
            case 'this_week':
                whereClause += ` AND o.created_at >= date_trunc('week', CURRENT_DATE)`;
                break;
            case 'last_week':
                whereClause += ` AND o.created_at >= date_trunc('week', CURRENT_DATE - INTERVAL '1 week') 
                               AND o.created_at < date_trunc('week', CURRENT_DATE)`;
                break;
            case 'last_15_days':
                whereClause += ` AND o.created_at >= CURRENT_DATE - INTERVAL '15 days'`;
                break;
            case 'this_month':
                whereClause += ` AND o.created_at >= date_trunc('month', CURRENT_DATE)`;
                break;
            case 'last_month':
                whereClause += ` AND o.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                               AND o.created_at < date_trunc('month', CURRENT_DATE)`;
                break;
            case 'current_previous_month':
                whereClause += ` AND o.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')`;
                break;
        }
    }

    const query = `
        SELECT 
            o.id as "Order ID",
            TO_CHAR(o.created_at, 'DD-MM-YYYY') as "Date",
            o.order_type as "Type",
            COALESCE(SUM(CASE WHEN m.medicine_rghs = TRUE THEN oi.item_total ELSE 0 END), 0) as "RGHS_amount",
            COALESCE(SUM(CASE WHEN COALESCE(m.medicine_rghs, FALSE) = FALSE THEN oi.item_total ELSE 0 END), 0) + o.delivery_charge as "Non-RGHS Amount",
            o.total_price as "Customer Paid"
        FROM medicine_orders o
        LEFT JOIN medicine_order_items oi ON o.id = oi.order_id
        LEFT JOIN medicines m ON oi.medicine_id = m.id
        ${whereClause}
        GROUP BY o.id, o.created_at, o.order_type, o.total_price, o.delivery_charge
        ORDER BY o.id DESC
    `;

    return await prisma.$queryRawUnsafe(query, ...values);
};

module.exports = {
    addOrder,
    getAllOrders,
    countOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    getExportData,
    updatePaymentStatus,
    getCustomReportData
};
