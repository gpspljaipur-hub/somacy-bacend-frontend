const reviewModel = require("../models/review.model");

// ADD REVIEW
const addReview = async (req, res) => {
    try {
        const { doctor_id, patient_name, rating, comment } = req.body;
        if (!doctor_id || !patient_name || rating === undefined) {
            return res.status(400).json({ status: 0, message: "Missing required fields" });
        }

        const data = await reviewModel.addReview({
            doctor_id: Number(doctor_id),
            patient_name,
            rating: Number(rating),
            comment
        });

        res.status(201).json({
            status: 1,
            message: "Review added successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE REVIEW
const deleteReview = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Review ID required" });

        await reviewModel.deleteReview(Number(id));
        res.json({
            status: 1,
            message: "Review deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    addReview,
    deleteReview
};
