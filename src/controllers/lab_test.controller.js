const labTestModel = require("../models/lab_test.model");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// ADD LAB TEST
// const addLabTest = async (req, res) => {
//   try {
//     const {
//       lab_category, // <-- add this
//       test_name,
//       package_name,
//       amount,
//       discount,
//       rghs_discount,
//       is_rghs,
//       description,
//       lab_test_type,
//       status,
//       test_ids,
//     } = req.body;
//     const image = req.file ? `/uploads/lab_tests/${req.file.filename}` : null;

//     let parsedTestIds = test_ids;
//     if (typeof test_ids === "string") {
//       try {
//         parsedTestIds = JSON.parse(test_ids);
//       } catch (e) {
//         // If it's a comma separated string
//         parsedTestIds = test_ids
//           .split(",")
//           .map((id) => id.trim())
//           .filter((id) => id);
//       }
//     }

//     const labTest = await labTestModel.addLabTest({
//       lab_category,
//       test_name: lab_test_type === "Singular" ? test_name : null,
//       package_name: lab_test_type === "Combo" ? package_name : null,
//       amount: amount ? Number(amount) : 0,
//       discount: discount ? Number(discount) : 0,
//       rghs_discount: rghs_discount ? Number(rghs_discount) : 0,
//       is_rghs:
//         is_rghs === "true" ||
//         is_rghs === "1" ||
//         is_rghs === "Yes" ||
//         is_rghs === true,
//       description,
//       image,
//       lab_test_type: lab_test_type || "Singular",
//       status: status !== undefined ? Number(status) : 1,
//       test_ids: Array.isArray(parsedTestIds) ? parsedTestIds : [],
//     });

//     res.status(201).json({
//       status: 1,
//       message: "Lab test added successfully",
//       data: labTest,
//     });
//   } catch (err) {
//     res.status(500).json({ status: 0, message: err.message });
//   }
// }

const addLabTest = async (req, res) => {
  try {
    const {
      lab_category,
      test_name,
      package_name,
      amount,
      discount,
      rghs_discount,
      is_rghs,
      description,
      lab_test_type,
      status,
      test_ids,
    } = req.body;

    const image = req.file ? `/uploads/lab_tests/${req.file.filename}` : null;

    let parsedTestIds = test_ids;

    if (typeof test_ids === "string") {
      try {
        parsedTestIds = JSON.parse(test_ids);
      } catch {
        parsedTestIds = test_ids
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id);
      }
    }

    parsedTestIds = Array.isArray(parsedTestIds)
      ? parsedTestIds.map((id) => Number(id))
      : [];

    const labTest = await labTestModel.addLabTest({
      lab_category,
      test_name: lab_test_type === "Singular" ? test_name : null,
      package_name: lab_test_type === "Combo" ? package_name : null,
      amount: amount ? Number(amount) : 0,
      discount: discount ? Number(discount) : 0,
      rghs_discount: rghs_discount ? Number(rghs_discount) : 0,
      is_rghs:
        is_rghs === "true" ||
        is_rghs === "1" ||
        is_rghs === "Yes" ||
        is_rghs === true,
      description,
      image,
      lab_test_type: lab_test_type || "Singular",
      status: status !== undefined ? Number(status) : 1,
      test_ids: parsedTestIds,
    });

    res.status(201).json({
      status: 1,
      message: "Lab test added successfully",
      data: labTest,
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: err.message,
    });
  }
};

// GET LAB TESTS
const getLabTests = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 20;
    const search = req.body.search || "";
    const type = req.body.type || null; // singular or combo
    const offset = (page - 1) * limit;

    const data = await labTestModel.getAllLabTests(limit, offset, search, type);
    const total = await labTestModel.countLabTests(search, type);

    res.json({
      status: 1,
      message: "Lab tests fetched successfully",
      total_count: total,
      data: data,
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

// UPDATE LAB TEST
const updateLabTest = async (req, res) => {
  try {
    const {
      id,
      test_name,
      package_name,
      amount,
      discount,
      rghs_discount,
      is_rghs,
      description,
      lab_test_type,
      status,
      test_ids,
    } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ status: 0, message: "Lab test ID is required" });
    }

    const existing = await labTestModel.getLabTestById(id);
    if (!existing) {
      return res.status(404).json({ status: 0, message: "Lab test not found" });
    }

    let image = existing.image;
    if (req.file) {
      image = `/uploads/lab_tests/${req.file.filename}`;
    } else if (
      req.body.image === "" ||
      req.body.image === "null" ||
      req.body.image === null
    ) {
      image = null;
    }

    let parsedTestIds = test_ids;
    if (typeof test_ids === "string") {
      try {
        parsedTestIds = JSON.parse(test_ids);
      } catch (e) {
        parsedTestIds = test_ids
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id);
      }
    }

    const targetType =
      lab_test_type !== undefined ? lab_test_type : existing.lab_test_type;
    const updated = await labTestModel.updateLabTest(id, {
      test_name:
        targetType === "Singular"
          ? test_name !== undefined
            ? test_name
            : existing.test_name
          : null,
      package_name:
        targetType === "Combo"
          ? package_name !== undefined
            ? package_name
            : existing.package_name
          : null,
      amount: amount !== undefined ? Number(amount) : existing.amount,
      discount: discount !== undefined ? Number(discount) : existing.discount,
      rghs_discount:
        rghs_discount !== undefined
          ? Number(rghs_discount)
          : existing.rghs_discount,
      is_rghs:
        is_rghs !== undefined
          ? is_rghs === "true" ||
            is_rghs === "1" ||
            is_rghs === "Yes" ||
            is_rghs === true
          : existing.is_rghs,
      description:
        description !== undefined ? description : existing.description,
      image,
      lab_test_type:
        lab_test_type !== undefined ? lab_test_type : existing.lab_test_type,
      status: status !== undefined ? Number(status) : existing.status,
      test_ids:
        parsedTestIds !== undefined
          ? Array.isArray(parsedTestIds)
            ? parsedTestIds
            : []
          : undefined,
    });

    res.json({
      status: 1,
      message: "Lab test updated successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

// DELETE LAB TEST
const deleteLabTest = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res
        .status(400)
        .json({ status: 0, message: "Lab test ID is required" });
    }
    await labTestModel.deleteLabTest(id);
    res.json({
      status: 1,
      message: "Lab test(s) deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: err.message });
  }
};

// IMPORT LAB TESTS FROM EXCEL
const importLabTests = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: 0, message: "Excel file is required" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    const columnMapping = {
      test_name: ["Test Name", "TestName", "test_name", "Test"],
      package_name: ["Package Name", "PackageName", "package_name", "Package"],
      amount: ["Amount", "Price", "Rate", "amount"],
      discount: ["Discount", "discount"],
      rghs_discount: ["RGHS Discount", "RGHSDiscount", "rghs_discount"],
      is_rghs: ["Is RGHS", "IsRGHS", "is_rghs", "RGHS"],
      description: ["Description", "description"],
      image: ["Image", "Test Image", "image"],
      lab_test_type: ["Type", "Test Type", "lab_test_type", "lab test type"],
      status: ["Status", "status"],
    };

    const saveDir = path.join(__dirname, "../uploads/lab_tests");
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir, { recursive: true });

    const imageMap = {};
    worksheet.getImages().forEach((img) => {
      const imgModel = workbook.model.media.find(
        (m) => m.index === img.imageId,
      );
      if (!imgModel) return;
      const fileName = `${uuidv4()}.${imgModel.extension}`;
      fs.writeFileSync(path.join(saveDir, fileName), imgModel.buffer);
      const rowNumber = Math.floor(img.range.tl.row) + 1;
      imageMap[rowNumber] = `/uploads/lab_tests/${fileName}`;
    });

    const headerRow = worksheet.getRow(1);
    const colIndices = {};
    headerRow.eachCell((cell, colNumber) => {
      const headerText = cell.value ? String(cell.value).trim() : "";
      for (const [field, aliases] of Object.entries(columnMapping)) {
        if (
          aliases.some(
            (alias) => alias.toLowerCase() === headerText.toLowerCase(),
          )
        ) {
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
        return val && typeof val === "object"
          ? val.result || val.text || JSON.stringify(val)
          : val;
      };

      const testName = getData("test_name");
      const packageName = getData("package_name");
      const typeVal = getData("lab_test_type") || "Singular";

      if (typeVal === "Singular" && !testName) continue;
      if (typeVal === "Combo" && !packageName) continue;

      const isRghsVal = getData("is_rghs");
      const is_rghs =
        isRghsVal === "true" ||
        isRghsVal === 1 ||
        isRghsVal === true ||
        isRghsVal === "Yes" ||
        isRghsVal === "TRUE";

      const labTest = await labTestModel.addLabTest({
        test_name: typeVal === "Singular" ? String(testName) : null,
        package_name: typeVal === "Combo" ? String(packageName) : null,
        amount: Number(getData("amount")) || 0,
        discount: Number(getData("discount")) || 0,
        rghs_discount: Number(getData("rghs_discount")) || 0,
        is_rghs,
        description: getData("description")
          ? String(getData("description"))
          : null,
        image: imageMap[rowNumber] || getData("image") || null,
        lab_test_type: typeVal,
        status: getData("status") !== undefined ? Number(getData("status")) : 1,
      });
      added.push(labTest);
    }

    res.json({
      status: 1,
      message: `${added.length} Lab tests imported successfully`,
      data: added,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      message: "Excel processing failed: " + error.message,
    });
  }
};

module.exports = {
  addLabTest,
  getLabTests,
  updateLabTest,
  deleteLabTest,
  importLabTests,
};
