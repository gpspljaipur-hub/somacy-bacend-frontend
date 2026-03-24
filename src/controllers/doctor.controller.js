const doctorModel = require("../models/doctor.model");
const { safeParseArray } = require("../utils/safeParser");

// ADD DOCTOR (Admin only usually)
const addDoctor = async (req, res) => {
    try {
        const { name, specialization, experience_years, consultation_fee, location, about, status } = req.body;
        const image = req.file ? `/uploads/doctors/${req.file.filename}` : null;

        const data = await doctorModel.addDoctor({
            name,
            image,
            specialization,
            experience_years: experience_years ? Number(experience_years) : 0,
            consultation_fee: consultation_fee ? Number(consultation_fee) : 100, // Default to 100 for doctors
            location,
            about,
            education: safeParseArray(req.body.education),
            awards: safeParseArray(req.body.awards),
            specializations_tags: safeParseArray(req.body.specializations_tags),
            is_rghs_empanelled: req.body.is_rghs_empanelled === 'true' || req.body.is_rghs_empanelled === true,
            consultation_modes: safeParseArray(req.body.consultation_modes, ["Video", "Voice", "Chat", "In-Clinic"]),
            status: status !== undefined ? Number(status) : 1
        });

        res.status(201).json({
            status: 1,
            message: "Doctor added successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET DOCTORS LIST (With Filters)
const getDoctors = async (req, res) => {
    try {
        const {
            page = 1, limit = 10, search = '', specialization = '',
            experience = '', is_rghs = null, consultation_mode = ''
        } = req.body;
        const offset = (Number(page) - 1) * Number(limit);

        const data = await doctorModel.getAllDoctors({
            limit: Number(limit),
            offset,
            search,
            specialization,
            experience,
            is_rghs,
            consultation_mode
        });
        const total = await doctorModel.countDoctors({ search, specialization, experience, is_rghs, consultation_mode });

        res.json({
            status: 1,
            message: "Doctors list fetched successfully",
            total_count: total,
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET DOCTOR DETAILS (Full Profile)
const getDoctorDetails = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Doctor ID is required" });

        const doctor = await doctorModel.getDoctorFullProfile(id);
        if (!doctor) return res.status(404).json({ status: 0, message: "Doctor not found" });

        res.json({
            status: 1,
            message: "Doctor details fetched successfully",
            data: doctor
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE DOCTOR
const updateDoctor = async (req, res) => {
    try {
        const { id, name, specialization, experience_years, consultation_fee, location, about, status } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Doctor ID is required" });

        const existing = await doctorModel.getDoctorFullProfile(id);
        if (!existing) return res.status(404).json({ status: 0, message: "Doctor not found" });

        let image = existing.image;
        if (req.file) {
            image = `/uploads/doctors/${req.file.filename}`;
        }

        const data = await doctorModel.updateDoctor(id, {
            name: name !== undefined ? name : existing.name,
            image,
            specialization: specialization !== undefined ? specialization : existing.specialization,
            experience_years: experience_years !== undefined ? Number(experience_years) : existing.experience_years,
            consultation_fee: consultation_fee !== undefined ? Number(consultation_fee) : existing.consultation_fee,
            location: location !== undefined ? location : existing.location,
            about: about !== undefined ? about : existing.about,
            education: req.body.education !== undefined ? safeParseArray(req.body.education) : existing.education,
            awards: req.body.awards !== undefined ? safeParseArray(req.body.awards) : existing.awards,
            specializations_tags: req.body.specializations_tags !== undefined ? safeParseArray(req.body.specializations_tags) : existing.specializations_tags,
            is_rghs_empanelled: req.body.is_rghs_empanelled !== undefined ? (req.body.is_rghs_empanelled === 'true' || req.body.is_rghs_empanelled === true) : existing.is_rghs_empanelled,
            consultation_modes: req.body.consultation_modes !== undefined ? safeParseArray(req.body.consultation_modes) : existing.consultation_modes,
            status: status !== undefined ? Number(status) : existing.status
        });

        res.json({
            status: 1,
            message: "Doctor updated successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE DOCTOR
const deleteDoctor = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "ID(s) required" });

        await doctorModel.deleteDoctor(id);
        res.json({
            status: 1,
            message: "Doctor(s) deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    addDoctor,
    getDoctors,
    getDoctorDetails,
    updateDoctor,
    deleteDoctor
};
