const dashboardModel = require("../models/dashboard.model");

const getStats = async (req, res) => {
    try {
        const stats = await dashboardModel.getDashboardStats();
        res.status(200).json({
            status: 1,
            message: "Dashboard statistics fetched successfully",
            data: stats
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message
        });
    }
};

module.exports = {
    getStats
};
