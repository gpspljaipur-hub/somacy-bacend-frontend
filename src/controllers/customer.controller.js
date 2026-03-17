const customerModel = require("../models/customer.model");
const xlsx = require("xlsx");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require("path");


// GET CUSTOMER LIST
const getCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.body;
        const offset = (page - 1) * limit;

        const data = await customerModel.getAllCustomers(limit, offset, search);
        const total = await customerModel.countCustomers(search);

        res.status(200).json({
            status: 1,
            message: "Customers fetched successfully",
            total_count: total,
            data: data
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// UPDATE CUSTOMER
const updateCustomer = async (req, res) => {
    try {
        const { id, name, email, mobile, total_orders, status, address } = req.body;

        if (!id) {
            return res.status(400).json({ status: 0, message: "Customer ID is required" });
        }

        const existingCustomer = await customerModel.getCustomerById(id);
        if (!existingCustomer) {
            return res.status(404).json({ status: 0, message: "Customer not found" });
        }

        const updated = await customerModel.updateCustomer(id, {
            name: name !== undefined ? name : existingCustomer.name,
            email: email !== undefined ? email : existingCustomer.email,
            mobile: mobile !== undefined ? mobile : existingCustomer.mobile,
            total_orders: total_orders !== undefined ? Number(total_orders) : existingCustomer.total_orders,
            status: status !== undefined ? Number(status) : existingCustomer.status,
            address: address !== undefined ? address : existingCustomer.address,
        });

        res.status(200).json({
            status: 1,
            message: "Customer updated successfully",
            data: updated,
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// DELETE CUSTOMER
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ status: 0, message: "Customer ID(s) required in body" });
        }

        await customerModel.deleteCustomer(id);
        res.status(200).json({
            status: 1,
            message: "Customer(s) deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

// ADD CUSTOMER
const addCustomer = async (req, res) => {
    try {
        const { name, email, mobile, total_orders, status, address } = req.body;
        const customer = await customerModel.addCustomer({
            name,
            email,
            mobile,
            address,
            total_orders: total_orders ? Number(total_orders) : 0,
            status: status ? Number(status) : 1
        });
        res.status(201).json({
            status: 1,
            message: "Customer added successfully",
            data: customer
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

/*
// OLD IMPORT CUSTOMERS FROM EXCEL
const importCustomers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 0, message: "Excel file is required" });
        }
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const headers = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];
        const columnMapping = {
            name: ['Name', 'name', 'Customer Name', 'CustomerName'],
            email: ['Email', 'email'],
            mobile: ['Mobile', 'mobile'],
            address: ['Address', 'address', 'Customer Address'],
            total_orders: ['Total Orders', 'TotalOrders', 'total_orders'],
            status: ['Status', 'status']
        };

        const validation = validateColumns(headers, columnMapping);
        if (!validation.valid) {
            return res.status(400).json({ status: 0, message: validation.message });
        }

        const rawData = xlsx.utils.sheet_to_json(sheet);
        const mappedData = getMappedData(rawData, columnMapping);

        const added = [];
        for (const row of mappedData) {
            const customer = await customerModel.addCustomer({
                name: row.name || null,
                email: row.email || null,
                mobile: row.mobile || null,
                address: row.address || null,
                total_orders: row.total_orders || 0,
                status: row.status !== undefined ? Number(row.status) : 1
            });
            added.push(customer);
        }
        res.status(201).json({
            status: 1,
            message: `${added.length} Customers imported successfully`,
            data: added
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};
*/

// NEW IMPORT CUSTOMERS FROM EXCEL
const importCustomers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 0, message: "Excel file is required" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        const columnMapping = {
            name: ['Name', 'name', 'Customer Name', 'CustomerName'],
            email: ['Email', 'email'],
            mobile: ['Mobile', 'mobile', 'Phone'],
            address: ['Address', 'address'],
            total_orders: ['Total Orders', 'TotalOrders', 'total_orders', 'Orders'],
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

            const customer = await customerModel.addCustomer({
                name: String(name),
                email: getData('email') ? String(getData('email')) : null,
                mobile: getData('mobile') ? String(getData('mobile')) : null,
                address: getData('address') ? String(getData('address')) : null,
                total_orders: Number(getData('total_orders')) || 0,
                status: getData('status') !== undefined ? Number(getData('status')) : 1
            });
            added.push(customer);
        }

        res.json({
            status: 1,
            message: `${added.length} Customers imported successfully`,
            data: added
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 0, message: "Excel processing failed: " + error.message });
    }
};

// GET CUSTOMER ADDRESSES
const getAddresses = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ status: 0, message: "Customer ID is required" });
        }

        const addresses = await customerModel.getCustomerAddresses(id);
        res.status(200).json({
            status: 1,
            message: "Addresses fetched successfully",
            data: addresses
        });
    } catch (err) {
        res.status(500).json({ status: 0, message: err.message });
    }
};

module.exports = {
    getCustomers,
    updateCustomer,
    deleteCustomer,
    addCustomer,
    importCustomers,
    getAddresses
};
