const adminModel = require("../models/admin.model");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or mobile

        if (!identifier || !password) {
            return res.status(400).json([{
                status: 400,
                message: "Mobile/Email and password are required",
                data: null
            }]);
        }

        const admin = await adminModel.findByMobileOrEmail(identifier);
        if (!admin) {
            return res.status(401).json([{
                status: 401,
                message: "Invalid credentials",
                data: null
            }]);
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json([{
                status: 401,
                message: "Invalid credentials",
                data: null
            }]);
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json([{
            status: 200,
            message: "Login successful",
            token,
            user: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                mobile: admin.mobile,
                role: admin.role,
                store_name: admin.store_name,
                store_address: admin.store_address,
                city: admin.city,
                state: admin.state,
                pincode: admin.pincode,
                profile_image: admin.profile_image
            }
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

const signup = async (req, res) => {
    try {
        const {
            name, mobile, email, role, password, confirm_password,
            store_name, store_address, city, state, pincode,
            drug_license_no, gst_no
        } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json([{
                status: 400,
                message: "Name, email and password are required",
                data: null
            }]);
        }

        if (!drug_license_no) {
            return res.status(400).json([{
                status: 400,
                message: "Drug License Number is required",
                data: null
            }]);
        }

        if (gst_no) {
            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstRegex.test(gst_no)) {
                return res.status(400).json([{
                    status: 400,
                    message: "Invalid GST Number format",
                    data: null
                }]);
            }
        }

        if (password !== confirm_password) {
            return res.status(400).json([{
                status: 400,
                message: "Passwords do not match",
                data: null
            }]);
        }

        const existingAdmin = await adminModel.findByEmail(email);
        if (existingAdmin) {
            return res.status(400).json([{
                status: 400,
                message: "Admin with this email already exists",
                data: null
            }]);
        }

        const hashedPwd = await bcrypt.hash(password, 10);

        const newAdmin = await adminModel.createAdmin({
            name, mobile, email, role: role || 'Admin', password: hashedPwd,
            store_name, store_address, city, state, pincode,
            drug_license_no, gst_no
        });

        const token = jwt.sign(
            { id: newAdmin.id, email: newAdmin.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json([{
            status: 201,
            message: "Admin account created successfully",
            token,
            user: newAdmin
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

// FORGOT PASSWORD - SEND OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json([{
            status: 400,
            message: "Email is required",
            data: null
        }]);

        const admin = await adminModel.findByEmail(email);
        if (!admin) return res.status(404).json([{
            status: 404,
            message: "User not found",
            data: null
        }]);

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        await adminModel.updateOTP(email, otp, expiry);

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Somacy Admin Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`
        };

        await transporter.sendMail(mailOptions);

        res.json([{
            status: 200,
            message: "OTP sent to your email",
            data: null
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

// VERIFY OTP AND RESET PASSWORD
const resetPassword = async (req, res) => {
    try {
        const { email, otp, new_password, confirm_password } = req.body;

        if (!email || !otp || !new_password) {
            return res.status(400).json([{
                status: 400,
                message: "All fields are required",
                data: null
            }]);
        }

        if (new_password !== confirm_password) {
            return res.status(400).json([{
                status: 400,
                message: "Passwords do not match",
                data: null
            }]);
        }

        const admin = await adminModel.findByEmail(email);
        if (!admin) return res.status(404).json([{
            status: 404,
            message: "User not found",
            data: null
        }]);

        if (admin.otp !== otp || new Date() > new Date(admin.otp_expiry)) {
            return res.status(400).json([{
                status: 400,
                message: "Invalid or expired OTP",
                data: null
            }]);
        }

        const hashedPwd = await bcrypt.hash(new_password, 10);
        await adminModel.resetPassword(email, hashedPwd);

        res.json([{
            status: 200,
            message: "Password reset successful",
            data: null
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

// EDIT PROFILE
const updateProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json([{ status: 401, message: "No token provided" }]);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.id;

        const { name, email, mobile, role, store_name, store_address, city, state, pincode, drug_license_no, gst_no } = req.body;
        const file = req.file; // From multer

        if (gst_no) {
            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstRegex.test(gst_no)) {
                return res.status(400).json([{
                    status: 400,
                    message: "Invalid GST Number format",
                    data: null
                }]);
            }
        }

        const existingAdmin = await adminModel.getAdminById(adminId);
        if (!existingAdmin) {
            return res.status(404).json([{
                status: 404,
                message: "Admin not found",
                data: null
            }]);
        }

        // Handle Email Change
        let emailVerificationRequired = false;
        let finalEmail = existingAdmin.email;

        if (email && email.trim().toLowerCase() !== existingAdmin.email.toLowerCase()) {
            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            try {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Verify New Email Address',
                    text: `Your OTP for changing email to ${email} is: ${otp}.`
                };
                await transporter.sendMail(mailOptions);

                await adminModel.setTempEmailAndOtp(adminId, email, otp, expiry);
                emailVerificationRequired = true;

            } catch (emailErr) {
                console.error("Failed to send OTP email:", emailErr);
                return res.status(500).json([{
                    status: 500,
                    message: "Failed to send verification email. Please check the email address.",
                    data: null
                }]);
            }
        }

        // Handle Image
        let profileImage = existingAdmin.profile_image;

        if (req.body.removeProfileImage === 'true' || req.body.removeProfileImage === true) {
            profileImage = null;
        }

        if (file) {
            if (file.buffer) {
                const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                profileImage = base64Image;
            }
        }

        const updated = await adminModel.updateAdmin(adminId, {
            name: name !== undefined ? name : existingAdmin.name,
            email: finalEmail, // Keep old email until verified
            mobile: mobile !== undefined ? mobile : existingAdmin.mobile,
            role: role !== undefined ? role : existingAdmin.role,
            store_name: store_name !== undefined ? store_name : existingAdmin.store_name,
            store_address: store_address !== undefined ? store_address : existingAdmin.store_address,
            city: city !== undefined ? city : existingAdmin.city,
            state: state !== undefined ? state : existingAdmin.state,
            pincode: pincode !== undefined ? pincode : existingAdmin.pincode,
            drug_license_no: drug_license_no !== undefined ? drug_license_no : existingAdmin.drug_license_no,
            gst_no: gst_no !== undefined ? gst_no : existingAdmin.gst_no,
            profile_image: profileImage
        });

        res.json([{
            status: emailVerificationRequired ? 202 : 200,
            message: emailVerificationRequired ? "Profile updated. Please verify new email with OTP sent." : "Profile updated successfully",
            emailVerificationRequired,
            data: updated
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

const verifyEmailChange = async (req, res) => {
    try {
        const { id, otp, new_email } = req.body;
        if (!id || !otp || !new_email) {
            return res.status(400).json([{ status: 400, message: "Missing required fields" }]);
        }

        const admin = await adminModel.getAdminById(id);
        if (!admin) return res.status(404).json([{ status: 404, message: "User not found" }]);

        if (admin.temp_new_email !== new_email) {
            return res.status(400).json([{ status: 400, message: "Email mismatch" }]);
        }
        if (admin.otp !== otp) {
            return res.status(400).json([{ status: 400, message: "Invalid OTP" }]);
        }

        const updated = await adminModel.verifyEmailChange(id);

        res.json([{
            status: 200,
            message: "Email updated successfully",
            data: updated
        }]);

    } catch (err) {
        res.status(500).json([{ status: 500, message: err.message }]);
    }
};

// DELETE PROFILE
const deleteProfile = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json([{
                status: 400,
                message: "Admin ID(s) required in body",
                data: null
            }]);
        }

        await adminModel.deleteAdmin(id);
        res.json([{
            status: 200,
            message: "Account(s) deleted successfully",
            data: null
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

// GET PROFILE (ME)
const getProfile = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json([{ status: 401, message: "No token provided" }]);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await adminModel.getAdminById(decoded.id);

        if (!admin) {
            return res.status(404).json([{ status: 404, message: "User not found" }]);
        }

        const { password, otp, otp_expiry, ...userWithoutSensitiveData } = admin;

        res.json([{
            status: 200,
            message: "Profile fetched successfully",
            data: userWithoutSensitiveData
        }]);
    } catch (err) {
        res.status(401).json([{ status: 401, message: "Invalid or expired token" }]);
    }
};

// LOGOUT
const logout = async (req, res) => {
    res.json([{
        status: 200,
        message: "Logout successful",
        data: null
    }]);
};

module.exports = {
    login,
    signup,
    forgotPassword,
    resetPassword,
    updateProfile,
    deleteProfile,
    getProfile,
    logout,
    verifyEmailChange
};
