const cartModel = require("../models/cart.model");
const medicineModel = require("../models/medicine.model");
const pool = require("../config/db");
const xlsx = require("xlsx");

// SET CART ITEM (Supports Multiple & Auto-Sync)
const setCart = async (req, res) => {
    const client = await pool.connect();
    try {
        const { order_id } = req.body;
        let incomingItems = req.body.items;

        if (!order_id) {
            return res.status(400).json({ status: 0, message: "Order ID is required." });
        }

        // Support both single item and bulk array
        if (typeof incomingItems === 'string') {
            try {
                incomingItems = JSON.parse(incomingItems);
            } catch (e) {
                // Not a JSON string, fallback to single item logic below
            }
        }

        if (!Array.isArray(incomingItems)) {
            if (req.body.medicine_id) {
                incomingItems = [{
                    medicine_id: req.body.medicine_id,
                    num_strips: req.body.num_strips,
                    quantity: req.body.quantity
                }];
            } else {
                return res.status(400).json({ status: 0, message: "Items array or medicine_id is required." });
            }
        }

        // 1. Fetch order details to know the order_type
        const orderRes = await client.query("SELECT order_type, delivery_charge, current_status, order_flow FROM medicine_orders WHERE id = $1", [order_id]);
        if (orderRes.rows.length === 0) {
            client.release();
            return res.status(404).json({ status: 0, message: "Order not found." });
        }
        const orderInfo = orderRes.rows[0];
        const orderType = orderInfo.order_type || 'Non-RGHS';

        await client.query("BEGIN");

        const addedItems = [];

        // 2. Process each item
        for (const itemData of incomingItems) {
            const { medicine_id, num_strips, quantity } = itemData;

            const medRes = await client.query("SELECT * FROM medicines WHERE id = $1", [medicine_id]);
            const medicine = medRes.rows[0];
            if (!medicine) continue;

            const pricePerStrip = parseFloat(medicine.price);

            // Use RGHS discount only if it's an RGHS order AND the medicine is RGHS-eligible
            const isRghsCovered = (orderType === 'RGHS' && medicine.medicine_rghs === true);
            const discountRate = (isRghsCovered ? parseFloat(medicine.rghs_discount) : parseFloat(medicine.medicine_discount)) || 0;

            const discountPerStrip = (pricePerStrip * (discountRate / 100));
            const finalPricePerStrip = pricePerStrip - discountPerStrip;

            const medsPerStrip = parseInt(medicine.pack_type) || 1;

            let totalQuantity = 0;
            let itemTotal = 0;

            if (quantity && parseInt(quantity) > 0) {
                totalQuantity = parseInt(quantity);
                const pricePerMed = finalPricePerStrip / medsPerStrip;
                itemTotal = totalQuantity * pricePerMed;
            } else {
                const strips = parseInt(num_strips) || 0;
                totalQuantity = strips * medsPerStrip;
                itemTotal = strips * finalPricePerStrip;
            }

            // --- Stock Validation ---
            // Check existing quantity of this medicine in the cart for this order
            const existingRes = await client.query("SELECT SUM(quantity) as existing_qty FROM system_cart WHERE order_id = $1 AND medicine_id = $2", [order_id, medicine_id]);
            const existingQty = parseInt(existingRes.rows[0].existing_qty || 0);
            const totalRequested = existingQty + totalQuantity;

            if (totalRequested > (medicine.stock_quantity || 0)) {
                await client.query("ROLLBACK");
                client.release();
                return res.status(400).json({
                    status: 0,
                    message: `Insufficient stock for ${medicine.medicine_name}. Available: ${medicine.stock_quantity || 0}, in cart: ${existingQty}`
                });
            }
            // ------------------------

            const insertCartQuery = `
                INSERT INTO system_cart (order_id, medicine_id, num_strips, pack_type, quantity, price, discount, item_total)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
            const { rows } = await client.query(insertCartQuery, [
                order_id, medicine_id, parseInt(num_strips) || 0, medicine.pack_type || "1",
                totalQuantity, pricePerStrip, discountRate, itemTotal
            ]);
            addedItems.push(rows[0]);
        }

        // 3. Sync to main order (medicine_order_items)
        await client.query("DELETE FROM medicine_order_items WHERE order_id = $1", [order_id]);
        await client.query(`
            INSERT INTO medicine_order_items (order_id, medicine_id, quantity, price, discount, item_total)
            SELECT order_id, medicine_id, quantity, price, discount, item_total
            FROM system_cart
            WHERE order_id = $1;
        `, [order_id]);

        // 4. Update the main order's totals only (excluding RGHS items if it's an RGHS order)
        const totalsRes = await client.query(`
            SELECT SUM(sc.item_total) as sub_total_price 
            FROM system_cart sc
            JOIN medicines m ON sc.medicine_id = m.id
            WHERE sc.order_id = $1 
            AND NOT ($2 = 'RGHS' AND m.medicine_rghs = TRUE)
        `, [order_id, orderType]);
        const subTotal = parseFloat(totalsRes.rows[0].sub_total_price || 0);
        const deliveryCharge = parseFloat(orderInfo.delivery_charge || 0);
        const total = subTotal + deliveryCharge;

        const updateOrderQuery = "UPDATE medicine_orders SET sub_total_price = $1, total_price = $2 WHERE id = $3";
        const updateParams = [subTotal, total, order_id];

        await client.query(updateOrderQuery, updateParams);

        await client.query("COMMIT");

        res.status(200).json({ status: 1, message: "Cart synced to order successfully.", data: addedItems });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ status: 0, message: err.message });
    } finally {
        client.release();
    }
};


// LIST CART DATA (Optional filter by Order ID)
const getCart = async (req, res) => {
    try {
        const order_id = req.body ? req.body.order_id : null;
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const offset = (page - 1) * limit;

        let cartData;
        let totalCount;

        if (order_id) {
            cartData = await cartModel.getCartByOrderId(order_id, limit, offset);
            totalCount = await cartModel.countCartItemsByOrderId(order_id);
        } else {
            cartData = await cartModel.getAllCartItems(limit, offset);
            totalCount = await cartModel.countAllCartItems();
        }

        res.status(200).json({
            status: 1,
            message: "Cart data fetched successfully",
            total_count: totalCount,
            data: cartData
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE CART ITEM
const deleteItem = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ status: 0, message: "Item ID is required in body." });
        }
        await cartModel.deleteCartItem(id);
        res.status(200).json({ status: 1, message: "Item(s) removed from cart." });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE CART (Clear and Set)
const updateCart = async (req, res) => {
    const client = await pool.connect();
    try {
        const { order_id } = req.body;
        let incomingItems = req.body.items;

        if (!order_id) {
            return res.status(400).json({ status: 0, message: "Order ID is required." });
        }

        // Support both single item and bulk array
        if (typeof incomingItems === 'string') {
            try {
                incomingItems = JSON.parse(incomingItems);
            } catch (e) { }
        }

        if (!Array.isArray(incomingItems)) {
            if (req.body.medicine_id) {
                incomingItems = [{
                    medicine_id: req.body.medicine_id,
                    num_strips: req.body.num_strips,
                    quantity: req.body.quantity
                }];
            } else {
                return res.status(400).json({ status: 0, message: "Items array or medicine_id is required." });
            }
        }

        // 1. Fetch order details
        const orderRes = await client.query("SELECT order_type, delivery_charge FROM medicine_orders WHERE id = $1", [order_id]);
        if (orderRes.rows.length === 0) {
            client.release();
            return res.status(404).json({ status: 0, message: "Order not found." });
        }
        const orderInfo = orderRes.rows[0];
        const orderType = orderInfo.order_type || 'Non-RGHS';

        await client.query("BEGIN");

        // 2. Clear existing cart for this order
        await client.query("DELETE FROM system_cart WHERE order_id = $1", [order_id]);

        const updatedItems = [];

        // 3. Process new items
        for (const itemData of incomingItems) {
            const { medicine_id, num_strips, quantity } = itemData;

            const medRes = await client.query("SELECT * FROM medicines WHERE id = $1", [medicine_id]);
            const medicine = medRes.rows[0];
            if (!medicine) continue;

            const pricePerStrip = parseFloat(medicine.price);

            // Use RGHS discount only if it's an RGHS order AND the medicine is RGHS-eligible
            const isRghsCovered = (orderType === 'RGHS' && medicine.medicine_rghs === true);
            const discountRate = (isRghsCovered ? parseFloat(medicine.rghs_discount) : parseFloat(medicine.medicine_discount)) || 0;

            const discountPerStrip = (pricePerStrip * (discountRate / 100));
            const finalPricePerStrip = pricePerStrip - discountPerStrip;

            const medsPerStrip = parseInt(medicine.pack_type) || 1;

            let totalQuantity = 0;
            let itemTotal = 0;

            if (quantity && parseInt(quantity) > 0) {
                totalQuantity = parseInt(quantity);
                const pricePerMed = finalPricePerStrip / medsPerStrip;
                itemTotal = totalQuantity * pricePerMed;
            } else {
                const strips = parseInt(num_strips) || 0;
                totalQuantity = strips * medsPerStrip;
                itemTotal = strips * finalPricePerStrip;
            }

            // --- Stock Validation ---
            if (totalQuantity > (medicine.stock_quantity || 0)) {
                await client.query("ROLLBACK");
                client.release();
                return res.status(400).json({
                    status: 0,
                    message: `Insufficient stock for ${medicine.medicine_name}. Available: ${medicine.stock_quantity || 0}`
                });
            }
            // ------------------------

            const insertCartQuery = `
                INSERT INTO system_cart (order_id, medicine_id, num_strips, pack_type, quantity, price, discount, item_total)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
            const { rows } = await client.query(insertCartQuery, [
                order_id, medicine_id, parseInt(num_strips) || 0, medicine.pack_type || "1",
                totalQuantity, pricePerStrip, discountRate, itemTotal
            ]);
            updatedItems.push(rows[0]);
        }

        // 4. Sync to main order
        await client.query("DELETE FROM medicine_order_items WHERE order_id = $1", [order_id]);
        await client.query(`
            INSERT INTO medicine_order_items (order_id, medicine_id, quantity, price, discount, item_total)
            SELECT order_id, medicine_id, quantity, price, discount, item_total
            FROM system_cart
            WHERE order_id = $1;
        `, [order_id]);

        // 5. Update order totals (excluding RGHS items if it's an RGHS order)
        const totalsRes = await client.query(`
            SELECT SUM(sc.item_total) as sub_total_price 
            FROM system_cart sc
            JOIN medicines m ON sc.medicine_id = m.id
            WHERE sc.order_id = $1 
            AND NOT ($2 = 'RGHS' AND m.medicine_rghs = TRUE)
        `, [order_id, orderType]);
        const subTotal = parseFloat(totalsRes.rows[0].sub_total_price || 0);
        const deliveryCharge = parseFloat(orderInfo.delivery_charge || 0);
        const total = subTotal + deliveryCharge;

        await client.query("UPDATE medicine_orders SET sub_total_price = $1, total_price = $2 WHERE id = $3", [subTotal, total, order_id]);

        await client.query("COMMIT");
        res.status(200).json({ status: 1, message: "Cart updated successfully.", data: updatedItems });
    } catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ status: 0, message: err.message });
    } finally {
        client.release();
    }
};

module.exports = {
    setCart,
    getCart,
    deleteItem,
    updateCart
};
