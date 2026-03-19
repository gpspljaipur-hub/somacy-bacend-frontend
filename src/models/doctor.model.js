const pool = require("../config/db");

// ADD DOCTOR
const addDoctor = async (data) => {
    const query = `
        INSERT INTO doctors (
            name, image, specialization, experience_years, consultation_fee, 
            location, about, education, awards, specializations_tags, 
            is_rghs_empanelled, consultation_modes, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
    `;
    const values = [
        data.name,
        data.image || null,
        data.specialization || null,
        data.experience_years ? Number(data.experience_years) : 0,
        data.consultation_fee ? Number(data.consultation_fee) : 0,
        data.location || null,
        data.about || null,
        data.education || [],
        data.awards || [],
        data.specializations_tags || [],
        data.is_rghs_empanelled !== undefined ? data.is_rghs_empanelled : false,
        data.consultation_modes ? JSON.stringify(data.consultation_modes) : JSON.stringify(["Video", "Voice", "Chat", "In-Clinic"]),
        data.status !== undefined ? Number(data.status) : 1
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// GET ALL DOCTORS WITH FILTERS
const getAllDoctors = async ({ limit = 10, offset = 0, search = '', specialization = '', experience = '', is_rghs = null, consultation_mode = '' }) => {
    let query = "SELECT * FROM doctors";
    const params = [];

    const whereClauses = [];
    if (search) {
        whereClauses.push(`name ILIKE $${params.length + 1}`);
        params.push(`%${search}%`);
    }
    if (specialization && specialization !== 'All') {
        whereClauses.push(`specialization = $${params.length + 1}`);
        params.push(specialization);
    }
    if (experience) {
        if (experience === '5+') whereClauses.push("experience_years >= 5");
        else if (experience === '10+') whereClauses.push("experience_years >= 10");
        else if (experience === '20+') whereClauses.push("experience_years >= 20");
    }
    if (is_rghs !== null) {
        whereClauses.push(`is_rghs_empanelled = $${params.length + 1}`);
        params.push(is_rghs === 'true' || is_rghs === true);
    }
    if (consultation_mode && consultation_mode !== 'All') {
        whereClauses.push(`consultation_modes @> $${params.length + 1}`);
        params.push(JSON.stringify([consultation_mode]));
    }

    if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
    }

    query += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
};

// COUNT DOCTORS
const countDoctors = async ({ search = '', specialization = '', experience = '', is_rghs = null, consultation_mode = '' }) => {
    let query = "SELECT COUNT(*) FROM doctors";
    const params = [];

    const whereClauses = [];
    if (search) {
        whereClauses.push(`name ILIKE $${params.length + 1}`);
        params.push(`%${search}%`);
    }
    if (specialization && specialization !== 'All') {
        whereClauses.push(`specialization = $${params.length + 1}`);
        params.push(specialization);
    }
    if (experience) {
        if (experience === '5+') whereClauses.push("experience_years >= 5");
        else if (experience === '10+') whereClauses.push("experience_years >= 10");
        else if (experience === '20+') whereClauses.push("experience_years >= 20");
    }
    if (is_rghs !== null) {
        whereClauses.push(`is_rghs_empanelled = $${params.length + 1}`);
        params.push(is_rghs === 'true' || is_rghs === true);
    }
    if (consultation_mode && consultation_mode !== 'All') {
        whereClauses.push(`consultation_modes @> $${params.length + 1}`);
        params.push(JSON.stringify([consultation_mode]));
    }

    if (whereClauses.length > 0) {
        query += " WHERE " + whereClauses.join(" AND ");
    }

    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
};

// GET DOCTOR BY ID (Full Profile + Reviews)
const getDoctorFullProfile = async (id) => {
    const doctorRes = await pool.query("SELECT * FROM doctors WHERE id = $1", [id]);
    if (doctorRes.rows.length === 0) return null;

    const doctor = doctorRes.rows[0];
    const reviewsRes = await pool.query("SELECT * FROM doctor_reviews WHERE doctor_id = $1 ORDER BY created_at DESC", [id]);
    doctor.reviews = reviewsRes.rows;

    return doctor;
};

// UPDATE DOCTOR
const updateDoctor = async (id, data) => {
    const query = `
        UPDATE doctors
        SET name = $1, image = $2, specialization = $3, experience_years = $4, consultation_fee = $5,
            location = $6, about = $7, education = $8, awards = $9, specializations_tags = $10,
            is_rghs_empanelled = $11, consultation_modes = $12, status = $13,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
        RETURNING *;
    `;
    const values = [
        data.name, data.image, data.specialization, data.experience_years, data.consultation_fee,
        data.location, data.about, data.education, data.awards, data.specializations_tags,
        data.is_rghs_empanelled, JSON.stringify(data.consultation_modes), data.status,
        id
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

// DELETE DOCTOR
const deleteDoctor = async (id) => {
    const ids = Array.isArray(id) ? id : [id];
    await pool.query("DELETE FROM doctors WHERE id = ANY($1::int[])", [ids.map(Number)]);
};

module.exports = {
    addDoctor,
    getAllDoctors,
    countDoctors,
    getDoctorFullProfile,
    updateDoctor,
    deleteDoctor
};
