const couponModel = require("../models/coupon.model");
const xlsx = require("xlsx");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { validateColumns, getMappedData } = require("../utils/excelValidator");

// ADD COUPON
const addCoupon = async (req, res) => {
    try {
        const {
            coupon_code,
            coupon_title,
            coupon_description,
            expiry_date,
            min_order_amount,
            discount,
            status
        } = req.body;

        const coupon_image = req.file
            ? `/uploads/coupons/${req.file.filename}`
            : null;

        const coupon = await couponModel.addCoupon({
            coupon_code,
            coupon_title,
            coupon_description,
            expiry_date: expiry_date || null,
            min_order_amount: min_order_amount ? Number(min_order_amount) : 0,
            discount: discount ? Number(discount) : 0,
            status: status !== undefined && !isNaN(status) ? Number(status) : 1,
            coupon_image,
        });

        res.status(201).json({
            status: 1,
            message: "Coupon added successfully",
            data: coupon,
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

// GET COUPON LIST
const getCoupons = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        const data = await couponModel.getAllCoupons(limit, offset, search);
        const total = await couponModel.countCoupons(search);
        res.json({
            status: 1,
            message: "Coupons fetched successfully",
            total_count: total,
            data: data
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

// UPDATE COUPON
const updateCoupon = async (req, res) => {
    try {
        const {
            id,
            coupon_code,
            coupon_title,
            coupon_description,
            expiry_date,
            min_order_amount,
            discount,
            status
        } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "Coupon ID is required in body",
                data: null
            });
        }

        const existingCoupon = await couponModel.getCouponById(id);
        if (!existingCoupon) {
            return res.status(404).json({
                status: 0,
                message: "Coupon not found",
                data: null
            });
        }

        let coupon_image = existingCoupon.coupon_image;

        if (req.file) {
            coupon_image = `/uploads/coupons/${req.file.filename}`;
        } else if (req.body.coupon_image === "") {
            coupon_image = null;
        }

        const updated = await couponModel.updateCoupon(id, {
            coupon_code: coupon_code !== undefined ? coupon_code : existingCoupon.coupon_code,
            coupon_title: coupon_title !== undefined ? coupon_title : existingCoupon.coupon_title,
            coupon_description: coupon_description !== undefined ? coupon_description : existingCoupon.coupon_description,
            expiry_date: expiry_date !== undefined ? expiry_date : existingCoupon.expiry_date,
            min_order_amount: min_order_amount !== undefined ? Number(min_order_amount) : existingCoupon.min_order_amount,
            discount: discount !== undefined ? Number(discount) : existingCoupon.discount,
            status: status !== undefined ? Number(status) : existingCoupon.status,
            coupon_image,
        });

        res.json({
            status: 1,
            message: "Coupon updated successfully",
            data: updated,
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

// DELETE COUPON
const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "Coupon ID is required in body",
                data: null
            });
        }

        await couponModel.deleteCoupon(id);
        res.json({
            status: 1,
            message: "Coupon(s) deleted successfully",
            data: null
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

/*
// OLD IMPORT COUPONS FROM EXCEL
const importCoupons = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json([{
            status: 400,
            message: "Excel file is required",
            data: null
        }]);
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Validate Headers
        const headers = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];
        const columnMapping = {
            coupon_code: ['Coupon Code', 'CouponCode', 'coupon_code'],
            coupon_title: ['Coupon Title', 'CouponTitle', 'coupon_title'],
            coupon_description: ['Coupon Description', 'CouponDescription', 'coupon_description'],
            expiry_date: ['Expiry Date', 'ExpiryDate', 'expiry_date'],
            min_order_amount: ['Min Order Amount', 'MinOrderAmount', 'min_order_amount'],
            discount: ['Discount', 'discount'],
            status: ['Status', 'status']
        };

        const validation = validateColumns(headers, columnMapping);

        if (!validation.valid) {
            return res.status(400).json([{
                status: 400,
                message: validation.message,
                data: null
            }]);
        }

        const rawData = xlsx.utils.sheet_to_json(sheet);
        const mappedData = getMappedData(rawData, columnMapping);

        const added = [];
        for (const row of mappedData) {
            const coupon = await couponModel.addCoupon({
                coupon_code: row.coupon_code || null,
                coupon_title: row.coupon_title || null,
                coupon_description: row.coupon_description || null,
                expiry_date: row.expiry_date || null,
                min_order_amount: row.min_order_amount || 0,
                discount: row.discount || 0,
                status: row.status !== undefined ? Number(row.status) : 1
            });
            added.push(coupon);
        }
        res.status(201).json([{
            status: 201,
            message: `${added.length} Coupons imported successfully`,
            data: added
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};
*/

// NEW IMPORT COUPONS FROM EXCEL (WITH IMAGE EXTRACTION)
const importCoupons = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 0, message: "Excel file is required" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        const imageMap = {};
        const saveDir = path.join(__dirname, '../uploads/coupons');

        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        worksheet.getImages().forEach(image => {
            const imgModel = workbook.model.media.find(m => m.index === image.imageId);
            if (!imgModel) return;

            const fileName = `${uuidv4()}.${imgModel.extension}`;
            fs.writeFileSync(path.join(saveDir, fileName), imgModel.buffer);

            const rowNumber = Math.floor(image.range.tl.row) + 1;
            imageMap[rowNumber] = `/uploads/coupons/${fileName}`;
        });

        const columnMapping = {
            coupon_code: ['Coupon Code', 'CouponCode', 'coupon_code', 'Code'],
            coupon_title: ['Coupon Title', 'CouponTitle', 'coupon_title', 'Title'],
            coupon_description: ['Coupon Description', 'CouponDescription', 'coupon_description', 'Description'],
            expiry_date: ['Expiry Date', 'ExpiryDate', 'expiry_date', 'Expiry'],
            min_order_amount: ['Min Order Amount', 'MinOrderAmount', 'min_order_amount', 'Min Amount'],
            discount: ['Discount', 'discount'],
            status: ['Status', 'status'],
            coupon_image: ['Coupon Image', 'CouponImage', 'coupon_image']
        };

        const headerRow = worksheet.getRow(1);
        const colIndices = {};
        headerRow.eachCell((cell, colNumber) => {
            const headerText = cell.value ? String(cell.value).trim() : '';
            for (const [field, aliases] of Object.entries(columnMapping)) {
                if (aliases.some(alias => alias.toLowerCase() === headerText.toLowerCase())) {
                    colIndices[field] = colNumber;
                }
            }
        });

        const added = [];
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            rows.push({ row, rowNumber });
        });

        for (const item of rows) {
            const { row, rowNumber } = item;
            const getData = (field) => {
                const idx = colIndices[field];
                if (!idx) return undefined;
                const val = row.getCell(idx).value;
                return val && typeof val === 'object' ? val.result || val.text || JSON.stringify(val) : val;
            };

            const couponCode = getData('coupon_code');
            if (!couponCode) continue;

            let finalImage = imageMap[rowNumber] || getData('coupon_image') || null;

            const coupon = await couponModel.addCoupon({
                coupon_code: String(couponCode),
                coupon_title: getData('coupon_title') ? String(getData('coupon_title')) : null,
                coupon_description: getData('coupon_description') ? String(getData('coupon_description')) : null,
                expiry_date: getData('expiry_date') || null,
                min_order_amount: Number(getData('min_order_amount')) || 0,
                discount: Number(getData('discount')) || 0,
                status: getData('status') !== undefined ? Number(getData('status')) : 1,
                coupon_image: finalImage
            });
            added.push(coupon);
        }

        res.json({
            status: 1,
            message: `${added.length} Coupons imported successfully`,
            data: added
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 0, message: "Excel processing failed: " + error.message });
    }
};

module.exports = {
    addCoupon,
    getCoupons,
    updateCoupon,
    deleteCoupon,
    importCoupons
};
