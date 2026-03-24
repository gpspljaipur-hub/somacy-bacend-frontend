const prisma = require("../config/prisma");

// BOOK LAB TEST
const bookLabTest = async (data) => {
    return await prisma.lab_test_appointments.create({
        data: {
            lab_test_id: parseInt(data.lab_test_id),
            user_id: data.user_id ? parseInt(data.user_id) : null,
            patient_name: data.patient_name,
            mobile: data.mobile,
            appointment_date: data.appointment_date ? new Date(data.appointment_date) : null,
            appointment_time: data.appointment_time,
            home_collection: !!data.home_collection,
            address: data.address || null,
            total_amount: data.total_amount ? parseFloat(data.total_amount) : 0,
            status: data.status || 'pending'
        }
    });
};

// GET APPOINTMENTS BY TEST AND DATE
const getAppointmentsByTestAndDate = async (lab_test_id, date) => {
    return await prisma.lab_test_appointments.findMany({
        where: { 
            lab_test_id: parseInt(lab_test_id),
            appointment_date: new Date(date),
            status: { notIn: ['cancelled', 'rejected'] }
        },
        orderBy: { appointment_time: 'asc' }
    });
};

// GET USER LAB APPOINTMENTS
const getLabAppointmentsByUser = async (user_id, limit = 10, offset = 0) => {
    return await prisma.lab_test_appointments.findMany({
        where: { user_id: parseInt(user_id) },
        include: {
            lab_tests: true
        },
        orderBy: { appointment_date: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// UPDATE STATUS
const updateStatus = async (id, status) => {
    return await prisma.lab_test_appointments.update({
        where: { id: parseInt(id) },
        data: { status, updated_at: new Date() }
    });
};

// DELETE
const deleteAppointment = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.lab_test_appointments.deleteMany({
        where: { id: { in: ids } }
    });
};

module.exports = {
    bookLabTest,
    getAppointmentsByTestAndDate,
    getLabAppointmentsByUser,
    updateStatus,
    deleteAppointment
};
