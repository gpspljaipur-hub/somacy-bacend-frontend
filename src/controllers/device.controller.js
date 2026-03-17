const deviceModel = require("../models/device.model");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ADD DEVICE
const addDevice = async (req, res) => {
    try {
        const { name, amount, is_rghs, discount, rghs_discount, status } = req.body;
        const device_image = req.file ? `/uploads/devices/${req.file.filename}` : null;

        const device = await deviceModel.addDevice({
            name,
            device_image,
            amount: amount ? Number(amount) : 0,
            is_rghs: is_rghs === 'true' || is_rghs === '1' || is_rghs === true,
            discount: discount ? Number(discount) : 0,
            rghs_discount: rghs_discount ? Number(rghs_discount) : 0,
            status: status !== undefined ? Number(status) : 1
        });

        res.status(201).json({
            status: 1,
            message: "Device added successfully",
            data: device
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// GET DEVICES
const getDevices = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        const data = await deviceModel.getAllDevices(limit, offset, search);
        const total = await deviceModel.countDevices(search);

        res.json({
            status: 1,
            message: "Devices fetched successfully",
            total_count: total,
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE DEVICE
const updateDevice = async (req, res) => {
    try {
        const { id, name, amount, is_rghs, discount, rghs_discount, status } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Device ID is required" });

        const existingDevice = await deviceModel.getDeviceById(id);
        if (!existingDevice) return res.status(404).json({ status: 0, message: "Device not found" });

        let device_image = existingDevice.device_image;
        if (req.file) {
            device_image = `/uploads/devices/${req.file.filename}`;
        }

        const updated = await deviceModel.updateDevice(id, {
            name: name !== undefined ? name : existingDevice.name,
            device_image,
            amount: amount !== undefined ? Number(amount) : existingDevice.amount,
            is_rghs: is_rghs !== undefined ? (is_rghs === 'true' || is_rghs === '1' || is_rghs === true) : existingDevice.is_rghs,
            discount: discount !== undefined ? Number(discount) : existingDevice.discount,
            rghs_discount: rghs_discount !== undefined ? Number(rghs_discount) : existingDevice.rghs_discount,
            status: status !== undefined ? Number(status) : existingDevice.status
        });

        res.json({
            status: 1,
            message: "Device updated successfully",
            data: updated
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE DEVICE
const deleteDevice = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: 0, message: "Device ID(s) required" });
        await deviceModel.deleteDevice(id);
        res.json({ status: 1, message: "Device(s) deleted successfully" });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// IMPORT DEVICES
const importDevices = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 0, message: "Excel file is required" });

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];

        const saveDir = path.join(__dirname, '../uploads/devices');
        if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

        const imageMap = {};
        worksheet.getImages().forEach(image => {
            const imgModel = workbook.model.media.find(m => m.index === image.imageId);
            if (!imgModel) return;
            const fileName = `${uuidv4()}.${imgModel.extension}`;
            fs.writeFileSync(path.join(saveDir, fileName), imgModel.buffer);
            const rowNumber = Math.floor(image.range.tl.row) + 1;
            imageMap[rowNumber] = `/uploads/devices/${fileName}`;
        });

        const columnMapping = {
            name: ['Name', 'Device Name', 'name'],
            device_image: ['Image', 'Device Image', 'device_image'],
            amount: ['Amount', 'Price', 'amount'],
            is_rghs: ['RGHS', 'Is RGHS', 'is_rghs', 'rghs/non-rghs'],
            discount: ['Discount', 'discount'],
            rghs_discount: ['RGHS Discount', 'rghs_discount']
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

            const isRghsVal = getData('is_rghs');
            const is_rghs = isRghsVal === 'true' || isRghsVal === '1' || String(isRghsVal).toLowerCase() === 'rghs' || isRghsVal === true;

            const device = await deviceModel.addDevice({
                name: String(name),
                device_image: imageMap[rowNumber] || getData('device_image') || null,
                amount: Number(getData('amount')) || 0,
                is_rghs,
                discount: Number(getData('discount')) || 0,
                rghs_discount: Number(getData('rghs_discount')) || 0,
                status: 1
            });
            added.push(device);
        }

        res.json({ status: 1, message: `${added.length} Devices imported successfully`, data: added });

    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    addDevice,
    getDevices,
    updateDevice,
    deleteDevice,
    importDevices
};
