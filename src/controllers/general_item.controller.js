const generalItemModel = require("../models/general_item.model");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ADD GENERAL ITEM
const addGeneralItem = async (req, res) => {
    try {
        const { name, amount, discount, status } = req.body;
        const image = req.file ? `/uploads/general_items/${req.file.filename}` : null;

        const item = await generalItemModel.addGeneralItem({
            name,
            image,
            amount: amount ? Number(amount) : 0,
            discount: discount ? Number(discount) : 0,
            status: status !== undefined ? Number(status) : 1
        });

        res.status(201).json({
            status: 1,
            message: "General item added successfully",
            data: item
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET GENERAL ITEMS
const getGeneralItems = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        const data = await generalItemModel.getAllGeneralItems(limit, offset, search);
        const total = await generalItemModel.countGeneralItems(search);

        res.json({
            status: 1,
            message: "General items fetched successfully",
            total_count: total,
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE GENERAL ITEM
const updateGeneralItem = async (req, res) => {
    try {
        const { id, name, amount, discount, status } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Item ID is required" });

        const existingItem = await generalItemModel.getGeneralItemById(id);
        if (!existingItem) return res.status(404).json({ status: 0, message: "Item not found" });

        let image = existingItem.image;
        if (req.file) {
            image = `/uploads/general_items/${req.file.filename}`;
        } else if (req.body.image === "" || req.body.image === "null" || req.body.image === null) {
            image = null;
        }

        const updated = await generalItemModel.updateGeneralItem(id, {
            name: name !== undefined ? name : existingItem.name,
            image,
            amount: amount !== undefined ? Number(amount) : existingItem.amount,
            discount: discount !== undefined ? Number(discount) : existingItem.discount,
            status: status !== undefined ? Number(status) : existingItem.status
        });

        res.json({
            status: 1,
            message: "General item updated successfully",
            data: updated
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE GENERAL ITEM
const deleteGeneralItem = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Item ID(s) required" });
        await generalItemModel.deleteGeneralItem(id);
        res.json({ status: 1, message: "Item(s) deleted successfully" });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// IMPORT GENERAL ITEMS
const importGeneralItems = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 0, message: "Excel file is required" });

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];

        const saveDir = path.join(__dirname, '../uploads/general_items');
        if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

        const imageMap = {};
        worksheet.getImages().forEach(image => {
            const imgModel = workbook.model.media.find(m => m.index === image.imageId);
            if (!imgModel) return;
            const fileName = `${uuidv4()}.${imgModel.extension}`;
            fs.writeFileSync(path.join(saveDir, fileName), imgModel.buffer);
            const rowNumber = Math.floor(image.range.tl.row) + 1;
            imageMap[rowNumber] = `/uploads/general_items/${fileName}`;
        });

        const columnMapping = {
            name: ['Name', 'Item Name', 'name'],
            image: ['Image', 'Item Image', 'image'],
            amount: ['Amount', 'Price', 'amount'],
            discount: ['Discount', 'discount']
        };

        const colIndices = {};
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            const header = String(cell.value).trim().toLowerCase();
            for (const [field, aliases] of Object.entries(columnMapping)) {
                if (aliases.some(a => a.toLowerCase() === header)) colIndices[field] = colNumber;
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

            const name = getData('name');
            if (!name) continue;

            const newItem = await generalItemModel.addGeneralItem({
                name: String(name),
                image: imageMap[rowNumber] || getData('image') || null,
                amount: Number(getData('amount')) || 0,
                discount: Number(getData('discount')) || 0,
                status: 1
            });
            added.push(newItem);
        }

        res.json({ status: 1, message: `${added.length} General items imported successfully`, data: added });

    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    addGeneralItem,
    getGeneralItems,
    updateGeneralItem,
    deleteGeneralItem,
    importGeneralItems
};
