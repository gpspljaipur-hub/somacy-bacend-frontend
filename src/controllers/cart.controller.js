const cartModel = require("../models/cart.model");
const medicineModel = require("../models/medicine.model");
const prisma = require("../config/prisma");
const { safeParseArray } = require("../utils/safeParser");
const xlsx = require("xlsx");

// SET CART ITEM (Supports Multiple & Auto-Sync)
const setCart = async (req, res) => {
    try {
        const { order_id } = req.body;
        // Use safe parser for incoming items
        let incomingItems = safeParseArray(req.body.items, null);

        if (!order_id) {
            return res.status(400).json({ status: 0, message: "Order ID is required." });
        }

        if (!incomingItems || !Array.isArray(incomingItems)) {
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

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch order details
            const orderInfo = await tx.medicine_orders.findUnique({
                where: { id: parseInt(order_id) }
            });

            if (!orderInfo) {
                throw new Error("Order not found.");
            }

            const orderType = orderInfo.order_type || 'Non-RGHS';
            const addedItems = [];

            // 2. Process each item
            for (const itemData of incomingItems) {
                const { medicine_id, num_strips, quantity } = itemData;

                const medicine = await tx.medicines.findUnique({
                    where: { id: parseInt(medicine_id) }
                });
                if (!medicine) continue;

                const pricePerStrip = parseFloat(medicine.price);
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
                const existingQtyAggr = await tx.system_cart.aggregate({
                    where: { order_id: parseInt(order_id), medicine_id: parseInt(medicine_id) },
                    _sum: { quantity: true }
                });
                const existingQty = existingQtyAggr._sum.quantity || 0;
                const totalRequested = existingQty + totalQuantity;

                if (totalRequested > (medicine.stock_quantity || 0)) {
                    throw new Error(`Insufficient stock for ${medicine.medicine_name}. Available: ${medicine.stock_quantity || 0}, in cart: ${existingQty}`);
                }

                const newCartItem = await tx.system_cart.create({
                    data: {
                        order_id: parseInt(order_id),
                        medicine_id: parseInt(medicine_id),
                        num_strips: parseInt(num_strips) || 0,
                        pack_type: medicine.pack_type || "1",
                        quantity: totalQuantity,
                        price: pricePerStrip,
                        discount: discountRate,
                        item_total: itemTotal
                    }
                });
                addedItems.push(newCartItem);
            }

            // 3. Sync to main order (medicine_order_items)
            await tx.medicine_order_items.deleteMany({ where: { order_id: parseInt(order_id) } });
            
            const cartItems = await tx.system_cart.findMany({
                where: { order_id: parseInt(order_id) }
            });

            if (cartItems.length > 0) {
                await tx.medicine_order_items.createMany({
                    data: cartItems.map(c => ({
                        order_id: c.order_id,
                        medicine_id: c.medicine_id,
                        quantity: c.quantity,
                        price: c.price,
                        discount: c.discount,
                        item_total: c.item_total
                    }))
                });
            }

            // 4. Update order totals
            let subTotal = 0;
            const allItems = await tx.system_cart.findMany({
                where: { order_id: parseInt(order_id) },
                include: { medicines: true }
            });

            for (const c of allItems) {
                const isItemRghsCovered = (orderType === 'RGHS' && c.medicines && c.medicines.medicine_rghs === true);
                if (!isItemRghsCovered) {
                    subTotal += parseFloat(c.item_total);
                }
            }

            const deliveryCharge = parseFloat(orderInfo.delivery_charge || 0);
            const total = subTotal + deliveryCharge;

            await tx.medicine_orders.update({
                where: { id: parseInt(order_id) },
                data: {
                    sub_total_price: subTotal,
                    total_price: total
                }
            });

            return addedItems;
        });

        res.status(200).json({ status: 1, message: "Cart synced to order successfully.", data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 0, message: err.message });
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
    try {
        const { order_id } = req.body;
        let incomingItems = safeParseArray(req.body.items, null);

        if (!order_id) {
            return res.status(400).json({ status: 0, message: "Order ID is required." });
        }

        if (!incomingItems || !Array.isArray(incomingItems)) {
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

        const result = await prisma.$transaction(async (tx) => {
            const orderInfo = await tx.medicine_orders.findUnique({
                where: { id: parseInt(order_id) }
            });
            if (!orderInfo) {
                throw new Error("Order not found.");
            }
            const orderType = orderInfo.order_type || 'Non-RGHS';

            // 2. Clear existing cart
            await tx.system_cart.deleteMany({ where: { order_id: parseInt(order_id) } });

            const updatedItems = [];
            for (const itemData of incomingItems) {
                const { medicine_id, num_strips, quantity } = itemData;

                const medicine = await tx.medicines.findUnique({
                    where: { id: parseInt(medicine_id) }
                });
                if (!medicine) continue;

                const pricePerStrip = parseFloat(medicine.price);
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

                if (totalQuantity > (medicine.stock_quantity || 0)) {
                    throw new Error(`Insufficient stock for ${medicine.medicine_name}. Available: ${medicine.stock_quantity || 0}`);
                }

                const newCartItem = await tx.system_cart.create({
                    data: {
                        order_id: parseInt(order_id),
                        medicine_id: parseInt(medicine_id),
                        num_strips: parseInt(num_strips) || 0,
                        pack_type: medicine.pack_type || "1",
                        quantity: totalQuantity,
                        price: pricePerStrip,
                        discount: discountRate,
                        item_total: itemTotal
                    }
                });
                updatedItems.push(newCartItem);
            }

            // 4. Sync to main order
            await tx.medicine_order_items.deleteMany({ where: { order_id: parseInt(order_id) } });
            
            const cartItems = await tx.system_cart.findMany({
                where: { order_id: parseInt(order_id) }
            });

            if (cartItems.length > 0) {
                await tx.medicine_order_items.createMany({
                    data: cartItems.map(c => ({
                        order_id: c.order_id,
                        medicine_id: c.medicine_id,
                        quantity: c.quantity,
                        price: c.price,
                        discount: c.discount,
                        item_total: c.item_total
                    }))
                });
            }

            // 5. Update order totals
            let subTotal = 0;
            const allItems = await tx.system_cart.findMany({
                where: { order_id: parseInt(order_id) },
                include: { medicines: true }
            });

            for (const c of allItems) {
                const isItemRghsCovered = (orderType === 'RGHS' && c.medicines && c.medicines.medicine_rghs === true);
                if (!isItemRghsCovered) {
                    subTotal += parseFloat(c.item_total);
                }
            }

            const deliveryCharge = parseFloat(orderInfo.delivery_charge || 0);
            const total = subTotal + deliveryCharge;

            await tx.medicine_orders.update({
                where: { id: parseInt(order_id) },
                data: {
                    sub_total_price: subTotal,
                    total_price: total
                }
            });

            return updatedItems;
        });

        res.status(200).json({ status: 1, message: "Cart updated successfully.", data: result });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    setCart,
    getCart,
    deleteItem,
    updateCart
};
