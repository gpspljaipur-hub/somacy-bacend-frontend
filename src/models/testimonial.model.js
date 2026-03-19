const prisma = require("../config/prisma");

// GET ALL TESTIMONIALS
const getAllTestimonials = async (limit = 20, offset = 0, search = '') => {
    return await prisma.testimonials.findMany({
        where: search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { designation: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ]
        } : {},
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// COUNT TESTIMONIALS
const countTestimonials = async (search = '') => {
    return await prisma.testimonials.count({
        where: search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { designation: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ]
        } : {}
    });
};

// GET TESTIMONIAL BY ID
const getTestimonialById = async (id) => {
    return await prisma.testimonials.findUnique({
        where: { id: parseInt(id) }
    });
};

// ADD TESTIMONIAL
const addTestimonial = async (data) => {
    return await prisma.testimonials.create({
        data: {
            name: data.name,
            designation: data.designation || '',
            content: data.content || '',
            image: data.image || null,
            status: data.status !== undefined ? parseInt(data.status) : 1
        }
    });
};

// DELETE TESTIMONIAL (Supports bulk)
const deleteTestimonial = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.testimonials.deleteMany({
        where: { id: { in: ids } }
    });
};

// UPDATE TESTIMONIAL
const updateTestimonial = async (id, data) => {
    return await prisma.testimonials.update({
        where: { id: parseInt(id) },
        data: {
            name: data.name,
            designation: data.designation,
            content: data.content,
            image: data.image,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

// GET ALL TESTIMONIALS FOR EXPORT
const getExportData = async () => {
    return await prisma.testimonials.findMany({
        orderBy: { id: 'desc' }
    });
};

module.exports = {
    getAllTestimonials,
    countTestimonials,
    getTestimonialById,
    addTestimonial,
    deleteTestimonial,
    updateTestimonial,
    getExportData
};
