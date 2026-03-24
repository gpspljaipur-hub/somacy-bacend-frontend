const prisma = require("../config/prisma");

// ADD SCHEDULE (Single or Bulk)
const addSchedule = async (data) => {
    if (Array.isArray(data)) {
        // Bulk create
        return await prisma.doctor_schedules.createMany({
            data: data.map(item => ({
                doctor_id: parseInt(item.doctor_id),
                day_of_week: item.day_of_week,
                start_time: item.start_time,
                end_time: item.end_time,
                status: item.status !== undefined ? parseInt(item.status) : 1
            }))
        });
    } else {
        // Single create
        return await prisma.doctor_schedules.create({
            data: {
                doctor_id: parseInt(data.doctor_id),
                day_of_week: data.day_of_week,
                start_time: data.start_time,
                end_time: data.end_time,
                status: data.status !== undefined ? parseInt(data.status) : 1
            }
        });
    }
};

// GET SCHEDULE BY DOCTOR
const getScheduleByDoctor = async (doctor_id) => {
    return await prisma.doctor_schedules.findMany({
        where: { 
            doctor_id: parseInt(doctor_id),
            status: 1 
        },
        orderBy: { id: 'asc' }
    });
};

// UPDATE SCHEDULE
const updateSchedule = async (id, data) => {
    return await prisma.doctor_schedules.update({
        where: { id: parseInt(id) },
        data: {
            day_of_week: data.day_of_week !== undefined ? data.day_of_week : undefined,
            start_time: data.start_time !== undefined ? data.start_time : undefined,
            end_time: data.end_time !== undefined ? data.end_time : undefined,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

// DELETE SCHEDULE
const deleteSchedule = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    return await prisma.doctor_schedules.deleteMany({
        where: { id: { in: ids } }
    });
};

// GET SCHEDULE BY DOCTOR AND DAY
const getScheduleByDay = async (doctor_id, day) => {
    return await prisma.doctor_schedules.findMany({
        where: { 
            doctor_id: parseInt(doctor_id),
            day_of_week: day,
            status: 1 
        },
        orderBy: { start_time: 'asc' }
    });
};

module.exports = {
    addSchedule,
    getScheduleByDoctor,
    getScheduleByDay,
    updateSchedule,
    deleteSchedule
};
