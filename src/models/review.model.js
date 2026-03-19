const prisma = require("../config/prisma");

// ADD REVIEW
const addReview = async (data) => {
    return await prisma.$transaction(async (tx) => {
        const review = await tx.doctor_reviews.create({
            data: {
                doctor_id: parseInt(data.doctor_id),
                patient_name: data.patient_name,
                rating: data.rating || 5,
                comment: data.comment
            }
        });

        // Update doctor average rating and reviews count
        const stats = await tx.doctor_reviews.aggregate({
            where: { doctor_id: parseInt(data.doctor_id) },
            _avg: { rating: true },
            _count: { id: true }
        });

        await tx.doctors.update({
            where: { id: parseInt(data.doctor_id) },
            data: {
                rating: stats._avg.rating || 0,
                reviews_count: stats._count.id || 0
            }
        });

        return review;
    });
};

// DELETE REVIEW
const deleteReview = async (id) => {
    return await prisma.$transaction(async (tx) => {
        const review = await tx.doctor_reviews.findUnique({
            where: { id: parseInt(id) }
        });
        if (!review) return;

        await tx.doctor_reviews.delete({
            where: { id: parseInt(id) }
        });

        // Update doctor average rating and reviews count
        const stats = await tx.doctor_reviews.aggregate({
            where: { doctor_id: review.doctor_id },
            _avg: { rating: true },
            _count: { id: true }
        });

        await tx.doctors.update({
            where: { id: review.doctor_id },
            data: {
                rating: stats._avg.rating || 0,
                reviews_count: stats._count.id || 0
            }
        });
    });
};

module.exports = {
    addReview,
    deleteReview
};
