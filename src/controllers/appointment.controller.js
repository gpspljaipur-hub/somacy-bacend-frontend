const appointmentModel = require("../models/appointment.model");
const doctorScheduleModel = require("../models/doctor_schedule.model");

// Helper to check if a time is within range
const isTimeBetween = (checkTime, startTime, endTime) => {
    // Assuming formats like "09:00 AM" or "14:00"
    // Normalize to comparable numbers or Date objects
    const parseTime = (t) => {
        const [time, modifier] = t.split(' ');
        let [hours, minutes] = time.split(':');
        if (modifier === 'PM' && hours !== '12') hours = parseInt(hours, 10) + 12;
        if (modifier === 'AM' && hours === '12') hours = '00';
        return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    };

    const target = parseTime(checkTime);
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    return target >= start && target < end; // Assuming appointment is at the start of a slot
};

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

        // 1. Get Day of the Week for the requested date
        const dateObj = new Date(appointment_date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        // 2. Fetch doctor's schedule for that day
        const schedules = await doctorScheduleModel.getScheduleByDay(doctor_id, dayOfWeek);

        if (!schedules || schedules.length === 0) {
            return res.status(400).json({ status: 0, message: `Doctor is not available on ${dayOfWeek}s` });
        }

        // 3. Check if requested time is within any of the doctor's available slots
        const isAvailable = schedules.some(slot => 
            isTimeBetween(appointment_time, slot.start_time, slot.end_time)
        );

        if (!isAvailable) {
            return res.status(400).json({ status: 0, message: "Doctor is not available at the selected time" });
        }

        // 4. (Optional but good) Check if slot is already booked for this doctor-date-time
        // We'll proceed to book for now as requested for the redesign.

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
