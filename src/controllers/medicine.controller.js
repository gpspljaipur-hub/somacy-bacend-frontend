const medicineModel = require("../models/medicine.model");
const categoryModel = require("../models/category.model");
const brandModel = require("../models/brand.model");
const { safeParseArray, safeParseObject } = require("../utils/safeParser");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ADD MEDICINE
const addMedicine = async (req, res) => {
    try {
        const {
            medicine_name, category_id, brand_id, medicine_description,
            medicine_type, price, medicine_discount, rghs_discount,
            stock_status, stock_quantity, prescription_required, status, pack_type, medicine_rghs,
            // Extra details
            salt_composition, manufacturer, packaging, 
            what_it_is_used_for, how_it_works, safety_advice, expert_advice
        } = req.body;

        const files = req.files || [];

        // Validation: Total size cannot exceed 15MB
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > 15 * 1024 * 1024) {
            return res.status(400).json({ status: 0, message: "Total images size exceeds 15MB limit" });
        }

        const medicine_images = files.map(file => `/uploads/medicines/${file.filename}`);

        let final_stock_quantity = stock_quantity ? Number(stock_quantity) : 0;
        if (stock_status === 'Out of Stock') final_stock_quantity = 0;

        const medicine = await medicineModel.addMedicine({
            medicine_name,
            medicine_images,
            category_id: category_id ? Number(category_id) : null,
            brand_id: brand_id ? Number(brand_id) : null,
            medicine_description,
            medicine_type,
            price: price ? Number(price) : 0,
            medicine_discount: medicine_discount ? Number(medicine_discount) : 0,
            rghs_discount: rghs_discount ? Number(rghs_discount) : 0,
            stock_status: stock_status || 'In Stock',
            stock_quantity: final_stock_quantity,
            prescription_required: prescription_required === "true" || prescription_required === "1" || prescription_required === true,
            status: status !== undefined ? Number(status) : 1,
            pack_type: pack_type || null,
            medicine_rghs: medicine_rghs === "true" || medicine_rghs === "1" || medicine_rghs === true,
            // Extra details using safe parser
            salt_composition,
            manufacturer,
            packaging,
            what_it_is_used_for,
            how_it_works,
            safety_advice: safeParseObject(safety_advice),
            expert_advice: safeParseArray(expert_advice)
        });

        res.status(201).json({
            status: 1,
            message: "Medicine added successfully",
            data: medicine,
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET MEDICINES
const getMedicines = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        const data = await medicineModel.getAllMedicines(limit, offset, search);
        const total = await medicineModel.countMedicines(search);

        res.json({
            status: 1,
            message: "Medicines fetched successfully",
            total_count: total,
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET MEDICINE DETAILS
const getMedicineDetails = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Medicine ID is required" });

        const medicine = await medicineModel.getMedicineById(id);
        if (!medicine) return res.status(404).json({ status: 0, message: "Medicine not found" });

        res.json({
            status: 1,
            message: "Medicine details fetched successfully",
            data: medicine
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE MEDICINE
const updateMedicine = async (req, res) => {
    try {
        const {
            id, medicine_name, category_id, brand_id, medicine_description,
            medicine_type, price, medicine_discount, rghs_discount,
            stock_status, stock_quantity, prescription_required, status, pack_type, medicine_rghs,
            // Extra details
            salt_composition, manufacturer, packaging, 
            what_it_is_used_for, how_it_works, safety_advice, expert_advice
        } = req.body;

        if (!id) return res.status(400).json({ status: 0, message: "Medicine ID is required" });

        const existing = await medicineModel.getMedicineById(id);
        if (!existing) return res.status(404).json({ status: 0, message: "Medicine not found" });

        const files = req.files || [];
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > 15 * 1024 * 1024) return res.status(400).json({ status: 0, message: "Total images size exceeds 15MB limit" });

        let retainedImages = safeParseArray(req.body.medicine_images, []);
        const newImages = files.map(file => `/uploads/medicines/${file.filename}`);
        const medicine_images = [...retainedImages, ...newImages];

        let final_stock_status = stock_status !== undefined ? stock_status : existing.stock_status;
        let final_stock_quantity = stock_quantity !== undefined ? Number(stock_quantity) : existing.stock_quantity;
        if (final_stock_status === 'Out of Stock') final_stock_quantity = 0;

        await medicineModel.updateMedicine(id, {
            medicine_name: medicine_name !== undefined ? medicine_name : existing.medicine_name,
            medicine_images,
            category_id: category_id !== undefined ? Number(category_id) : existing.category_id,
            brand_id: brand_id !== undefined ? Number(brand_id) : existing.brand_id,
            medicine_description: medicine_description !== undefined ? medicine_description : existing.medicine_description,
            medicine_type: medicine_type !== undefined ? medicine_type : existing.medicine_type,
            price: price !== undefined ? Number(price) : existing.price,
            medicine_discount: medicine_discount !== undefined ? Number(medicine_discount) : existing.medicine_discount,
            rghs_discount: rghs_discount !== undefined ? Number(rghs_discount) : existing.rghs_discount,
            stock_status: final_stock_status,
            stock_quantity: final_stock_quantity,
            prescription_required: prescription_required !== undefined ? (prescription_required === "true" || prescription_required === "1" || prescription_required === true) : existing.prescription_required,
            status: status !== undefined ? Number(status) : existing.status,
            pack_type: pack_type !== undefined ? pack_type : existing.pack_type,
            medicine_rghs: medicine_rghs !== undefined ? (medicine_rghs === "true" || medicine_rghs === "1" || medicine_rghs === true) : existing.medicine_rghs,
            // Extra details
            salt_composition: salt_composition !== undefined ? salt_composition : existing.salt_composition,
            manufacturer: manufacturer !== undefined ? manufacturer : existing.manufacturer,
            packaging: packaging !== undefined ? packaging : existing.packaging,
            what_it_is_used_for: what_it_is_used_for !== undefined ? what_it_is_used_for : existing.what_it_is_used_for,
            how_it_works: how_it_works !== undefined ? how_it_works : existing.how_it_works,
            safety_advice: safety_advice !== undefined ? safeParseObject(safety_advice) : existing.safety_advice,
            expert_advice: expert_advice !== undefined ? safeParseArray(expert_advice) : existing.expert_advice
        });

        const updated = await medicineModel.getMedicineById(id);
        res.json({ status: 1, message: "Medicine updated successfully", data: updated });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE MEDICINE
const deleteMedicine = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Medicine ID is required" });
        await medicineModel.deleteMedicine(id);
        res.json({ status: 1, message: "Medicine(s) deleted successfully" });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// NEW IMPORT MEDICINES FROM EXCEL (WITH IMAGE EXTRACTION)
const importMedicines = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 0, message: "Excel file is required" });

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        const imageMap = {};
        const saveDir = path.join(__dirname, '../uploads/medicines');
        if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

        worksheet.getImages().forEach(image => {
            const imgModel = workbook.model.media.find(m => m.index === image.imageId);
            if (!imgModel) return;
            const fileName = `${uuidv4()}.${imgModel.extension}`;
            fs.writeFileSync(path.join(saveDir, fileName), imgModel.buffer);
            const rowNumber = Math.floor(image.range.tl.row) + 1;
            if (!imageMap[rowNumber]) imageMap[rowNumber] = [];
            imageMap[rowNumber].push(`/uploads/medicines/${fileName}`);
        });

        const columnMapping = {
            medicine_name: ['Medicine Name', 'MedicineName', 'medicine_name'],
            category_name: ['Category Name', 'CategoryName', 'category_name', 'Category'],
            brand_name: ['Brand Name', 'BrandName', 'brand_name', 'Brand'],
            medicine_description: ['Medicine Description', 'MedicineDescription', 'medicine_description', 'Description'],
            medicine_type: ['Medicine Type', 'MedicineType', 'medicine_type', 'Type'],
            price: ['Price', 'price', 'Rate'],
            medicine_discount: ['Medicine Discount', 'MedicineDiscount', 'medicine_discount', 'Discount'],
            rghs_discount: ['RGHS Discount', 'RGHSDiscount', 'rghs_discount'],
            stock_status: ['Stock Status', 'StockStatus', 'stock_status'],
            stock_quantity: ['Stock Quantity', 'StockQuantity', 'stock_quantity', 'Quantity'],
            prescription_required: ['Prescription Required', 'PrescriptionRequired', 'prescription_required'],
            status: ['Status', 'status'],
            pack_type: ['Pack Type', 'PackType', 'pack_type', 'Pack Size'],
            medicine_rghs: ['Medicine RGHS', 'MedicineRGHS', 'medicine_rghs', 'RGHS Medicine'],
            salt_composition: ['Salt', 'Salt Composition', 'salt_composition'],
            manufacturer: ['Manufacturer', 'Company', 'manufacturer']
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

            const medicineName = getData('medicine_name');
            if (!medicineName) continue;

            let category_id = null;
            if (getData('category_name')) {
                const category = await categoryModel.getCategoryByName(String(getData('category_name')).trim());
                category_id = category ? category.id : null;
            }

            let brand_id = null;
            if (getData('brand_name')) {
                const brand = await brandModel.getBrandByName(String(getData('brand_name')).trim());
                brand_id = brand ? brand.id : null;
            }

            const medicine = await medicineModel.addMedicine({
                medicine_name: String(medicineName),
                medicine_images: imageMap[rowNumber] || [],
                category_id,
                brand_id,
                medicine_description: getData('medicine_description') ? String(getData('medicine_description')) : null,
                medicine_type: getData('medicine_type') ? String(getData('medicine_type')) : null,
                price: Number(getData('price')) || 0,
                medicine_discount: Number(getData('medicine_discount')) || 0,
                rghs_discount: Number(getData('rghs_discount')) || 0,
                stock_status: getData('stock_status') || 'In Stock',
                stock_quantity: Number(getData('stock_quantity')) || 0,
                prescription_required: getData('prescription_required') === "true" || getData('prescription_required') === 1 || getData('prescription_required') === true,
                status: getData('status') !== undefined ? Number(getData('status')) : 1,
                pack_type: getData('pack_type') ? String(getData('pack_type')) : null,
                medicine_rghs: getData('medicine_rghs') === "true" || getData('medicine_rghs') === 1 || getData('medicine_rghs') === true,
                salt_composition: getData('salt_composition') || null,
                manufacturer: getData('manufacturer') || null
            });
            added.push(medicine);
        }

        res.json({ status: 1, message: `${added.length} Medicines imported successfully`, data: added });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 0, message: "Excel processing failed: " + error.message });
    }
};

module.exports = {
    addMedicine,
    getMedicines,
    getMedicineDetails,
    updateMedicine,
    deleteMedicine,
    importMedicines
};
