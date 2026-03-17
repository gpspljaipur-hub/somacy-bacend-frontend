const pool = require("../config/db");

// ADD ORDER
const addOrder = async (data, items) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const orderQuery = `
      INSERT INTO medicine_orders (
        customer_id, total_price, sub_total_price, delivery_charge, doctor_name,
prescription_date,
        payment_method, "RGHS_Tid", address, current_status, order_flow,
        order_type, prescription_images, user_action
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;
       const orderValues = [
         data.customer_id || null, // $1
         data.total_price || 0, // $2
         data.sub_total_price || 0, // $3
         data.delivery_charge || 0, // $4
         data.doctor_name || null, // $5
         data.prescription_date || null, // $6
         data.payment_method || null, // $7
         data.RGHS_Tid || null, // $8
         data.address || null, // $9
         data.current_status || "pending", // $10
         data.order_flow || "Waiting for accept/reject", // $11
         data.order_type || "Non-RGHS", // $12
         data.prescription_images || [], // $13
         "pending", // $14
       ];

        const { rows: orderRows } = await client.query(orderQuery, orderValues);
        const order = orderRows[0];

        if (items && items.length > 0) {
            const itemQuery = `
        INSERT INTO medicine_order_items (order_id, medicine_id, quantity, price, discount, item_total)
        VALUES ($1, $2, $3, $4, $5, $6);
      `;
            let subTotal = 0;

            for (const item of items) {
                if (!item.medicine_id) continue;

                // Fetch medicine price, discount, and stock from DB to ensure accuracy
                const medRes = await client.query("SELECT medicine_name, price, medicine_discount, rghs_discount, medicine_rghs, stock_quantity FROM medicines WHERE id = $1", [item.medicine_id]);
                const med = medRes.rows[0];

                if (!med) {
                    throw new Error(`Medicine with ID ${item.medicine_id} not found in the medical store.`);
                }

                // --- Stock Validation ---
                const requestedQty = item.quantity || 1;
                const availableStock = parseInt(med.stock_quantity || 0);
                if (requestedQty > availableStock) {
                    throw new Error(`Insufficient stock for ${med.medicine_name}. Available: ${availableStock}, Requested: ${requestedQty}`);
                }
                // ------------------------

                const price = parseFloat(med.price) || 0;

                // Use RGHS discount only if it's an RGHS order AND the medicine is RGHS-eligible
                // Otherwise, use the standard medicine discount
                const isRghsCovered = (data.order_type === 'RGHS' && med.medicine_rghs === true);
                const discountRate = (isRghsCovered ? parseFloat(med.rghs_discount) : parseFloat(med.medicine_discount)) || 0;

                const discountAmount = (price * (discountRate / 100));
                const finalPrice = price - discountAmount;
                const itemTotal = finalPrice * (item.quantity || 1);

                // Add to subTotal only if it's NOT an RGHS med in an RGHS order
                if (!(data.order_type === 'RGHS' && med.medicine_rghs === true)) {
                    subTotal += itemTotal;
                }

                await client.query(itemQuery, [
                    order.id,
                    item.medicine_id,
                    item.quantity || 1,
                    price,
                    discountRate,
                    itemTotal
                ]);
            }

            // Update the main order with the actual calculated totals
            const netTotal = subTotal + parseFloat(data.delivery_charge || 0);
            await client.query(
                "UPDATE medicine_orders SET sub_total_price = $1, total_price = $2 WHERE id = $3",
                [subTotal, netTotal, order.id]
            );

            // Update the local order object for the return value
            order.sub_total_price = subTotal;
            order.total_price = netTotal;
        }

        await client.query("COMMIT");
        return order;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

// GET ALL ORDERS
const getAllOrders = async (status = null, limit = 20, offset = 0, order_type = null, search = '') => {
    let query = `
    SELECT o.*, c.name as customer_name, db.name as delivery_boy_name
    FROM medicine_orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN delivery_boys db ON o.delivery_boy_id = db.id
  `;

    const values = [];
    const conditions = [];

    if (status && status !== 'All') {
        conditions.push(`o.current_status ILIKE $${conditions.length + 1}`);
        values.push(status);
    }

    if (order_type && order_type !== 'All') {
        conditions.push(`o.order_type = $${conditions.length + 1}`);
        values.push(order_type);
    }

    if (search) {
        conditions.push(`(o.id::text ILIKE $${conditions.length + 1} OR c.name ILIKE $${conditions.length + 1} OR o."RGHS_Tid" ILIKE $${conditions.length + 1} OR c.mobile ILIKE $${conditions.length + 1})`);
        values.push(`%${search}%`);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += ` ORDER BY o.id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    return rows;
};

// COUNT ORDERS
const countOrders = async (status = null, order_type = null, search = '') => {
    let query = `
        SELECT COUNT(*) 
        FROM medicine_orders o
        LEFT JOIN customers c ON o.customer_id = c.id
    `;
    const values = [];
    const conditions = [];

    if (status && status !== 'All') {
        conditions.push(`o.current_status ILIKE $${conditions.length + 1}`);
        values.push(status);
    }

    if (order_type && order_type !== 'All') {
        conditions.push(`o.order_type = $${conditions.length + 1}`);
        values.push(order_type);
    }

    if (search) {
        conditions.push(`(o.id::text ILIKE $${conditions.length + 1} OR c.name ILIKE $${conditions.length + 1} OR o."RGHS_Tid" ILIKE $${conditions.length + 1} OR c.mobile ILIKE $${conditions.length + 1})`);
        values.push(`%${search}%`);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    const { rows } = await pool.query(query, values);
    return parseInt(rows[0].count);
};

// GET ORDER BY ID (For Preview Modal)
const getOrderById = async (id) => {
    const orderQuery = `
    SELECT o.*, 
           c.name as customer_name, c.mobile as customer_mobile, c.email as customer_email,
           db.name as delivery_boy_name
    FROM medicine_orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN delivery_boys db ON o.delivery_boy_id = db.id
    WHERE o.id = $1
  `;
    const { rows: orderRows } = await pool.query(orderQuery, [id]);

    if (orderRows.length === 0) return null;

    const order = orderRows[0];

    const itemsQuery = `
    SELECT oi.*, m.medicine_name, (m.medicine_images)[1] as medicine_image, m.medicine_rghs
    FROM medicine_order_items oi
    LEFT JOIN medicines m ON oi.medicine_id = m.id
    WHERE oi.order_id = $1
  `;
    const { rows: itemsRows } = await pool.query(itemsQuery, [id]);

    order.items = itemsRows.map(item => {
        const originalPrice = parseFloat(item.price);
        const discountRate = parseFloat(item.discount) || 0;
        const discountAmount = (originalPrice * (discountRate / 100));

        // For preview, we show the calculated discount
        let displayTotal = parseFloat(item.item_total);
        let displayPrice = originalPrice - discountAmount;

        // Force 0 in preview ONLY for covered RGHS meds in RGHS orders
        if (order.order_type === 'RGHS' && item.medicine_rghs === true) {
            displayTotal = 0;
            displayPrice = 0;
        }

        return {
            ...item,
            item_total: displayTotal,
            price: displayPrice,
            original_price: originalPrice,
            discount_amount: discountAmount,
            discount_percentage: discountRate
        };
    });
    return order;
};

// UPDATE ORDER (Status, Delivery Boy, etc.)
const updateOrder = async (id, data) => {
    // Dynamically build the update query to handle partial updates
    const fields = [];
    const values = [];
    let i = 1;

    if (data.current_status) {
        fields.push(`current_status = $${i++}`);
        values.push(data.current_status);
    }
    if (data.order_flow) {
        fields.push(`order_flow = $${i++}`);
        values.push(data.order_flow);
    }
    if (data.delivery_boy_id) {
        fields.push(`delivery_boy_id = $${i++}`);
        values.push(data.delivery_boy_id);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
        UPDATE medicine_orders 
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $${i} 
        RETURNING *;
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// UPDATE PAYMENT STATUS & USER ACTION
const updatePaymentStatus = async (orderId, status) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const userAction = status ? 'accepted' : 'pending';
        const query = `
            UPDATE medicine_orders 
            SET user_action = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *;
        `;
        const { rows } = await client.query(query, [userAction, orderId]);
        const order = rows[0];

        if (!order) {
            await client.query("ROLLBACK");
            return null;
        }

        // Only update stock if payment is successful/accepted
        if (status === true || status === "true") {
            // Get items for this order
            const itemsRes = await client.query("SELECT medicine_id, quantity FROM medicine_order_items WHERE order_id = $1", [orderId]);

            for (const item of itemsRes.rows) {
                await client.query(
                    "UPDATE medicines SET stock_quantity = stock_quantity - $1 WHERE id = $2",
                    [item.quantity, item.medicine_id]
                );
            }
        }

        await client.query("COMMIT");
        return order;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

// DELETE ORDER (Supports bulk)
const deleteOrder = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Delete associated cart items
        await client.query("DELETE FROM system_cart WHERE order_id = ANY($1::int[])", [ids]);

        // Delete associated order items
        await client.query("DELETE FROM medicine_order_items WHERE order_id = ANY($1::int[])", [ids]);

        // Delete the order itself
        await client.query("DELETE FROM medicine_orders WHERE id = ANY($1::int[])", [ids]);

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

// GET ALL ORDERS FOR EXPORT
const getExportData = async () => {
    const query = `
    SELECT o.id, c.name as customer_name, o.total_price, o.sub_total_price, o.delivery_charge, 
           o.payment_method, o."RGHS_Tid", o.address, o.current_status, o.order_flow,
           o.order_type, array_to_string(o.prescription_images, ', ') as prescription_images, 
           o.user_action, db.name as delivery_boy_name, o.created_at
    FROM medicine_orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN delivery_boys db ON o.delivery_boy_id = db.id
    ORDER BY o.id DESC
  `;
    const { rows } = await pool.query(query);
    return rows;
};

const getCustomReportData = async (orderType, period) => {
    let query = `
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
    WHERE 1=1
  `;

    const values = [];

    if (orderType && orderType !== 'All') {
        query += ` AND o.order_type = $${values.length + 1}`;
        values.push(orderType);
    }

    if (period) {
        switch (period.toLowerCase()) {
            case 'today':
                query += ` AND DATE(o.created_at) = CURRENT_DATE`;
                break;
            case 'this_week':
                query += ` AND o.created_at >= date_trunc('week', CURRENT_DATE)`;
                break;
            case 'last_week':
                query += ` AND o.created_at >= date_trunc('week', CURRENT_DATE - INTERVAL '1 week') 
                           AND o.created_at < date_trunc('week', CURRENT_DATE)`;
                break;
            case 'last_15_days':
                query += ` AND o.created_at >= CURRENT_DATE - INTERVAL '15 days'`;
                break;
            case 'this_month':
                query += ` AND o.created_at >= date_trunc('month', CURRENT_DATE)`;
                break;
            case 'last_month':
                query += ` AND o.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                           AND o.created_at < date_trunc('month', CURRENT_DATE)`;
                break;
            case 'current_previous_month':
                // Current month + Previous month (Last 2 months essentially)
                query += ` AND o.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')`;
                break;
        }
    }

    query += " GROUP BY o.id, o.created_at, o.order_type, o.total_price, o.delivery_charge";
    query += " ORDER BY o.id DESC";

    const { rows } = await pool.query(query, values);
    return rows;
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
