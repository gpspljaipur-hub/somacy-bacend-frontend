const prisma = require("../config/prisma");

const getSettings = async () => {
    return await prisma.system_settings.findFirst();
};

const updateSettings = async (data) => {
    const settings = await prisma.system_settings.findFirst();

    if (!settings) {
        return await prisma.system_settings.create({
            data: {
                dashboard_name: data.dashboard_name,
                short_name: data.short_name,
                currency: data.currency,
                timezone: data.timezone,
                show_prescription: data.show_prescription,
                logo: data.logo,
                user_app_id: data.user_app_id,
                user_app_key: data.user_app_key,
                delivery_app_id: data.delivery_app_id,
                delivery_app_key: data.delivery_app_key,
                store_name: data.store_name,
                store_mobile: data.store_mobile,
                store_email: data.store_email,
                contact_us: data.contact_us,
                store_address: data.store_address,
                about_us: data.about_us,
                latitude: data.latitude,
                longitude: data.longitude,
                delivery_radius: data.delivery_radius,
                per_km_price: data.per_km_price,
                referral_amount: data.referral_amount,
                sign_up_amount: data.sign_up_amount,
                privacy_policy: data.privacy_policy,
                terms_conditions: data.terms_conditions
            }
        });
    } else {
        return await prisma.system_settings.update({
            where: { id: settings.id },
            data: {
                dashboard_name: data.dashboard_name ?? undefined,
                short_name: data.short_name ?? undefined,
                currency: data.currency ?? undefined,
                timezone: data.timezone ?? undefined,
                show_prescription: data.show_prescription ?? undefined,
                logo: data.logo ?? undefined,
                user_app_id: data.user_app_id ?? undefined,
                user_app_key: data.user_app_key ?? undefined,
                delivery_app_id: data.delivery_app_id ?? undefined,
                delivery_app_key: data.delivery_app_key ?? undefined,
                store_name: data.store_name ?? undefined,
                store_mobile: data.store_mobile ?? undefined,
                store_email: data.store_email ?? undefined,
                contact_us: data.contact_us ?? undefined,
                store_address: data.store_address ?? undefined,
                about_us: data.about_us ?? undefined,
                latitude: data.latitude ?? undefined,
                longitude: data.longitude ?? undefined,
                delivery_radius: data.delivery_radius ?? undefined,
                per_km_price: data.per_km_price ?? undefined,
                referral_amount: data.referral_amount ?? undefined,
                sign_up_amount: data.sign_up_amount ?? undefined,
                privacy_policy: data.privacy_policy ?? undefined,
                terms_conditions: data.terms_conditions ?? undefined,
                updated_at: new Date()
            }
        });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
