const prisma = require("../config/prisma");

// ADD LAB PARTNER
const addPartner = async (data) => {
    return await prisma.lab_partners.create({
        data: {
            name: data.name,
            logo: data.logo || null,
            rating: data.rating ? parseFloat(data.rating) : 0,
            accreditation: data.accreditation || null,
            description: data.description || null,
            status: data.status !== undefined ? parseInt(data.status) : 1
        }
    });
};

// GET PARTNERS
const getPartners = async (limit = 20, offset = 0, search = '') => {
    let where = {};
    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    return await prisma.lab_partners.findMany({
        where,
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// COUNT PARTNERS
const countPartners = async (search = '') => {
    let where = {};
    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }
    return await prisma.lab_partners.count({ where });
};

// UPDATE PARTNER
const updatePartner = async (id, data) => {
    return await prisma.lab_partners.update({
        where: { id: parseInt(id) },
        data: {
            name: data.name,
            logo: data.logo,
            rating: data.rating ? parseFloat(data.rating) : undefined,
            accreditation: data.accreditation,
            description: data.description,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

// DELETE PARTNER
const deletePartner = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    return await prisma.lab_partners.deleteMany({
        where: { id: { in: ids } }
    });
};

module.exports = {
    addPartner,
    getPartners,
    countPartners,
    updatePartner,
    deletePartner
};
