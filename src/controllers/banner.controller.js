const bannerModel = require("../models/banner.model");
const categoryModel = require("../models/category.model");
const xlsx = require("xlsx");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { validateColumns, getMappedData } = require("../utils/excelValidator");

// ADD BANNER
const addBanner = async (req, res) => {
    try {
        const { category_id, status } = req.body;

        const banner_image = req.file
            ? `/uploads/banners/${req.file.filename}`
            : null;

        let banner = await bannerModel.addBanner({
            banner_image,
            category_id: category_id ? Number(category_id) : null,
            status: status !== undefined && !isNaN(status) ? Number(status) : 1,
        });

        if (banner && banner.id) {
            banner = await bannerModel.getBannerById(banner.id);
        }

        res.status(201).json({
            status: 1,
            message: "Banner added successfully",
            data: banner,
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

// GET BANNERS
const getBanners = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        const data = await bannerModel.getAllBanners(limit, offset, search);
        const total = await bannerModel.countBanners(search);

        res.json({
            status: 1,
            message: "Banners fetched successfully",
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

// UPDATE BANNER
const updateBanner = async (req, res) => {
    try {
        const { id, category_id, status } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "Banner ID is required in body",
                data: null
            });
        }

        const existingBanner = await bannerModel.getBannerById(id);
        if (!existingBanner) {
            return res.status(404).json({
                status: 0,
                message: "Banner not found",
                data: null
            });
        }

        let banner_image = existingBanner.banner_image;

        if (req.file) {
            banner_image = `/uploads/banners/${req.file.filename}`;
        } else if (req.body.banner_image === "") {
            banner_image = null;
        }

        await bannerModel.updateBanner(id, {
            banner_image,
            category_id: category_id !== undefined ? Number(category_id) : existingBanner.category_id,
            status: status !== undefined && !isNaN(status) ? Number(status) : existingBanner.status,
        });

        // Fetch upgraded banner with category_name
        const updated = await bannerModel.getBannerById(id);

        res.json({
            status: 1,
            message: "Banner updated successfully",
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

// DELETE BANNER
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "Banner ID is required in body",
                data: null
            });
        }

        await bannerModel.deleteBanner(id);
        res.json({
            status: 1,
            message: "Banner(s) deleted successfully",
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
// OLD IMPORT BANNERS FROM EXCEL
const importBanners = async (req, res) => {
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
            banner_image: ['Banner Image', 'BannerImage', 'banner_image'],
            category_id: ['Category Id', 'CategoryId', 'category_id'],
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
            const banner = await bannerModel.addBanner({
                banner_image: row.banner_image || null,
                category_id: row.category_id || null,
                status: row.status !== undefined ? Number(row.status) : 1
            });
            added.push(banner);
        }
        res.status(201).json([{
            status: 201,
            message: `${added.length} Banners imported successfully`,
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

// NEW IMPORT BANNERS FROM EXCEL (WITH IMAGE EXTRACTION)
const importBanners = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 0, message: "Excel file is required" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        const imageMap = {};
        const saveDir = path.join(__dirname, '../uploads/banners');

        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        worksheet.getImages().forEach(image => {
            const imgModel = workbook.model.media.find(m => m.index === image.imageId);
            if (!imgModel) return;

            const fileName = `${uuidv4()}.${imgModel.extension}`;
            fs.writeFileSync(path.join(saveDir, fileName), imgModel.buffer);

            const rowNumber = Math.floor(image.range.tl.row) + 1;
            imageMap[rowNumber] = `/uploads/banners/${fileName}`;
        });

        const columnMapping = {
            banner_image: ['Banner Image', 'BannerImage', 'banner_image'],
            category_name: ['Category Name', 'CategoryName', 'category_name', 'Category'],
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

            let finalImage = imageMap[rowNumber] || getData('banner_image') || null;
            if (!finalImage) continue;

            const categoryName = getData('category_name');
            let category_id = null;
            if (categoryName) {
                const category = await categoryModel.getCategoryByName(String(categoryName).trim());
                category_id = category ? category.id : null;
            }

            const banner = await bannerModel.addBanner({
                banner_image: finalImage,
                category_id,
                status: getData('status') !== undefined ? Number(getData('status')) : 1
            });
            added.push(banner);
        }

        res.json({
            status: 1,
            message: `${added.length} Banners imported successfully`,
            data: added
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 0, message: "Excel processing failed: " + error.message });
    }
};

module.exports = {
    addBanner,
    getBanners,
    updateBanner,
    deleteBanner,
    importBanners
};
