const prisma = require("../config/prisma");

// ADD MEDICINE
const addMedicine = async (data) => {
    return await prisma.medicines.create({
        data: {
            medicine_name: data.medicine_name || null,
            medicine_images: data.medicine_images || [],
            category_id: data.category_id || null,
            brand_id: data.brand_id || null,
            medicine_description: data.medicine_description || null,
            medicine_type: data.medicine_type || null,
            price: data.price ? parseFloat(data.price) : 0,
            medicine_discount: data.medicine_discount ? parseFloat(data.medicine_discount) : 0,
            rghs_discount: data.rghs_discount ? parseFloat(data.rghs_discount) : 0,
            stock_status: data.stock_status || 'In Stock',
            stock_quantity: data.stock_quantity ? parseInt(data.stock_quantity) : 0,
            prescription_required: data.prescription_required !== undefined ? !!data.prescription_required : false,
            status: data.status !== undefined ? parseInt(data.status) : 1,
            pack_type: data.pack_type || null,
            medicine_rghs: data.medicine_rghs !== undefined ? !!data.medicine_rghs : false,
            // Extra details
            salt_composition: data.salt_composition || null,
            manufacturer: data.manufacturer || null,
            packaging: data.packaging || null,
            what_it_is_used_for: data.what_it_is_used_for || null,
            how_it_works: data.how_it_works || null,
            safety_advice: data.safety_advice || null,
            expert_advice: data.expert_advice || []
        }
    });
};

// GET ALL MEDICINES
const getAllMedicines = async (limit = 20, offset = 0, search = '') => {
    const medicines = await prisma.medicines.findMany({
        where: search ? {
            medicine_name: {
                contains: search,
                mode: 'insensitive'
            }
        } : {},
        include: {
            categories: true,
            brands: true
        },
        orderBy: {
            id: 'desc'
        },
        take: parseInt(limit),
        skip: parseInt(offset)
    });

    return medicines.map(m => ({
        ...m,
        category_name: m.categories ? m.categories.category_name : null,
        brand_name: m.brands ? m.brands.brand_name : null
    }));
};

// COUNT MEDICINES
const countMedicines = async (search = '') => {
    return await prisma.medicines.count({
        where: search ? {
            medicine_name: {
                contains: search,
                mode: 'insensitive'
            }
        } : {}
    });
};

// GET MEDICINE BY ID
const getMedicineById = async (id) => {
    const m = await prisma.medicines.findUnique({
        where: { id: parseInt(id) },
        include: {
            categories: true,
            brands: true
        }
    });

    if (!m) return null;

    // Fetch alternatives based on same salt composition
    let alternatives = [];
    if (m.salt_composition) {
        alternatives = await prisma.medicines.findMany({
            where: {
                salt_composition: {
                  contains: m.salt_composition, // case insensitive partial match if needed or keep it exact
                  mode: 'insensitive'
                },
                NOT: { id: m.id },
                status: 1
            },
            take: 10,
            include: {
                categories: true,
                brands: true
            }
        });
        alternatives = alternatives.map(alt => ({
            ...alt,
            category_name: alt.categories ? alt.categories.category_name : null,
            brand_name: alt.brands ? alt.brands.brand_name : null
        }));
    }

    return {
        ...m,
        category_name: m.categories ? m.categories.category_name : null,
        brand_name: m.brands ? m.brands.brand_name : null,
        generic_alternatives: alternatives
    };
};

// UPDATE MEDICINE
const updateMedicine = async (id, data) => {
    return await prisma.medicines.update({
        where: { id: parseInt(id) },
        data: {
            medicine_name: data.medicine_name,
            medicine_images: data.medicine_images,
            category_id: data.category_id,
            brand_id: data.brand_id,
            medicine_description: data.medicine_description,
            medicine_type: data.medicine_type,
            price: data.price ? parseFloat(data.price) : undefined,
            medicine_discount: data.medicine_discount ? parseFloat(data.medicine_discount) : undefined,
            rghs_discount: data.rghs_discount ? parseFloat(data.rghs_discount) : undefined,
            stock_status: data.stock_status,
            stock_quantity: data.stock_quantity ? parseInt(data.stock_quantity) : undefined,
            prescription_required: data.prescription_required !== undefined ? !!data.prescription_required : undefined,
            status: data.status !== undefined ? parseInt(data.status) : undefined,
            pack_type: data.pack_type,
            medicine_rghs: data.medicine_rghs !== undefined ? !!data.medicine_rghs : undefined,
            // Extra details
            salt_composition: data.salt_composition,
            manufacturer: data.manufacturer,
            packaging: data.packaging,
            what_it_is_used_for: data.what_it_is_used_for,
            how_it_works: data.how_it_works,
            safety_advice: data.safety_advice,
            expert_advice: data.expert_advice,
            updated_at: new Date()
        }
    });
};

// DELETE MEDICINE (Supports bulk)
const deleteMedicine = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.medicines.deleteMany({
        where: { id: { in: ids } }
    });
};

// GET ALL MEDICINES FOR EXPORT
const getExportData = async () => {
    const medicines = await prisma.medicines.findMany({
        include: {
            categories: true,
            brands: true
        },
        orderBy: {
            id: 'desc'
        }
    });

    return medicines.map(m => ({
        id: m.id,
        medicine_name: m.medicine_name,
        salt_composition: m.salt_composition,
        manufacturer: m.manufacturer,
        packaging: m.packaging,
        medicine_images: Array.isArray(m.medicine_images) ? m.medicine_images.join(', ') : '',
        category_name: m.categories ? m.categories.category_name : null,
        brand_name: m.brands ? m.brands.brand_name : null,
        medicine_type: m.medicine_type,
        price: m.price,
        medicine_discount: m.medicine_discount,
        rghs_discount: m.rghs_discount,
        stock_status: m.stock_status,
        stock_quantity: m.stock_quantity,
        prescription_required: m.prescription_required,
        status: m.status,
        pack_type: m.pack_type,
        medicine_rghs: m.medicine_rghs ? 'Yes' : 'No',
        created_at: m.created_at
    }));
};

module.exports = {
    addMedicine,
    getAllMedicines,
    countMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
    getExportData
};
