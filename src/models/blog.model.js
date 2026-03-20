const prisma = require("../config/prisma");

// ADD BLOG
const addBlog = async ({ title, description, content, image, category, status }) => {
    return await prisma.blogs.create({
        data: {
            title,
            description: description || null,
            content: content || null,
            image: image || null,
            category: category || 'All',
            status: status !== undefined ? parseInt(status) : 2
        }
    });
};

// GET ALL BLOGS
const getAllBlogs = async (limit = 10, offset = 0, search = '', category = 'All') => {
    let where = {};
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
        ];
    }
    if (category && category !== 'All') {
        where.category = category;
    }

    return await prisma.blogs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// COUNT BLOGS
const countBlogs = async (search = '', category = 'All') => {
    let where = {};
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
        ];
    }
    if (category && category !== 'All') {
        where.category = category;
    }

    return await prisma.blogs.count({ where });
};

// GET BLOG BY ID
const getBlogById = async (id) => {
    return await prisma.blogs.findUnique({
        where: { id: parseInt(id) }
    });
};

// GET RECENT BLOGS
const getRecentBlogs = async (limit = 5, excludeId = null) => {
    let where = {};
    if (excludeId) {
        where.id = { not: parseInt(excludeId) };
    }

    return await prisma.blogs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: parseInt(limit)
    });
};

// UPDATE BLOG
const updateBlog = async (id, data) => {
    return await prisma.blogs.update({
        where: { id: parseInt(id) },
        data: {
            title: data.title,
            description: data.description,
            content: data.content,
            image: data.image,
            category: data.category,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

// DELETE BLOG
const deleteBlog = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.blogs.deleteMany({
        where: { id: { in: ids } }
    });
};

module.exports = {
    addBlog,
    getAllBlogs,
    countBlogs,
    getBlogById,
    getRecentBlogs,
    updateBlog,
    deleteBlog,
};
