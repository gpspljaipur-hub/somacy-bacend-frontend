const prisma = require("../config/prisma");

// ADD SCHEDULE (Single or Bulk)
const addSchedule = async (data) => {
    if (Array.isArray(data)) {
        return await prisma.lab_test_schedules.createMany({
            data: data.map(item => ({
                lab_test_id: parseInt(item.lab_test_id),
                day_of_week: item.day_of_week,
                start_time: item.start_time,
                end_time: item.end_time,
                status: item.status !== undefined ? parseInt(item.status) : 1
            }))
        });
    } else {
        return await prisma.lab_test_schedules.create({
            data: {
                lab_test_id: parseInt(data.lab_test_id),
                day_of_week: data.day_of_week,
                start_time: data.start_time,
                end_time: data.end_time,
                status: data.status !== undefined ? parseInt(data.status) : 1
            }
        });
    }
};

// GET SCHEDULE BY LAB TEST
const getScheduleByLabTest = async (lab_test_id) => {
    return await prisma.lab_test_schedules.findMany({
        where: { 
            lab_test_id: parseInt(lab_test_id),
            status: 1 
        },
        orderBy: { id: 'asc' }
    });
};

// GET SCHEDULE BY DAY
const getScheduleByDay = async (lab_test_id, day) => {
    return await prisma.lab_test_schedules.findMany({
        where: { 
            lab_test_id: parseInt(lab_test_id),
            day_of_week: day,
            status: 1 
        },
        orderBy: { start_time: 'asc' }
    });
};

// UPDATE SCHEDULE
const updateSchedule = async (id, data) => {
    return await prisma.lab_test_schedules.update({
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
    return await prisma.lab_test_schedules.deleteMany({
        where: { id: { in: ids } }
    });
};

module.exports = {
    addSchedule,
    getScheduleByLabTest,
    getScheduleByDay,
    updateSchedule,
    deleteSchedule
};
