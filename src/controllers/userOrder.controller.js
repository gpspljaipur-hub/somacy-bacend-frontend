const orderModel = require("../models/userOrder.model");

// ADD ORDER
const addOrder = async (req, res) => {
  try {
    const image = req.file ? req.file.filename : null;

    const items = JSON.parse(req.body.items || "[]");

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
      message: "Order created successfully",
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: err.message,
    });
  }
};

// GET ORDER LIST

const getOrders = async (req, res) => {
  try {
    const user_id = Number(req.body.user_id);
    const page = Number(req.body.page) || 1;
    const limit = Number(req.body.limit) || 10;
    const order_type = req.body.order_type || null;
    const data = await orderModel.getOrders(user_id, page, limit, order_type);
    const total = await orderModel.countOrders(user_id, order_type);
    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 0,
        message: "Order not available",
      });
    }
    res.json({
      status: 1,
      page,
      limit,
      total_count: total,
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: err.message,
    });
  }
};
// DELETE ORDER
const deleteOrder = async (req, res) => {
  try {
    const id = Number(req.body.id);

    if (!id) {
      return res.json({
        status: 0,
        message: "Order id required",
      });
    }

    await orderModel.deleteOrder(id);

    res.json({
      status: 1,
      message: "Order deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: err.message,
    });
  }
};

// GET ORDER DETAILS

const getOrderDetails = async (req, res) => {
  try {
    const order_id = req.body.order_id ? Number(req.body.order_id) : null;
    const user_id = req.body.user_id ? Number(req.body.user_id) : null;

    if (!order_id && !user_id) {
      return res.json({
        status: 0,
        message: "order_id or user_id required",
      });
    }

    const rows = await orderModel.getOrderDetails({
      order_id,
      user_id,
    });

    if (!rows.length) {
      return res.status(404).json({
        status: 0,
        message: "Order not found",
      });
    }

    const order = {
      order_id: rows[0].id,
      user_id: rows[0].user_id,
      order_name: rows[0].order_name,
      status: rows[0].status,
      delivery_address: rows[0].delivery_address,
      beneficiary_name: rows[0].beneficiary_name,
      delivery_date: rows[0].delivery_date,
      order_date: rows[0].order_date,
      total_amount: rows[0].total_amount,
      total_mrp: rows[0].total_mrp,
      total_items: rows[0].total_items,
      items: [],
    };

    rows.forEach((row) => {
      order.items.push({
        item_name: row.item_name,
        item_details: row.item_details,
        quantity: row.quantity,
        price: row.price,
        mrp: row.mrp,
      });
    });

    res.json({
      status: 1,
      message: "Order details fetched successfully",
      total_records: order.items.length,
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: err.message,
    });
  }
};

module.exports = {
  addOrder,
  getOrders,
  deleteOrder,
  getOrderDetails,
};
