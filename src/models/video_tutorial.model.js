const prisma = require("../config/prisma");

// ADD VIDEO TUTORIAL
const addTutorial = async (data) => {
    return await prisma.video_tutorials.create({
        data: {
            title: data.title,
            subtitle: data.subtitle || null,
            thumbnail: data.thumbnail || null,
            video_link: data.video_link,
            duration: data.duration || null,
            status: data.status !== undefined ? parseInt(data.status) : 1
        }
    });
};

// GET ALL TUTORIALS
const getAllTutorials = async (limit = 20, offset = 0, status = null) => {
    return await prisma.video_tutorials.findMany({
        where: status !== null ? { status: parseInt(status) } : {},
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// COUNT TUTORIALS
const countTutorials = async (status = null) => {
    return await prisma.video_tutorials.count({
        where: status !== null ? { status: parseInt(status) } : {}
    });
};

// UPDATE TUTORIAL
const updateTutorial = async (id, data) => {
    return await prisma.video_tutorials.update({
        where: { id: parseInt(id) },
        data: {
            ...data,
            updated_at: new Date()
        }
    });
};

// DELETE TUTORIAL
const deleteTutorial = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    return await prisma.video_tutorials.deleteMany({
        where: { id: { in: ids } }
    });
};

module.exports = {
    addTutorial,
    getAllTutorials,
    countTutorials,
    updateTutorial,
    deleteTutorial
};
