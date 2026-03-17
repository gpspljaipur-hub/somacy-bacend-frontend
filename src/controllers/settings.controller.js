const settingsModel = require("../models/settings.model");

// GET SETTINGS
const getSettings = async (req, res) => {
    try {
        const data = await settingsModel.getSettings();
        res.json({
            status: 200,
            message: "Settings fetched successfully",
            data: data
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
};

// UPDATE SETTINGS
const updateSettings = async (req, res) => {
    try {
        const body = req.body;

        // Image Handling
        let logo = undefined;
        if (req.file) {
            logo = `uploads/${req.file.filename}`;
        }

        // Map frontend camelCase to backend snake_case
        const updateData = {
            dashboard_name: body.dashboardName,
            short_name: body.shortName,
            currency: body.currency,
            timezone: body.timezone,
            show_prescription: body.showPrescription,
            logo: logo, // Undefined if no file, will be handled by COALESCE in model

            user_app_id: body.userAppId,
            user_app_key: body.userAppKey,
            delivery_app_id: body.deliveryAppId,
            delivery_app_key: body.deliveryAppKey,

            store_name: body.storeName,
            store_mobile: body.storeMobile,
            store_email: body.storeEmail,
            contact_us: body.contactUs,
            store_address: body.storeAddress,
            about_us: body.aboutUs,

            latitude: body.latitude,
            longitude: body.longitude,
            delivery_radius: body.deliveryRadius,
            per_km_price: body.perKmPrice,

            referral_amount: body.referralAmount,
            sign_up_amount: body.signUpAmount,

            privacy_policy: body.privacyPolicy,
            terms_conditions: body.termsConditions
        };

        const updatedSettings = await settingsModel.updateSettings(updateData);

        res.json({
            status: 200,
            message: "Settings updated successfully",
            data: updatedSettings
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 500,
            message: "Failed to update settings",
            data: null
        });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
