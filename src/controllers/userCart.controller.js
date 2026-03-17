const cartModel = require("../models/userCart.model");

const addToCart = async (req, res) => {
  console.log(req.body, "nsfkjdnkjncakdsfv"); // debug

  try {
    const user_id = Number(req.body.user_id);
    const item_id = Number(req.body.item_id);
    const item_type = req.body.item_type;
    const item_name = req.body.item_name;
    const price = Number(req.body.price);

    if (!user_id || !item_id || !item_type || !item_name || !price) {
      return res.json({
        status: 0,
        message: "Missing required fields",
      });
    }

    const data = await cartModel.addToCart(
      user_id,
      item_id,
      item_type,
      item_name,
      price,
    );

    res.json({
      status: 1,
      message: "Item added to cart",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: err.message,
    });
  }
};

const getCart = async (req, res) => {
  try {
    const user_id = Number(req.body.user_id);

    if (!user_id) {
      return res.status(400).json({
        status: 0,
        message: "user_id is required",
      });
    }

    const data = await cartModel.getCart(user_id);

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 0,
        message: "Cart item not available",
      });
    }

    res.json({
      status: 1,
      message: "Cart list fetched successfully",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: err.message,
    });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const id = Number(req.body.id);

    await cartModel.removeCartItem(id);

    res.json({
      status: 1,
      message: "Item removed from cart",
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: err.message,
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeCartItem,
};
