const pool = require("../config/db");

// BOOK APPOINTMENT
const bookAppointment = async (data) => {
    const query = `
        INSERT INTO appointments (
            doctor_id, user_id, patient_name, patient_id, 
            consultation_mode, appointment_date, appointment_time, 
            fee, total_payable, rghs_benefit_applied, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
    `;
    const values = [
        data.doctor_id,
        data.user_id || null,
        data.patient_name,
        data.patient_id || null, // Dependent ID etc.
        data.consultation_mode,
        data.appointment_date,
        data.appointment_time,
        data.fee || 0,
        data.total_payable || 0,
        data.rghs_benefit_applied || false,
        data.status || 'scheduled'
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET APPOINTMENTS BY USER
const getAppointmentsByUser = async (user_id, limit = 10, offset = 0) => {
    const query = `
        SELECT a.*, d.name as doctor_name, d.specialization as doctor_specialization, d.image as doctor_image
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE user_id = $1
        ORDER BY appointment_date DESC, appointment_time DESC
        LIMIT $2 OFFSET $3;
    `;
    const { rows } = await pool.query(query, [user_id, limit, offset]);
    return rows;
};

// COUNT APPOINTMENTS BY USER
const countAppointmentsByUser = async (user_id) => {
    const { rows } = await pool.query("SELECT COUNT(*) FROM appointments WHERE user_id = $1", [user_id]);
    return parseInt(rows[0].count);
};

// UPDATE APPOINTMENT STATUS
const updateAppointmentStatus = async (id, status) => {
    const { rows } = await pool.query("UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *", [status, id]);
    return rows[0];
};

// UPDATE APPOINTMENT (General)
const updateAppointment = async (id, data) => {
    const query = `
        UPDATE appointments
        SET patient_name = $1, 
            patient_id = $2, 
            consultation_mode = $3, 
            appointment_date = $4, 
            appointment_time = $5,
            status = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *;
    `;
    const values = [
        data.patient_name,
        data.patient_id,
        data.consultation_mode,
        data.appointment_date,
        data.appointment_time,
        data.status,
        id
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE APPOINTMENT
const deleteAppointment = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM appointments WHERE id = ANY($1::int[])", [ids.map(Number)]);
};

module.exports = {
    bookAppointment,
    getAppointmentsByUser,
    countAppointmentsByUser,
    updateAppointmentStatus,
    updateAppointment,
    deleteAppointment
};
