const prisma = require("../config/prisma");

// BOOK APPOINTMENT
const bookAppointment = async (data) => {
    return await prisma.appointments.create({
        data: {
            doctor_id: parseInt(data.doctor_id),
            user_id: data.user_id ? parseInt(data.user_id) : null,
            patient_name: data.patient_name,
            patient_id: data.patient_id ? parseInt(data.patient_id) : null,
            consultation_mode: data.consultation_mode,
            appointment_date: data.appointment_date ? new Date(data.appointment_date) : null,
            appointment_time: data.appointment_time,
            fee: data.fee ? parseFloat(data.fee) : 0,
            total_payable: data.total_payable ? parseFloat(data.total_payable) : 0,
            rghs_benefit_applied: !!data.rghs_benefit_applied,
            status: data.status || 'scheduled'
        }
    });
};

// GET APPOINTMENTS BY USER
const getAppointmentsByUser = async (user_id, limit = 10, offset = 0) => {
    const appointments = await prisma.appointments.findMany({
        where: { user_id: parseInt(user_id) },
        include: {
            doctors: true
        },
        orderBy: [
            { appointment_date: 'desc' },
            { appointment_time: 'desc' }
        ],
        take: parseInt(limit),
        skip: parseInt(offset)
    });

    return appointments.map(a => ({
        ...a,
        doctor_name: a.doctors ? a.doctors.name : null,
        doctor_specialization: a.doctors ? a.doctors.specialization : null,
        doctor_image: a.doctors ? a.doctors.image : null
    }));
};

// COUNT APPOINTMENTS BY USER
const countAppointmentsByUser = async (user_id) => {
    return await prisma.appointments.count({
        where: { user_id: parseInt(user_id) }
    });
};

// UPDATE APPOINTMENT STATUS
const updateAppointmentStatus = async (id, status) => {
    return await prisma.appointments.update({
        where: { id: parseInt(id) },
        data: {
            status: status,
            updated_at: new Date()
        }
    });
};

// UPDATE APPOINTMENT (General)
const updateAppointment = async (id, data) => {
    return await prisma.appointments.update({
        where: { id: parseInt(id) },
        data: {
            patient_name: data.patient_name,
            patient_id: data.patient_id ? parseInt(data.patient_id) : undefined,
            consultation_mode: data.consultation_mode,
            appointment_date: data.appointment_date ? new Date(data.appointment_date) : undefined,
            appointment_time: data.appointment_time,
            status: data.status,
            updated_at: new Date()
        }
    });
};

// DELETE APPOINTMENT
const deleteAppointment = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.appointments.deleteMany({
        where: { id: { in: ids } }
    });
};

module.exports = {
    bookAppointment,
    getAppointmentsByUser,
    countAppointmentsByUser,
    updateAppointmentStatus,
    updateAppointment,
    deleteAppointment
};
