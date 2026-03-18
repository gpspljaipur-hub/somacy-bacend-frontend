const orderModel = require("../models/userOrder.model");

// ADD ORDER
const addOrder = async (req, res) => {
  try {
    console.log(req.body); // debug

    const user_id = Number(req.body.user_id);
    const order_name = req.body.order_name;
    const order_type = req.body.order_type;
    const delivery_date = req.body.delivery_date;

    const image = req.file ? req.file.filename : null;

    const data = await orderModel.addOrder({
      user_id,
      order_name,
      order_type,
      order_image: image,
      delivery_date,
    });

    res.json({
      status: 1,
      message: "Order created successfully",
      data,
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
      total,
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

module.exports = {
  addOrder,
  getOrders,
  deleteOrder,
};
