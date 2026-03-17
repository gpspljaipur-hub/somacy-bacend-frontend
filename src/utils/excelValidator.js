const validateColumns = (actualColumns, columnMapping) => {
    if (!actualColumns || actualColumns.length === 0) {
        return { valid: false, message: "No columns found in the uploaded file." };
    }

    const missing = [];

    // For each required field in mapping, check if ANY of its aliases exist in actual columns
    for (const [field, aliases] of Object.entries(columnMapping)) {
        const found = aliases.some(alias => actualColumns.includes(alias));
        if (!found) {
            // If strictly one alias is expected, show that. If multiple, show the first preferred one
            missing.push(aliases[0]);
        }
    }

    if (missing.length > 0) {
        return { valid: false, message: `Missing required columns: ${missing.join(', ')}` };
    }

    return { valid: true };
};

const getMappedData = (data, columnMapping) => {
    return data.map(row => {
        const mappedRow = {};
        for (const [field, aliases] of Object.entries(columnMapping)) {
            // Find the first alias that exists in the row
            const alias = aliases.find(a => row[a] !== undefined);
            mappedRow[field] = alias ? row[alias] : undefined;
        }
        return mappedRow;
    });
};

module.exports = { validateColumns, getMappedData };
