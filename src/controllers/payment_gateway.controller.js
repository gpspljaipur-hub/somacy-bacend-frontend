const paymentGatewayModel = require("../models/payment_gateway.model");
const xlsx = require("xlsx");
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { validateColumns, getMappedData } = require("../utils/excelValidator");

// ADD PAYMENT GATEWAY
const addPaymentGateway = async (req, res) => {
    try {
        const { gateway_name, status } = req.body;

        const gateway_image = req.file
            ? `/uploads/payment_gateways/${req.file.filename}`
            : null;

        const gateway = await paymentGatewayModel.addPaymentGateway({
            gateway_name,
            gateway_image,
            status: status !== undefined && !isNaN(status) ? Number(status) : 1,
        });

        res.status(201).json({
            status: 1,
            message: "Payment Gateway added successfully",
            data: gateway,
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

// GET PAYMENT GATEWAY LIST
const getPaymentGateways = async (req, res) => {
    try {
        const page = parseInt(req.body.page) || 1;
        const limit = parseInt(req.body.limit) || 20;
        const search = req.body.search || '';
        const offset = (page - 1) * limit;

        const data = await paymentGatewayModel.getAllPaymentGateways(limit, offset, search);
        const total = await paymentGatewayModel.countPaymentGateways(search);

        res.json({
            status: 1,
            message: "Payment Gateways fetched successfully",
            total_count: total,
            data: data,
        });
    } catch (err) {
        res.status(500).json({
            status: 0,
            message: err.message,
            data: null
        });
    }
};

// UPDATE PAYMENT GATEWAY
const updatePaymentGateway = async (req, res) => {
    try {
        const { id, gateway_name, status } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "Payment Gateway ID is required in body",
                data: null
            });
        }

        const existingGateway = await paymentGatewayModel.getPaymentGatewayById(id);
        if (!existingGateway) {
            return res.status(404).json({
                status: 0,
                message: "Payment Gateway not found",
                data: null
            });
        }

        let gateway_image = existingGateway.gateway_image;

        if (req.file) {
            gateway_image = `/uploads/payment_gateways/${req.file.filename}`;
        } else if (req.body.gateway_image === "" || req.body.gateway_image === "null" || req.body.remove_gateway_image === "true") {
            gateway_image = null;
        }

        const updated = await paymentGatewayModel.updatePaymentGateway(id, {
            gateway_name: (gateway_name && gateway_name.trim()) ? gateway_name : existingGateway.gateway_name,
            gateway_image,
            status: (status !== undefined && status !== "") ? Number(status) : existingGateway.status,
        });

        res.json({
            status: 1,
            message: "Payment Gateway updated successfully",
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

// DELETE PAYMENT GATEWAY
const deletePaymentGateway = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                status: 0,
                message: "Payment Gateway ID is required in body",
                data: null
            });
        }

        await paymentGatewayModel.deletePaymentGateway(id);
        res.json({
            status: 1,
            message: "Payment Gateway(s) deleted successfully",
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
// OLD IMPORT PAYMENT GATEWAYS FROM EXCEL
const importPaymentGateways = async (req, res) => {
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
            gateway_name: ['Gateway Name', 'GatewayName', 'gateway_name'],
            gateway_image: ['Gateway Image', 'GatewayImage', 'gateway_image'],
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

        const addedGateways = [];
        for (const row of mappedData) {
            const gateway = await paymentGatewayModel.addPaymentGateway({
                gateway_name: row.gateway_name || null,
                gateway_image: row.gateway_image || null,
                status: row.status !== undefined ? Number(row.status) : 1
            });
            addedGateways.push(gateway);
        }

        res.status(201).json([{
            status: 201,
            message: `${addedGateways.length} Payment Gateways imported successfully`,
            data: addedGateways
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

// NEW IMPORT PAYMENT GATEWAYS FROM EXCEL (WITH IMAGE EXTRACTION)
const importPaymentGateways = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 0, message: "Excel file is required" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];
        const imageMap = {};
        const saveDir = path.join(__dirname, '../uploads/payment_gateways');

        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        worksheet.getImages().forEach(image => {
            const imgModel = workbook.model.media.find(m => m.index === image.imageId);
            if (!imgModel) return;

            const fileName = `${uuidv4()}.${imgModel.extension}`;
            fs.writeFileSync(path.join(saveDir, fileName), imgModel.buffer);

            const rowNumber = Math.floor(image.range.tl.row) + 1;
            imageMap[rowNumber] = `/uploads/payment_gateways/${fileName}`;
        });

        const columnMapping = {
            gateway_name: ['Gateway Name', 'GatewayName', 'gateway_name', 'Gateway'],
            gateway_image: ['Gateway Image', 'GatewayImage', 'gateway_image'],
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

            const name = getData('gateway_name');
            if (!name) continue;

            let finalImage = imageMap[rowNumber] || getData('gateway_image') || null;

            const gateway = await paymentGatewayModel.addPaymentGateway({
                gateway_name: String(name),
                gateway_image: finalImage,
                status: getData('status') !== undefined ? Number(getData('status')) : 1
            });
            added.push(gateway);
        }

        res.json({
            status: 1,
            message: `${added.length} Payment gateways imported successfully`,
            data: added
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 0, message: "Excel processing failed: " + error.message });
    }
};

module.exports = {
    addPaymentGateway,
    getPaymentGateways,
    updatePaymentGateway,
    deletePaymentGateway,
    importPaymentGateways
};
