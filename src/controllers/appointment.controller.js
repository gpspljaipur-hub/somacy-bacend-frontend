const appointmentModel = require("../models/appointment.model");

// BOOK APPOINTMENT
const bookAppointment = async (req, res) => {
    try {
        const {
            doctor_id, user_id, patient_name, patient_id, 
            consultation_mode, appointment_date, appointment_time, 
            fee, total_payable, rghs_benefit_applied, status
        } = req.body;

        if (!doctor_id || !patient_name || !appointment_date || !appointment_time) {
            return res.status(400).json({ status: 0, message: "Missing required fields" });
        }

        const data = await appointmentModel.bookAppointment({
            doctor_id: Number(doctor_id),
            user_id: user_id ? Number(user_id) : null,
            patient_name,
            patient_id,
            consultation_mode,
            appointment_date,
            appointment_time,
            fee: Number(fee) || 0,
            total_payable: Number(total_payable) || 0,
            rghs_benefit_applied: rghs_benefit_applied === 'true' || rghs_benefit_applied === true,
            status: status || 'scheduled'
        });

        res.status(201).json({
            status: 1,
            message: "Appointment booked successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET USER APPOINTMENTS
const getUserAppointments = async (req, res) => {
    try {
        const { user_id, page = 1, limit = 10 } = req.body;
        if (!user_id) return res.status(400).json({ status: 0, message: "User ID is required" });

        const offset = (Number(page) - 1) * Number(limit);
        const data = await appointmentModel.getAppointmentsByUser(Number(user_id), Number(limit), offset);
        const total = await appointmentModel.countAppointmentsByUser(Number(user_id));

        res.json({
            status: 1,
            message: "Appointments fetched successfully",
            total_count: total,
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE APPOINTMENT STATUS
const updateStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        if (!id || !status) return res.status(400).json({ status: 0, message: "ID and status required" });

        const updated = await appointmentModel.updateAppointmentStatus(Number(id), status);
        res.json({
            status: 1,
            message: "Appointment status updated successfully",
            data: updated
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE APPOINTMENT (General)
const updateAppointment = async (req, res) => {
    try {
        const { id, patient_name, patient_id, consultation_mode, appointment_date, appointment_time, status } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Appointment ID is required" });

        const updated = await appointmentModel.updateAppointment(Number(id), {
            patient_name,
            patient_id,
            consultation_mode,
            appointment_date,
            appointment_time,
            status: status || 'scheduled'
        });

        res.json({
            status: 1,
            message: "Appointment updated successfully",
            data: updated
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE APPOINTMENT
const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "ID(s) required" });

        await appointmentModel.deleteAppointment(id);
        res.json({
            status: 1,
            message: "Appointment(s) deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    bookAppointment,
    getUserAppointments,
    updateStatus,
    updateAppointment,
    deleteAppointment
};
