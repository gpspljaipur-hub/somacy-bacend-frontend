const medicineModel = require("../models/medicine.model");
const categoryModel = require("../models/category.model");
const brandModel = require("../models/brand.model");
const xlsx = require("xlsx");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { validateColumns, getMappedData } = require("../utils/excelValidator");

// ADD MEDICINE
const addMedicine = async (req, res) => {
    try {
        const {
            medicine_name, category_id, brand_id, medicine_description,
            medicine_type, price, medicine_discount, rghs_discount,
            stock_status, stock_quantity, prescription_required, status, pack_type, medicine_rghs
        } = req.body;

        const files = req.files || [];

        // Validation: Total size cannot exceed 15MB
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > 15 * 1024 * 1024) {
            return res.status(400).json([{
                status: 400,
                message: "Total images size exceeds 15MB limit",
                data: null
            }]);
        }

        const medicine_images = files.map(file => `/uploads/medicines/${file.filename}`);

        let final_stock_quantity = stock_quantity ? Number(stock_quantity) : 0;
        if (stock_status === 'Out of Stock') {
            final_stock_quantity = 0;
        }

        let medicine = await medicineModel.addMedicine({
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
            prescription_required: prescription_required === "true" || prescription_required === "1" || prescription_required === "Yes" || prescription_required === true,
            status: status !== undefined && !isNaN(status) ? Number(status) : 1,
            pack_type: pack_type || null,
            medicine_rghs: medicine_rghs === "true" || medicine_rghs === "1" || medicine_rghs === "Yes" || medicine_rghs === true,
        });

        if (medicine && medicine.id) {
            medicine = await medicineModel.getMedicineById(medicine.id);
        }

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

// UPDATE MEDICINE
const updateMedicine = async (req, res) => {
    try {
        const {
            id, medicine_name, category_id, brand_id, medicine_description,
            medicine_type, price, medicine_discount, rghs_discount,
            stock_status, stock_quantity, prescription_required, status, pack_type, medicine_rghs
        } = req.body;

        if (!id) {
            return res.status(400).json([{
                status: 400,
                message: "Medicine ID is required in body",
                data: null
            }]);
        }

        const existingMedicine = await medicineModel.getMedicineById(id);
        if (!existingMedicine) {
            return res.status(404).json([{
                status: 404,
                message: "Medicine not found",
                data: null
            }]);
        }

        const files = req.files || [];

        // Validation: Total size cannot exceed 15MB
        const totalSize = files.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > 15 * 1024 * 1024) {
            return res.status(400).json([{
                status: 400,
                message: "Total images size exceeds 15MB limit",
                data: null
            }]);
        }

        // Handle Images: explicit mixture of retained (strings in body) and new (files)
        let retainedImages = req.body.medicine_images;
        if (!retainedImages) {
            retainedImages = [];
        } else if (!Array.isArray(retainedImages)) {
            retainedImages = [retainedImages];
        }

        const newImages = files.map(file => `/uploads/medicines/${file.filename}`);

        // Combine retained existing images with newly uploaded ones
        const medicine_images = [...retainedImages, ...newImages];

        let final_stock_status = stock_status !== undefined ? stock_status : existingMedicine.stock_status;
        let final_stock_quantity = stock_quantity !== undefined ? Number(stock_quantity) : existingMedicine.stock_quantity;

        if (final_stock_status === 'Out of Stock') {
            final_stock_quantity = 0;
        }

        await medicineModel.updateMedicine(id, {
            medicine_name: medicine_name !== undefined ? medicine_name : existingMedicine.medicine_name,
            medicine_images,
            category_id: category_id !== undefined ? Number(category_id) : existingMedicine.category_id,
            brand_id: brand_id !== undefined ? Number(brand_id) : existingMedicine.brand_id,
            medicine_description: medicine_description !== undefined ? medicine_description : existingMedicine.medicine_description,
            medicine_type: medicine_type !== undefined ? medicine_type : existingMedicine.medicine_type,
            price: price !== undefined ? Number(price) : existingMedicine.price,
            medicine_discount: medicine_discount !== undefined ? Number(medicine_discount) : existingMedicine.medicine_discount,
            rghs_discount: rghs_discount !== undefined ? Number(rghs_discount) : existingMedicine.rghs_discount,
            stock_status: final_stock_status,
            stock_quantity: final_stock_quantity,
            prescription_required: prescription_required !== undefined
                ? (prescription_required === "true" || prescription_required === "1" || prescription_required === "Yes" || prescription_required === true)
                : existingMedicine.prescription_required,
            status: status !== undefined ? Number(status) : existingMedicine.status,
            pack_type: pack_type !== undefined ? pack_type : existingMedicine.pack_type,
            medicine_rghs: medicine_rghs !== undefined
                ? (medicine_rghs === "true" || medicine_rghs === "1" || medicine_rghs === "Yes" || medicine_rghs === true)
                : existingMedicine.medicine_rghs,
        });

        // Refetch full object with joins
        const updated = await medicineModel.getMedicineById(id);

        res.json({
            status: 1,
            message: "Medicine updated successfully",
            data: updated,
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE MEDICINE
const deleteMedicine = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json([{
                status: 400,
                message: "Medicine ID is required in body",
                data: null
            }]);
        }

        await medicineModel.deleteMedicine(id);
        res.json({
            status: 1,
            message: "Medicine(s) deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

/* 
// OLD IMPORT MEDICINES FROM EXCEL (TEXT ONLY)
const importMedicines = async (req, res) => {
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
            medicine_name: ['Medicine Name', 'MedicineName', 'medicine_name'],
            medicine_images: ['Medicine Images', 'MedicineImages', 'medicine_images', 'Medicine Image', 'medicine_image', 'MedicineImage'],
            category_id: ['Category Id', 'CategoryId', 'category_id'],
            brand_id: ['Brand Id', 'BrandId', 'brand_id'],
            medicine_description: ['Medicine Description', 'MedicineDescription', 'medicine_description'],
            medicine_type: ['Medicine Type', 'MedicineType', 'medicine_type'],
            price: ['Price', 'price'],
            medicine_discount: ['Medicine Discount', 'MedicineDiscount', 'medicine_discount'],
            rghs_discount: ['RGHS Discount', 'RGHSDiscount', 'rghs_discount'],
            stock_status: ['Stock Status', 'StockStatus', 'stock_status'],
            stock_quantity: ['Stock Quantity', 'StockQuantity', 'stock_quantity'],
            prescription_required: ['Prescription Required', 'PrescriptionRequired', 'prescription_required'],
            status: ['Status', 'status'],
            pack_type: ['Pack Type', 'PackType', 'pack_type', 'Pack Size'],
            medicine_rghs: ['Medicine RGHS', 'MedicineRGHS', 'medicine_rghs', 'RGHS Medicine', 'Is RGHS']
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
            // Handle images: split if comma separated, or wrap singular in array
            // If the value ends up being undefined/null/empty string, default to empty array
            let imgArray = [];
            if (row.medicine_images) {
                if (typeof row.medicine_images === 'string') {
                    if (row.medicine_images.includes(',')) {
                        imgArray = row.medicine_images.split(',').map(img => img.trim());
                    } else {
                        imgArray = [row.medicine_images.trim()];
                    }
                } else {
                    // if somehow number or other type
                    imgArray = [String(row.medicine_images)];
                }
            }

            const medicine = await medicineModel.addMedicine({
                medicine_name: row.medicine_name || null,
                medicine_images: imgArray,
                category_id: row.category_id || null,
                brand_id: row.brand_id || null,
                medicine_description: row.medicine_description || null,
                medicine_type: row.medicine_type || null,
                price: row.price || 0,
                medicine_discount: row.medicine_discount || 0,
                rghs_discount: row.rghs_discount || 0,
                stock_status: row.stock_status || 'In Stock',
                stock_quantity: row.stock_quantity || 0,
                prescription_required: row.prescription_required === "true" || row.prescription_required === 1 || row.prescription_required === true || row.prescription_required === "Yes",
                status: row.status !== undefined ? Number(row.status) : 1,
                pack_type: row.pack_type || null,
                medicine_rghs: row.medicine_rghs === "true" || row.medicine_rghs === 1 || row.medicine_rghs === true || row.medicine_rghs === "Yes",
            });
            added.push(medicine);
        }
        res.status(201).json({
            status: 1,
            message: `${added.length} Medicines imported successfully`,
            data: added
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};
*/

// NEW IMPORT MEDICINES FROM EXCEL (WITH IMAGE EXTRACTION)
const importMedicines = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 0, message: "Excel file is required" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        const imageMap = {};
        const saveDir = path.join(__dirname, '../uploads/medicines');

        // Ensure directory exists
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        // 🔹 Extract images
        worksheet.getImages().forEach(image => {
            const imgModel = workbook.model.media.find(m => m.index === image.imageId);
            if (!imgModel) return;

            const ext = imgModel.extension;
            const buffer = imgModel.buffer;

            const fileName = `${uuidv4()}.${ext}`;
            const savePath = path.join(saveDir, fileName);

            fs.writeFileSync(savePath, buffer);

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
            medicine_rghs: ['Medicine RGHS', 'MedicineRGHS', 'medicine_rghs', 'RGHS Medicine']
        };

        // Find column indices
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

            const categoryName = getData('category_name');
            const brandName = getData('brand_name');

            // Lookup IDs by Name
            let category_id = null;
            if (categoryName) {
                const category = await categoryModel.getCategoryByName(String(categoryName).trim());
                category_id = category ? category.id : null;
            }

            let brand_id = null;
            if (brandName) {
                const brand = await brandModel.getBrandByName(String(brandName).trim());
                brand_id = brand ? brand.id : null;
            }

            const images = imageMap[rowNumber] || [];
            const presRequired = getData('prescription_required');
            const isRghs = getData('medicine_rghs');

            const medicine = await medicineModel.addMedicine({
                medicine_name: String(medicineName),
                medicine_images: images,
                category_id,
                brand_id,
                medicine_description: getData('medicine_description') ? String(getData('medicine_description')) : null,
                medicine_type: getData('medicine_type') ? String(getData('medicine_type')) : null,
                price: Number(getData('price')) || 0,
                medicine_discount: Number(getData('medicine_discount')) || 0,
                rghs_discount: Number(getData('rghs_discount')) || 0,
                stock_status: getData('stock_status') || 'In Stock',
                stock_quantity: Number(getData('stock_quantity')) || 0,
                prescription_required: presRequired === "true" || presRequired === 1 || presRequired === true || presRequired === "Yes",
                status: getData('status') !== undefined ? Number(getData('status')) : 1,
                pack_type: getData('pack_type') ? String(getData('pack_type')) : null,
                medicine_rghs: isRghs === "true" || isRghs === 1 || isRghs === true || isRghs === "Yes",
            });
            added.push(medicine);
        }

        res.json({
            status: 1,
            message: `${added.length} Medicines imported successfully with names and images`,
            data: added
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 0, message: "Excel processing failed: " + error.message });
    }
};

module.exports = {
    addMedicine,
    getMedicines,
    updateMedicine,
    deleteMedicine,
    importMedicines
};
