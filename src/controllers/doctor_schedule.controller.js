const scheduleModel = require("../models/doctor_schedule.model");
const appointmentModel = require("../models/appointment.model");
const { safeParseArray } = require("../utils/safeParser");

// ADD SCHEDULE (Single or Bulk)
const addSchedule = async (req, res) => {
    try {
        const { schedules } = req.body;
        // Use safeParseArray to handle string or array inputs
        const dataToProcess = schedules ? safeParseArray(schedules) : safeParseArray(req.body);

        const data = await scheduleModel.addSchedule(dataToProcess);

        res.status(201).json({
            status: 1,
            message: "Doctor schedule added successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET SCHEDULE
const getSchedule = async (req, res) => {
    try {
        const { doctor_id } = req.body;
        if (!doctor_id) return res.status(400).json({ status: 0, message: "Doctor ID is required" });

        const data = await scheduleModel.getScheduleByDoctor(doctor_id);

        res.json({
            status: 1,
            message: "Schedule fetched successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE SCHEDULE
const updateSchedule = async (req, res) => {
    try {
        const { id, day_of_week, start_time, end_time, status } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Schedule ID is required" });

        const data = await scheduleModel.updateSchedule(id, {
            day_of_week,
            start_time,
            end_time,
            status: status !== undefined ? Number(status) : undefined
        });

        res.json({
            status: 1,
            message: "Schedule updated successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE SCHEDULE
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "ID(s) required" });

        await scheduleModel.deleteSchedule(id);
        res.json({
            status: 1,
            message: "Schedule(s) deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET DOCTOR AVAILABILITY (Schedule + Bookings)
const getDoctorAvailability = async (req, res) => {
    try {
        const { doctor_id, date } = req.body; 
        if (!doctor_id || !date) return res.status(400).json({ status: 0, message: "Doctor ID and date required" });

        const dateObj = new Date(date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        const schedules = await scheduleModel.getScheduleByDay(doctor_id, dayOfWeek);
        const bookings = await appointmentModel.getAppointmentsByDoctorAndDate(doctor_id, date);

        res.json({
            status: 1,
            message: "Availability details fetched successfully",
            data: {
                day: dayOfWeek,
                date: date,
                schedules: schedules,
                bookings: bookings.map(b => ({
                    appointment_id: b.id,
                    appointment_time: b.appointment_time,
                    status: b.status
                }))
            }
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    addSchedule,
    getSchedule,
    updateSchedule,
    deleteSchedule,
    getDoctorAvailability
};
