const bookingModel = require("../models/lab_test_appointment.model");
const scheduleModel = require("../models/lab_test_schedule.model");

// Helper to check if a time is within range
const isTimeBetween = (checkTime, startTime, endTime) => {
    const parseTime = (t) => {
        const [time, modifier] = (t || '').split(' ');
        if (!time) return 0;
        let [hours, minutes] = time.split(':');
        if (modifier === 'PM' && hours !== '12') hours = parseInt(hours, 10) + 12;
        if (modifier === 'AM' && hours === '12') hours = '00';
        return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    };
    const target = parseTime(checkTime);
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    return target >= start && target < end;
};

// BOOK APPOINTMENT
const bookLabTest = async (req, res) => {
    try {
        const {
            lab_test_id, user_id, patient_name, mobile, 
            appointment_date, appointment_time, home_collection, 
            address, total_amount, status
        } = req.body;

        if (!lab_test_id || !patient_name || !appointment_date || !appointment_time) {
            return res.status(400).json({ status: 0, message: "Missing required fields" });
        }

        // 1. Get Day of Week
        const dateObj = new Date(appointment_date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

        // 2. Fetch schedules
        const schedules = await scheduleModel.getScheduleByDay(lab_test_id, dayOfWeek);
        if (!schedules || schedules.length === 0) {
            return res.status(400).json({ status: 0, message: `No slots available on ${dayOfWeek}s` });
        }

        // 3. Time Validation
        const isAvailable = schedules.some(slot => 
            isTimeBetween(appointment_time, slot.start_time, slot.end_time)
        );
        if (!isAvailable) {
            return res.status(400).json({ status: 0, message: "Selected time is outside lab working hours for this test" });
        }

        // 4. Booking
        const data = await bookingModel.bookLabTest({
            lab_test_id, user_id, patient_name, mobile, 
            appointment_date, appointment_time, home_collection, 
            address, total_amount, status
        });

        res.status(201).json({ status: 1, message: "Lab test booked successfully", data: data });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

// GET USER LAB APPOINTMENTS
const getUserLabAppointments = async (req, res) => {
    try {
        const { user_id, page = 1, limit = 10 } = req.body;
        if (!user_id) return res.status(400).json({ status: 0, message: "User ID is required" });

        const offset = (Number(page) - 1) * Number(limit);
        const data = await bookingModel.getLabAppointmentsByUser(user_id, Number(limit), offset);
        res.json({ status: 1, message: "Lab appointments fetched successfully", data: data });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

// UPDATE STATUS
const updateStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        if (!id || !status) return res.status(400).json({ status: 0, message: "ID and status required" });
        const updated = await bookingModel.updateStatus(id, status);
        res.json({ status: 1, message: "Status updated successfully", data: updated });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

// DELETE
const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "ID(s) required" });
        await bookingModel.deleteAppointment(id);
        res.json({ status: 1, message: "Appointment(s) deleted successfully" });
    } catch (err) { res.status(500).json({ status: 0, message: err.message }); }
};

module.exports = {
    bookLabTest,
    getUserLabAppointments,
    updateStatus,
    deleteAppointment
};
