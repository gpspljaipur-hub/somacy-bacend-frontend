const categoryModel = require("../models/category.model");
const medicineModel = require("../models/medicine.model");
const brandModel = require("../models/brand.model");
const bannerModel = require("../models/banner.model");
const couponModel = require("../models/coupon.model");
const customerModel = require("../models/customer.model");
const deliveryBoyModel = require("../models/delivery_boy.model");
const orderModel = require("../models/medicine_order.model");
const cartModel = require("../models/cart.model");
const testimonialModel = require("../models/testimonial.model");
const adminModel = require("../models/admin.model");
const paymentGatewayModel = require("../models/payment_gateway.model");
const deviceModel = require("../models/device.model");
const generalItemModel = require("../models/general_item.model");
const labTestModel = require("../models/lab_test.model");
const { exportToExcel } = require("../utils/export.util");

const exportData = async (req, res) => {
    try {
        const { type } = req.body;

        if (!type) {
            return res.status(400).json({ status: 0, message: "Export type is required" });
        }

        let data = [];
        let fileNamePrefix = type;

        switch (type.toLowerCase()) {
            case "categories":
                data = await categoryModel.getExportData();
                break;
            case "medicines":
                data = await medicineModel.getExportData();
                break;
            case "brands":
                data = await brandModel.getExportData();
                break;
            case "banners":
                data = await bannerModel.getExportData();
                break;
            case "coupons":
                data = await couponModel.getExportData();
                break;
            case "customers":
                data = await customerModel.getExportData();
                break;
            case "delivery-boys":
                data = await deliveryBoyModel.getExportData();
                break;
            case "orders":
            case "medicine-orders":
                data = await orderModel.getExportData();
                break;
            case "cart":
                data = await cartModel.getExportData();
                break;
            case "testimonials":
                data = await testimonialModel.getExportData();
                break;
            case "admins":
                data = await adminModel.getExportData();
                break;
            case "payment-gateways":
                data = await paymentGatewayModel.getExportData();
                break;
            case "lab-tests":
                data = await labTestModel.getExportData();
                break;
            case "devices":
                data = await deviceModel.getExportData();
                break;
            case "general-items":
                data = await generalItemModel.getExportData();
                break;
            case "custom-report": {
                const { order_type, period } = req.body;
                if (!period) return res.status(400).json({ status: 0, message: "Period filter is required for custom report" });
                data = await orderModel.getCustomReportData(order_type || 'All', period);
                fileNamePrefix = `Order_Report_${order_type || 'All'}_${period}`;

                // Add Totals Row
                if (data && data.length > 0) {
                    const totals = data.reduce((acc, row) => {
                        acc.rghs += parseFloat(row.RGHS_amount || 0);
                        acc.nonRghs += parseFloat(row["Non-RGHS Amount"] || 0);
                        acc.paid += parseFloat(row["Customer Paid"] || 0);
                        return acc;
                    }, { rghs: 0, nonRghs: 0, paid: 0 });

                    data.push({
                        "Order ID": "TOTAL",
                        "Date": "",
                        "Type": "",
                        "RGHS_amount": totals.rghs.toFixed(2),
                        "Non-RGHS Amount": totals.nonRghs.toFixed(2),
                        "Customer Paid": totals.paid.toFixed(2)
                    });
                }
                break;
            }
            default:
                return res.status(400).json({ status: 0, message: "Invalid export type" });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ status: 0, message: "No data found to export" });
        }

        // Process images to include full URL
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const imageFields = [
            'category_image', 'medicine_images', 'brand_image', 'banner_image',
            'coupon_image', 'prescription_images', 'medicine_image', 'image', 'device_image'
        ];

        data = data.map(row => {
            const newRow = { ...row };
            imageFields.forEach(field => {
                if (newRow[field]) {
                    if (typeof newRow[field] === 'string' && newRow[field].includes(',')) {
                        // Handle comma separated images (like for medicines)
                        newRow[field] = newRow[field].split(',')
                            .map(img => img.trim().startsWith('http') ? img.trim() : `${baseUrl}${img.trim().startsWith('/') ? '' : '/'}${img.trim()}`)
                            .join(', ');
                    } else if (typeof newRow[field] === 'string' && !newRow[field].startsWith('http')) {
                        // Handle single image path
                        newRow[field] = `${baseUrl}${newRow[field].startsWith('/') ? '' : '/'}${newRow[field]}`;
                    }
                }
            });
            return newRow;
        });

        const downloadUrl = await exportToExcel(data, fileNamePrefix, req);

        res.status(200).json({
            status: 1,
            message: `${type} export generated successfully`,
            download_url: downloadUrl
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = { exportData };
