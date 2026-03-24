const scheduleModel = require("../models/lab_test_schedule.model");
const appointmentModel = require("../models/lab_test_appointment.model");
const { safeParseArray } = require("../utils/safeParser");

// ADD SCHEDULE (Single or Bulk)
const addSchedule = async (req, res) => {
    try {
        const { schedules } = req.body;
        // Use safeParseArray to handle string or array inputs
        const dataToProcess = schedules ? safeParseArray(schedules) : safeParseArray(req.body);

        const data = await scheduleModel.addSchedule(dataToProcess);
        res.status(201).json({ status: 1, message: "Lab test schedule added successfully", data: data });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

// GET SCHEDULE
const getSchedule = async (req, res) => {
    try {
        const { lab_test_id } = req.body;
        if (!lab_test_id) return res.status(400).json({ status: 0, message: "Lab test ID required" });
        const data = await scheduleModel.getScheduleByLabTest(lab_test_id);
        res.json({ status: 1, message: "Schedule fetched successfully", data: data });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

// UPDATE SCHEDULE
const updateSchedule = async (req, res) => {
    try {
        const { id, day_of_week, start_time, end_time, status } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Schedule ID is required" });
        const data = await scheduleModel.updateSchedule(id, { day_of_week, start_time, end_time, status });
        res.json({ status: 1, message: "Schedule updated successfully", data: data });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

// DELETE SCHEDULE
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "ID(s) required" });
        await scheduleModel.deleteSchedule(id);
        res.json({ status: 1, message: "Schedule(s) deleted successfully" });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

// GET LAB TEST AVAILABILITY (Schedule + Bookings)
const getLabTestAvailability = async (req, res) => {
    try {
        const { lab_test_id, date } = req.body;
        if (!lab_test_id || !date) return res.status(400).json({ status: 0, message: "Lab test ID and date required" });

        const dateObj = new Date(date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        const schedules = await scheduleModel.getScheduleByDay(lab_test_id, dayOfWeek);
        const bookings = await appointmentModel.getAppointmentsByTestAndDate(lab_test_id, date);

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
                    status: b.status,
                    home_collection: b.home_collection
                }))
            }
        });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

module.exports = {
    addSchedule,
    getSchedule,
    updateSchedule,
    deleteSchedule,
    getLabTestAvailability
};
