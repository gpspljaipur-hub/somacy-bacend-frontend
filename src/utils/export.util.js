const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

const cleanupOldFiles = (dir) => {
    try {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        const now = Date.now();
        const EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24 hours

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > EXPIRE_TIME) {
                fs.unlinkSync(filePath);
            }
        });
    } catch (err) {
        console.error("Cleanup error:", err);
    }
};

const exportToExcel = async (data, fileNamePrefix, req) => {
    try {
        const exportDir = path.join(__dirname, "../uploads/exports");

        // Ensure directory exists
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        // Run cleanup
        cleanupOldFiles(exportDir);

        const fileName = `${fileNamePrefix}_${Date.now()}.xlsx`;
        const filePath = path.join(exportDir, fileName);

        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        xlsx.writeFile(workbook, filePath);

        // Generate full URL
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const downloadUrl = `${baseUrl}/uploads/exports/${fileName}`;

        return downloadUrl;
    } catch (err) {
        throw new Error("Failed to generate export file: " + err.message);
    }
};

module.exports = { exportToExcel };
