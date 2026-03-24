const prisma = require("../config/prisma");

// ADD ADDRESS
const addAddress = async (data) => {
    // If this is the user's first address, make it default
    const count = await prisma.user_addresses.count({ where: { user_id: parseInt(data.user_id) } });
    const isDefault = count === 0 ? true : !!data.is_default;

    // If setting as default, unset other defaults
    if (isDefault) {
        await prisma.user_addresses.updateMany({
            where: { user_id: parseInt(data.user_id) },
            data: { is_default: false }
        });
    }

    return await prisma.user_addresses.create({
        data: {
            user_id: parseInt(data.user_id),
            address_line1: data.address_line1,
            address_line2: data.address_line2,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            address_type: data.address_type || "Home",
            is_default: isDefault
        }
    });
};

// GET ADDRESSES BY USER
const getAddressesByUser = async (user_id) => {
    return await prisma.user_addresses.findMany({
        where: { user_id: parseInt(user_id) },
        orderBy: { is_default: 'desc' }
    });
};

// DELETE ADDRESS
const deleteAddress = async (id) => {
    return await prisma.user_addresses.delete({
        where: { id: parseInt(id) }
    });
};

module.exports = {
    addAddress,
    getAddressesByUser,
    deleteAddress
};
