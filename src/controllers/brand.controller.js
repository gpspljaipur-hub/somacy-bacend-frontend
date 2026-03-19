const brandModel = require("../models/brand.model");
const xlsx = require("xlsx");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { validateColumns, getMappedData } = require("../utils/excelValidator");

// ADD BRAND
const addBrand = async (req, res) => {
    try {
        const { brand_name, is_popular, status } = req.body;

        const brand_image = req.file
            ? `/uploads/brands/${req.file.filename}`
            : null;

        const brand = await brandModel.addBrand({
            brand_name,
            brand_image,
            is_popular: is_popular === "true" || is_popular === "1" || is_popular === true || is_popular === "Yes",
            status: status !== undefined && !isNaN(status) ? Number(status) : 1,
        });

        res.status(201).json({
            status: 1,
            message: "Brand added successfully",
            data: brand,
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

// GET BRAND LIST
const getBrands = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        const data = await brandModel.getAllBrands(limit, offset, search);
        const total = await brandModel.countBrands(search);
        res.json({
            status: 1,
            message: "Brands fetched successfully",
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

// UPDATE BRAND
const updateBrand = async (req, res) => {
    try {
        const { id, brand_name, is_popular, status } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "Brand ID is required in body",
                data: null
            });
        }

        const existingBrand = await brandModel.getBrandById(id);
        if (!existingBrand) {
            return res.status(404).json({
                status: 0,
                message: "Brand not found",
                data: null
            });
        }

        let brand_image = existingBrand.brand_image;

        if (req.file) {
            brand_image = `/uploads/brands/${req.file.filename}`;
        } else if (req.body.brand_image === "") {
            brand_image = null;
        }

        const updated = await brandModel.updateBrand(id, {
            brand_name: brand_name !== undefined ? brand_name : existingBrand.brand_name,
            brand_image,
            is_popular: is_popular !== undefined ? (is_popular === "true" || is_popular === "1" || is_popular === true || is_popular === "Yes") : existingBrand.is_popular,
            status: status !== undefined ? Number(status) : existingBrand.status,
        });

        res.json({
            status: 1,
            message: "Brand updated successfully",
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

// DELETE BRAND
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "Brand ID is required in body",
                data: null
            });
        }

        await brandModel.deleteBrand(id);
        res.json({
            status: 1,
            message: "Brand(s) deleted successfully",
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
// OLD IMPORT BRANDS FROM EXCEL
const importBrands = async (req, res) => {
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
            brand_name: ['Brand Name', 'BrandName', 'brand_name'],
            brand_image: ['Brand Image', 'BrandImage', 'brand_image'],
            is_popular: ['Is Popular', 'IsPopular', 'is_popular'],
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
            const brand = await brandModel.addBrand({
                brand_name: row.brand_name || null,
                brand_image: row.brand_image || null,
                is_popular: row.is_popular === "true" || row.is_popular === 1 || row.is_popular === true,
                status: row.status !== undefined ? Number(row.status) : 1
            });
            added.push(brand);
        }
        res.status(201).json([{
            status: 201,
            message: `${added.length} Brands imported successfully`,
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

// NEW IMPORT BRANDS FROM EXCEL (WITH IMAGE EXTRACTION)
const importBrands = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 0, message: "Excel file is required" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        const imageMap = {};
        const saveDir = path.join(__dirname, '../uploads/brands');

        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        worksheet.getImages().forEach(image => {
            const imgModel = workbook.model.media.find(m => m.index === image.imageId);
            if (!imgModel) return;

            const fileName = `${uuidv4()}.${imgModel.extension}`;
            fs.writeFileSync(path.join(saveDir, fileName), imgModel.buffer);

            const rowNumber = Math.floor(image.range.tl.row) + 1;
            imageMap[rowNumber] = `/uploads/brands/${fileName}`;
        });

        const columnMapping = {
            brand_name: ['Brand Name', 'BrandName', 'brand_name', 'Brand'],
            brand_image: ['Brand Image', 'BrandImage', 'brand_image'],
            is_popular: ['Is Popular', 'IsPopular', 'is_popular', 'Popular'],
            status: ['Status', 'status']
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

            const brandName = getData('brand_name');
            if (!brandName) continue;

            let finalImage = imageMap[rowNumber] || getData('brand_image') || null;

            const isPopularVal = getData('is_popular');
            const is_popular = isPopularVal === "true" || isPopularVal === 1 || isPopularVal === true || isPopularVal === "Yes" || isPopularVal === "TRUE";

            const brand = await brandModel.addBrand({
                brand_name: String(brandName),
                brand_image: finalImage,
                is_popular,
                status: getData('status') !== undefined ? Number(getData('status')) : 1
            });
            added.push(brand);
        }

        res.json({
            status: 1,
            message: `${added.length} Brands imported successfully`,
            data: added
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 0, message: "Excel processing failed: " + error.message });
    }
};

module.exports = {
    addBrand,
    getBrands,
    updateBrand,
    deleteBrand,
    importBrands
};
