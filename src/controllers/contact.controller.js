const contactModel = require("../models/contact.model");
const prisma = require("../config/prisma");

// SUBMIT CONTACT FORM
const submitContactForm = async (req, res) => {
    try {
        const { full_name, contact_number, email_address, message } = req.body;
        if (!full_name || !email_address) return res.status(400).json({ status: 0, message: "Name and email are required" });

        const submission = await contactModel.addSubmission({
            full_name,
            contact_number,
            email_address,
            message
        });

        res.status(201).json({ status: 1, message: "Contact form submitted successfully", data: submission });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET CONTACT FORM SUBMISSIONS
const getContactSubmissions = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const offset = (page - 1) * limit;

        const data = await contactModel.getSubmissions(limit, offset);
        const total = await contactModel.countSubmissions();

        res.json({ status: 1, message: "Submissions fetched successfully", total_count: total, data });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET CONTACT INFO (Left Panel)
const getContactInfo = async (req, res) => {
    try {
        const settings = await prisma.system_settings.findFirst();
        if (!settings) return res.status(404).json({ status: 0, message: "System settings not found" });

        res.json({
            status: 1,
            message: "Contact info fetched successfully",
            data: {
                store_name: settings.store_name,
                store_mobile: settings.store_mobile,
                store_email: settings.store_email,
                store_address: settings.store_address,
                contact_us: settings.contact_us
            }
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE CONTACT INFO
const updateContactInfo = async (req, res) => {
    try {
        const { store_mobile, store_email, store_address, contact_us } = req.body;
        
        const settings = await prisma.system_settings.findFirst();
        if (!settings) return res.status(404).json({ status: 0, message: "System settings not found" });

        const updated = await prisma.system_settings.update({
            where: { id: settings.id },
            data: {
                store_mobile: store_mobile !== undefined ? store_mobile : settings.store_mobile,
                store_email: store_email !== undefined ? store_email : settings.store_email,
                store_address: store_address !== undefined ? store_address : settings.store_address,
                contact_us: contact_us !== undefined ? contact_us : settings.contact_us,
                updated_at: new Date()
            }
        });

        res.json({ status: 1, message: "Contact info updated successfully", data: updated });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    submitContactForm,
    getContactSubmissions,
    getContactInfo,
    updateContactInfo
};
