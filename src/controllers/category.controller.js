const categoryModel = require("../models/category.model");
const xlsx = require("xlsx");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { validateColumns, getMappedData } = require("../utils/excelValidator");

// ADD CATEGORY
const addCategory = async (req, res) => {
    try {
        const { category_name, status } = req.body;

        const category_image = req.file
            ? `/uploads/categories/${req.file.filename}`
            : null;

        const category = await categoryModel.addCategory({
            category_name,
            category_image,
            status: status !== undefined && !isNaN(status) ? Number(status) : 1,
        });

        res.status(201).json([{
            status: 201,
            message: "Category added successfully",
            data: category,
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

// GET CATEGORY LIST
const getCategories = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        const data = await categoryModel.getAllCategories(limit, offset, search);
        const total = await categoryModel.countCategories(search);

        res.json([{
            status: 200,
            message: "Categories fetched successfully",
            total_count: total,
            data: data,
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
    try {
        const { id, category_name, status } = req.body;

        if (!id) {
            return res.status(400).json([{
                status: 400,
                message: "Category ID is required in body",
                data: null
            }]);
        }

        const existingCategory = await categoryModel.getCategoryById(id);
        if (!existingCategory) {
            return res.status(404).json([{
                status: 404,
                message: "Category not found",
                data: null
            }]);
        }

        let category_image = existingCategory.category_image;

        if (req.file) {
            category_image = `/uploads/categories/${req.file.filename}`;
        } else if (req.body.category_image === "") {
            category_image = null;
        }

        const updated = await categoryModel.updateCategory(id, {
            category_name: (category_name && category_name.trim()) ? category_name : existingCategory.category_name,
            category_image,
            status: (status !== undefined && status !== "") ? Number(status) : existingCategory.status,
        });

        res.json([{
            status: 200,
            message: "Category updated successfully",
            data: updated,
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json([{
                status: 400,
                message: "Category ID is required in body",
                data: null
            }]);
        }

        await categoryModel.deleteCategory(id);
        res.json([{
            status: 200,
            message: "Category(s) deleted successfully",
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

/*
// OLD IMPORT CATEGORIES FROM EXCEL
const importCategories = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json([{
                status: 400,
                message: "Excel file is required",
                data: null
            }]);
        }

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Validate Headers
        const headers = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];
        const columnMapping = {
            category_name: ['Category Name', 'CategoryName', 'category_name'],
            category_image: ['Category Image', 'CategoryImage', 'category_image'],
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

        if (mappedData.length === 0) {
            return res.status(400).json([{
                status: 400,
                message: "Excel file is empty",
                data: null
            }]);
        }

        const addedCategories = [];
        for (const row of mappedData) {
            const category = await categoryModel.addCategory({
                category_name: row.category_name || null,
                category_image: row.category_image || null,
                status: row.status !== undefined ? Number(row.status) : 1
            });
            addedCategories.push(category);
        }

        res.status(201).json([{
            status: 201,
            message: `${addedCategories.length} Categories imported successfully`,
            data: addedCategories
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

// NEW IMPORT CATEGORIES FROM EXCEL (WITH IMAGE EXTRACTION)
const importCategories = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 0, message: "Excel file is required" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        const imageMap = {};
        const saveDir = path.join(__dirname, '../uploads/categories');

        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        worksheet.getImages().forEach(image => {
            const imgModel = workbook.model.media.find(m => m.index === image.imageId);
            if (!imgModel) return;

            const fileName = `${uuidv4()}.${imgModel.extension}`;
            fs.writeFileSync(path.join(saveDir, fileName), imgModel.buffer);

            const rowNumber = Math.floor(image.range.tl.row) + 1;
            imageMap[rowNumber] = `/uploads/categories/${fileName}`;
        });

        const columnMapping = {
            category_name: ['Category Name', 'CategoryName', 'category_name', 'Category'],
            category_image: ['Category Image', 'CategoryImage', 'category_image'],
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

            const categoryName = getData('category_name');
            if (!categoryName) continue;

            let finalImage = imageMap[rowNumber] || getData('category_image') || null;

            const category = await categoryModel.addCategory({
                category_name: String(categoryName),
                category_image: finalImage,
                status: getData('status') !== undefined ? Number(getData('status')) : 1
            });
            added.push(category);
        }

        res.json({
            status: 1,
            message: `${added.length} Categories imported successfully`,
            data: added
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 0, message: "Excel processing failed: " + error.message });
    }
};

module.exports = {
    addCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    importCategories
};
