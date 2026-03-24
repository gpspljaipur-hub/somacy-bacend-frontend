const prisma = require("../config/prisma");

// SUBMIT CONTACT FORM
const addSubmission = async (data) => {
    return await prisma.contact_submissions.create({
        data: {
            full_name: data.full_name,
            contact_number: data.contact_number,
            email_address: data.email_address,
            message: data.message
        }
    });
};

// GET SUBMISSIONS
const getSubmissions = async (limit = 20, offset = 0) => {
    return await prisma.contact_submissions.findMany({
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// COUNT SUBMISSIONS
const countSubmissions = async () => {
    return await prisma.contact_submissions.count();
};

module.exports = {
    addSubmission,
    getSubmissions,
    countSubmissions
};
