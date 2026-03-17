const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");

const createUser = async (req, res) => {
  try {
    const { first_name, last_name, mobile, password, otp, address } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        status: 0,
        message: "Mobile and password are required",
      });
    }

    // check existing user
    const existingUser = await userModel.getUserByMobile(mobile);

    if (existingUser) {
      return res.status(200).json({
        status: 1,
        message: "User already exists",
        data: existingUser,
      });
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.createUser({
      first_name,
      last_name,
      mobile,
      password: hashedPassword,
      otp,
      address,
    });

    res.status(201).json({
      status: 1,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: 0,
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({
        status: 0,
        message: "Mobile and password required",
      });
    }

    // check user
    const user = await userModel.getUserByMobile(mobile);

    if (!user) {
      return res.status(404).json({
        status: 0,
        message: "User not found",
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 0,
        message: "Invalid password",
      });
    }

    res.status(200).json({
      status: 1,
      message: "Login successful",
      data: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        mobile: user.mobile,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 0,
      message: error.message,
    });
  }
};

module.exports = {
  createUser,
  loginUser,
};
