const deliveryBoyModel = require("../models/delivery_boy.model");
const xlsx = require("xlsx");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { validateColumns, getMappedData } = require("../utils/excelValidator");

// ADD DELIVERY BOY
const addDeliveryBoy = async (req, res) => {
    try {
        const { name, mobile, email, commission_percentage, address, status } = req.body;

        const deliveryBoy = await deliveryBoyModel.addDeliveryBoy({
            name,
            mobile,
            email,
            commission_percentage: commission_percentage ? Number(commission_percentage) : 0,
            address,
            status: status !== undefined && !isNaN(status) ? Number(status) : 1,
        });

        res.status(201).json([{
            status: 201,
            message: "Delivery boy added successfully",
            data: deliveryBoy,
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

// GET DELIVERY BOY LIST
const getDeliveryBoys = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        const data = await deliveryBoyModel.getAllDeliveryBoys(limit, offset, search);
        const total = await deliveryBoyModel.countDeliveryBoys(search);
        res.json([{
            status: 200,
            message: "Delivery boys fetched successfully",
            total_count: total,
            data: data
        }]);
    } catch (err) {
        res.status(500).json([{
            status: 500,
            message: err.message,
            data: null
        }]);
    }
};

// UPDATE DELIVERY BOY
const updateDeliveryBoy = async (req, res) => {
    try {
        const { id, name, mobile, email, commission_percentage, address, status } = req.body;

        if (!id) {
            return res.status(400).json([{
                status: 400,
                message: "Delivery Boy ID is required in body",
                data: null
            }]);
        }

        const existingDeliveryBoy = await deliveryBoyModel.getDeliveryBoyById(id);
        if (!existingDeliveryBoy) {
            return res.status(404).json([{
                status: 404,
                message: "Delivery boy not found",
                data: null
            }]);
        }

        const updated = await deliveryBoyModel.updateDeliveryBoy(id, {
            name: name !== undefined ? name : existingDeliveryBoy.name,
            mobile: mobile !== undefined ? mobile : existingDeliveryBoy.mobile,
            email: email !== undefined ? email : existingDeliveryBoy.email,
            commission_percentage: commission_percentage !== undefined ? Number(commission_percentage) : existingDeliveryBoy.commission_percentage,
            address: address !== undefined ? address : existingDeliveryBoy.address,
            status: status !== undefined ? Number(status) : existingDeliveryBoy.status,
        });

        res.json([{
            status: 200,
            message: "Delivery boy updated successfully",
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

// DELETE DELIVERY BOY
const deleteDeliveryBoy = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json([{
                status: 400,
                message: "Delivery Boy ID is required in body",
                data: null
            }]);
        }

        await deliveryBoyModel.deleteDeliveryBoy(id);
        res.json([{
            status: 200,
            message: "Delivery boy(s) deleted successfully",
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
// OLD IMPORT DELIVERY BOYS FROM EXCEL
const importDeliveryBoys = async (req, res) => {
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
            name: ['Name', 'name'],
            mobile: ['Mobile', 'mobile'],
            email: ['Email', 'email'],
            commission_percentage: ['Commission Percentage', 'CommissionPercentage', 'commission_percentage'],
            address: ['Address', 'address'],
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
            const db = await deliveryBoyModel.addDeliveryBoy({
                name: row.name || null,
                mobile: row.mobile || null,
                email: row.email || null,
                commission_percentage: row.commission_percentage || 0,
                address: row.address || null,
                status: row.status !== undefined ? Number(row.status) : 1
            });
            added.push(db);
        }
        res.status(201).json([{
            status: 201,
            message: `${added.length} Delivery boys imported successfully`,
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

// NEW IMPORT DELIVERY BOYS FROM EXCEL
const importDeliveryBoys = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 0, message: "Excel file is required" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        const columnMapping = {
            name: ['Name', 'name', 'Delivery Boy Name'],
            mobile: ['Mobile', 'mobile', 'Phone'],
            email: ['Email', 'email'],
            commission_percentage: ['Commission Percentage', 'CommissionPercentage', 'commission_percentage', 'Commission'],
            address: ['Address', 'address'],
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

            const name = getData('name');
            if (!name) continue;

            const db = await deliveryBoyModel.addDeliveryBoy({
                name: String(name),
                mobile: getData('mobile') ? String(getData('mobile')) : null,
                email: getData('email') ? String(getData('email')) : null,
                commission_percentage: Number(getData('commission_percentage')) || 0,
                address: getData('address') ? String(getData('address')) : null,
                status: getData('status') !== undefined ? Number(getData('status')) : 1
            });
            added.push(db);
        }

        res.json({
            status: 1,
            message: `${added.length} Delivery boys imported successfully`,
            data: added
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 0, message: "Excel processing failed: " + error.message });
    }
};

module.exports = {
    addDeliveryBoy,
    getDeliveryBoys,
    updateDeliveryBoy,
    deleteDeliveryBoy,
    importDeliveryBoys
};
