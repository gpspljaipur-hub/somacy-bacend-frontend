const testimonialModel = require("../models/testimonial.model");
const xlsx = require("xlsx");

// GET ALL
const getTestimonials = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        const data = await testimonialModel.getAllTestimonials(limit, offset, search);
        const total = await testimonialModel.countTestimonials(search);

        res.json({
            status: 1,
            message: "Testimonials fetched successfully",
            total_count: total,
            data: data
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

// ADD
const addTestimonial = async (req, res) => {
    try {
        const { name, designation, content, status } = req.body;
        // Image logic
        let image = null;
        if (req.file) {
            image = `uploads/${req.file.filename}`;
        }
        else if (req.body.image) {
            // Sometimes strictly passed as url string if no file upload? usually file upload.
            image = req.body.image;
        }

        const newTestimonial = await testimonialModel.addTestimonial({
            name,
            designation,
            content,
            image,
            status: status ? Number(status) : 1
        });

        res.status(201).json({
            status: 1,
            message: "Testimonial added successfully",
            data: newTestimonial
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

// DELETE
const deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.body; // or req.params depending on route setup. Customer uses body.

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "ID is required",
                data: null
            });
        }

        await testimonialModel.deleteTestimonial(id);
        res.json({
            status: 1,
            message: "Testimonial(s) deleted successfully",
            data: null
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

module.exports = {
    getTestimonials,
    addTestimonial,
    deleteTestimonial
};
