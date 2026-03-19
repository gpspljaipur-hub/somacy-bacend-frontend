const prisma = require("../config/prisma");

const findByEmail = async (email) => {
    return await prisma.admins.findUnique({
        where: { email }
    });
};

const findByMobileOrEmail = async (identifier) => {
    return await prisma.admins.findFirst({
        where: {
            OR: [
                { email: identifier },
                { mobile: identifier }
            ]
        }
    });
};

const getAdminById = async (id) => {
    return await prisma.admins.findUnique({
        where: { id: parseInt(id) }
    });
};

const createAdmin = async (data) => {
    return await prisma.admins.create({
        data: {
            name: data.name || null,
            email: data.email || null,
            password: data.password || null,
            mobile: data.mobile || null,
            role: data.role || 'Admin',
            store_name: data.store_name || null,
            store_address: data.store_address || null,
            city: data.city || null,
            state: data.state || null,
            pincode: data.pincode || null,
            drug_license_no: data.drug_license_no || null,
            gst_no: data.gst_no || null
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });
};

const updateOTP = async (email, otp, expiry) => {
    return await prisma.admins.update({
        where: { email },
        data: {
            otp,
            otp_expiry: expiry
        }
    });
};

const resetPassword = async (email, newHashedPassword) => {
    return await prisma.admins.update({
        where: { email },
        data: {
            password: newHashedPassword,
            otp: null,
            otp_expiry: null
        }
    });
};

const updateAdmin = async (id, data) => {
    return await prisma.admins.update({
        where: { id: parseInt(id) },
        data: {
            name: data.name,
            email: data.email,
            mobile: data.mobile,
            role: data.role,
            store_name: data.store_name,
            store_address: data.store_address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            drug_license_no: data.drug_license_no,
            gst_no: data.gst_no,
            profile_image: data.profile_image || null,
            updated_at: new Date()
        },
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            store_name: true,
            store_address: true,
            city: true,
            state: true,
            pincode: true,
            drug_license_no: true,
            gst_no: true,
            profile_image: true
        }
    });
};

const setTempEmailAndOtp = async (id, tempEmail, otp, expiry) => {
    await prisma.admins.update({
        where: { id: parseInt(id) },
        data: {
            temp_new_email: tempEmail,
            otp,
            otp_expiry: expiry
        }
    });
};

const verifyEmailChange = async (id) => {
    const admin = await prisma.admins.findUnique({ where: { id: parseInt(id) } });
    if (!admin || !admin.temp_new_email) return null;

    return await prisma.admins.update({
        where: { id: parseInt(id) },
        data: {
            email: admin.temp_new_email,
            temp_new_email: null,
            otp: null,
            otp_expiry: null
        }
    });
};

const deleteAdmin = async (id) => {
    const ids = Array.isArray(id) ? id.map(i => parseInt(i)) : [parseInt(id)];
    await prisma.admins.deleteMany({
        where: {
            id: { in: ids }
        }
    });
};

// GET ALL ADMINS FOR EXPORT
const getExportData = async () => {
    return await prisma.admins.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            store_name: true,
            city: true,
            state: true,
            created_at: true
        },
        orderBy: {
            id: 'desc'
        }
    });
};

module.exports = {
    findByEmail,
    findByMobileOrEmail,
    createAdmin,
    updateOTP,
    resetPassword,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    setTempEmailAndOtp,
    verifyEmailChange,
    getExportData
};
