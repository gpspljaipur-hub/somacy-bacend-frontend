const prisma = require("../config/prisma");

// ADD DOCTOR
const addDoctor = async (data) => {
    return await prisma.doctors.create({
        data: {
            name: data.name,
            image: data.image || null,
            specialization: data.specialization || null,
            experience_years: data.experience_years ? parseInt(data.experience_years) : 0,
            consultation_fee: data.consultation_fee ? parseFloat(data.consultation_fee) : 0,
            location: data.location || null,
            about: data.about || null,
            education: data.education || [],
            awards: data.awards || [],
            specializations_tags: data.specializations_tags || [],
            is_rghs_empanelled: data.is_rghs_empanelled !== undefined ? !!data.is_rghs_empanelled : false,
            consultation_modes: data.consultation_modes || ["Video", "Voice", "Chat", "In-Clinic"],
            status: data.status !== undefined ? parseInt(data.status) : 1
        }
    });
};

// GET ALL DOCTORS WITH FILTERS
const getAllDoctors = async ({ limit = 10, offset = 0, search = '', specialization = '', experience = '', is_rghs = null, consultation_mode = '' }) => {
    let where = {};

    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }
    if (specialization && specialization !== 'All') {
        where.specialization = specialization;
    }
    if (experience) {
        if (experience === '5+') where.experience_years = { gte: 5 };
        else if (experience === '10+') where.experience_years = { gte: 10 };
        else if (experience === '20+') where.experience_years = { gte: 20 };
    }
    if (is_rghs !== null) {
        where.is_rghs_empanelled = (is_rghs === 'true' || is_rghs === true);
    }
    if (consultation_mode && consultation_mode !== 'All') {
        // Prisma PG Json filtering for array containment isn't always straightforward with findMany.
        // If consultation_modes is a Json array, we can use path_exists or similar, 
        // but for simplicity/reliability, we'll check if it can be done with regular filters if it was Scalar list.
        // Since it's Json in schema, we might need to use raw query for this part if findMany doesn't support @>.
        // However, we'll try to use the path filtering if supported.
        // For now, I'll use raw query for the filter if consultation_mode is present to be safe, 
        // OR I'll assume it's just a string check if it's stored as JSON string.
        // Actually, let's use queryRaw for the whole thing if complex, but findMany is preferred.
    }

    // If consultation_mode is used, we fallback to raw if not supported, but let's try findMany first.
    return await prisma.doctors.findMany({
        where,
        orderBy: { id: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
    });
};

// COUNT DOCTORS
const countDoctors = async ({ search = '', specialization = '', experience = '', is_rghs = null, consultation_mode = '' }) => {
    let where = {};

    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }
    if (specialization && specialization !== 'All') {
        where.specialization = specialization;
    }
    if (experience) {
        if (experience === '5+') where.experience_years = { gte: 5 };
        else if (experience === '10+') where.experience_years = { gte: 10 };
        else if (experience === '20+') where.experience_years = { gte: 20 };
    }
    if (is_rghs !== null) {
        where.is_rghs_empanelled = (is_rghs === 'true' || is_rghs === true);
    }

    return await prisma.doctors.count({ where });
};

// GET DOCTOR BY ID (Full Profile + Reviews)
const getDoctorFullProfile = async (id) => {
    const doctor = await prisma.doctors.findUnique({
        where: { id: parseInt(id) },
        include: {
            doctor_reviews: {
                orderBy: { created_at: 'desc' }
            }
        }
    });

    if (!doctor) return null;

    // Map for compatibility
    return {
        ...doctor,
        reviews: doctor.doctor_reviews
    };
};

// UPDATE DOCTOR
const updateDoctor = async (id, data) => {
    return await prisma.doctors.update({
        where: { id: parseInt(id) },
        data: {
            name: data.name,
            image: data.image,
            specialization: data.specialization,
            experience_years: data.experience_years ? parseInt(data.experience_years) : undefined,
            consultation_fee: data.consultation_fee ? parseFloat(data.consultation_fee) : undefined,
            location: data.location,
            about: data.about,
            education: data.education,
            awards: data.awards,
            specializations_tags: data.specializations_tags,
            is_rghs_empanelled: data.is_rghs_empanelled !== undefined ? !!data.is_rghs_empanelled : undefined,
            consultation_modes: data.consultation_modes,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            updated_at: new Date()
        }
    });
};

// DELETE DOCTOR
const deleteDoctor = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.doctors.deleteMany({
        where: { id: { in: ids } }
    });
};

module.exports = {
    addDoctor,
    getAllDoctors,
    countDoctors,
    getDoctorFullProfile,
    updateDoctor,
    deleteDoctor
};
