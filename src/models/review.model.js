const pool = require("../config/db");

// ADD REVIEW
const addReview = async (data) => {
    const query = `
        INSERT INTO doctor_reviews (doctor_id, patient_name, rating, comment)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const values = [data.doctor_id, data.patient_name, data.rating || 5, data.comment];
    const { rows } = await pool.query(query, values);

    // Update doctor average rating and reviews count
    await pool.query(`
        UPDATE doctors 
        SET rating = (SELECT AVG(rating) FROM doctor_reviews WHERE doctor_id = $1),
            reviews_count = (SELECT COUNT(*) FROM doctor_reviews WHERE doctor_id = $1)
        WHERE id = $1
    `, [data.doctor_id]);

    return rows[0];
};

// DELETE REVIEW
const deleteReview = async (id) => {
    const { rows } = await pool.query("SELECT doctor_id FROM doctor_reviews WHERE id = $1", [id]);
    if (rows.length === 0) return;
    const doctor_id = rows[0].doctor_id;

    await pool.query("DELETE FROM doctor_reviews WHERE id = $1", [id]);

    // Update doctor average rating and reviews count
    await pool.query(`
        UPDATE doctors 
        SET rating = COALESCE((SELECT AVG(rating) FROM doctor_reviews WHERE doctor_id = $1), 0),
            reviews_count = (SELECT COUNT(*) FROM doctor_reviews WHERE doctor_id = $1)
        WHERE id = $1
    `, [doctor_id]);
};

module.exports = {
    addReview,
    deleteReview
};
