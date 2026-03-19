const prisma = require("../config/prisma");

// GET USER BY MOBILE
const getUserByMobile = async (mobile) => {
  return await prisma.users.findUnique({
    where: { mobile: mobile.toString() }
  });
};

// ADD USER
const createUser = async (data) => {
  return await prisma.users.create({
    data: {
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      mobile: data.mobile.toString(),
      password: data.password,
      otp: data.otp || null,
      address: data.address || null,
    }
  });
};

module.exports = {
  getUserByMobile,
  createUser,
};
