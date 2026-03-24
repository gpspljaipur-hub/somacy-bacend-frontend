const orderModel = require("../models/userOrder.model");
const { safeParseArray } = require("../utils/safeParser");

// ADD ORDER
const addOrder = async (req, res) => {
    try {
        const image = req.file ? `/uploads/orders/${req.file.filename}` : null;
        const items = safeParseArray(req.body.items);

        const data = {
            user_id: Number(req.body.user_id),
            order_name: req.body.order_name,
            order_type: req.body.order_type,
            delivery_date: req.body.delivery_date,
            beneficiary_name: req.body.beneficiary_name,
            delivery_address: req.body.delivery_address,
            total_items: Number(req.body.total_items),
            total_amount: Number(req.body.total_amount),
            total_mrp: Number(req.body.total_mrp),
            status: req.body.status || "pending",
            order_image: image,
        };

        const order = await orderModel.addOrder(data, items);

        res.json({
            status: 1,
            message: "Order placed successfully. Tracking started.",
            data: order,
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// MY ORDERS (GET ORDER LIST)
const getOrders = async (req, res) => {
    try {
        const user_id = Number(req.body.user_id);
        const page = Number(req.body.page) || 1;
        const limit = Number(req.body.limit) || 10;
        const order_type = req.body.order_type || null;
        const status = req.body.status || null; // New: support filter by status

        const data = await orderModel.getOrders(user_id, page, limit, order_type, status);
        const total = await orderModel.countOrders(user_id, order_type, status);

        res.json({
            status: 1,
            page,
            limit,
            total_count: total,
            data,
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// ORDER DETAILS (Refined Nested Structure)
const getOrderDetails = async (req, res) => {
    try {
        const order_id = req.body.order_id ? Number(req.body.order_id) : null;
        if (!order_id) return res.status(400).json({ status: 0, message: "order_id is required" });

        const order = await orderModel.getOrderDetails({ order_id });
        if (!order) return res.status(404).json({ status: 0, message: "Order not found" });

        res.json({
            status: 1,
            message: "Order details fetched successfully",
            data: order,
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// TRACK ORDER (Returns Milestones)
const trackOrder = async (req, res) => {
    try {
        const order_id = req.body.order_id ? Number(req.body.order_id) : null;
        if (!order_id) return res.status(400).json({ status: 0, message: "order_id is required" });

        const tracking = await orderModel.trackOrder(order_id);

        res.json({
            status: 1,
            message: "Tracking info fetched successfully",
            data: tracking,
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE STATUS (Practical: Can be redirected from Admin too)
const updateStatus = async (req, res) => {
    try {
        const { order_id, status, message } = req.body;
        if (!order_id || !status) return res.status(400).json({ status: 0, message: "Order ID and status required" });

        const updated = await orderModel.updateOrderStatus(order_id, status, message);

        res.json({
            status: 1,
            message: "Order status updated and tracking event logged.",
            data: updated,
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE ORDER
const deleteOrder = async (req, res) => {
    try {
        const id = Number(req.body.id);
        if (!id) return res.status(400).json({ status: 0, message: "Order id required" });

        await orderModel.deleteOrder(id);
        res.json({ status: 1, message: "Order deleted successfully" });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    addOrder,
    getOrders,
    deleteOrder,
    getOrderDetails,
    trackOrder,
    updateStatus
};
