const addressModel = require("../models/user_address.model");

// ADD ADDRESS
const addAddress = async (req, res) => {
    try {
        const { user_id, address_line1, address_line2, city, state, pincode, address_type, is_default } = req.body;

        if (!user_id || !address_line1 || !city || !state || !pincode) {
            return res.status(400).json({ status: 0, message: "Required fields missing" });
        }

        const data = await addressModel.addAddress({
            user_id,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            address_type,
            is_default: is_default === 'true' || is_default === true
        });

        res.status(201).json({
            status: 1,
            message: "Address added successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET ADDRESS LIST
const getAddresses = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ status: 0, message: "User ID is required" });

        const data = await addressModel.getAddressesByUser(user_id);
        res.json({
            status: 1,
            message: "Addresses fetched successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE ADDRESS
const deleteAddress = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Address ID is required" });

        await addressModel.deleteAddress(id);
        res.json({
            status: 1,
            message: "Address deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    addAddress,
    getAddresses,
    deleteAddress
};
