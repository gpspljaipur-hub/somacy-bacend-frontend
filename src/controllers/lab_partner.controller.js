const partnerModel = require("../models/lab_partner.model");

// ADD LAB PARTNER
const addPartner = async (req, res) => {
    try {
        const { name, rating, accreditation, description, status } = req.body;
        const logo = req.file ? `/uploads/lab_partners/${req.file.filename}` : null;

        if (!name) return res.status(400).json({ status: 0, message: "Partner name is required" });

        const data = await partnerModel.addPartner({
            name,
            logo,
            rating,
            accreditation,
            description,
            status
        });

        res.status(201).json({ status: 1, message: "Lab partner added successfully", data: data });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

// GET PARTNERS
const getPartners = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.body;
        const offset = (Number(page) - 1) * Number(limit);

        const data = await partnerModel.getPartners(limit, offset, search);
        const total = await partnerModel.countPartners(search);

        res.json({
            status: 1,
            message: "Partners fetched successfully",
            total_count: total,
            data: data
        });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

// UPDATE PARTNER
const updatePartner = async (req, res) => {
    try {
        const { id, name, rating, accreditation, description, status } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "ID is required" });

        const logo = req.file ? `/uploads/lab_partners/${req.file.filename}` : undefined;

        const data = await partnerModel.updatePartner(id, {
            name,
            logo,
            rating,
            accreditation,
            description,
            status
        });

        res.json({ status: 1, message: "Partner updated successfully", data: data });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

// DELETE PARTNER
const deletePartner = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "ID is required" });
        await partnerModel.deletePartner(id);
        res.json({ status: 1, message: "Partner(s) deleted successfully" });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

module.exports = {
    addPartner,
    getPartners,
    updatePartner,
    deletePartner
};
