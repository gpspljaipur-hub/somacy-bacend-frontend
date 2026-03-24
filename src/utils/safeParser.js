/**
 * Safely parse a value as an array. 
 * Handles JSON strings, comma-separated strings, and single objects.
 */
const safeParseArray = (val, defaultValue = []) => {
    if (!val) return defaultValue;
    if (Array.isArray(val)) return val;
    
    try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
        // Fallback for comma-separated strings if it's not valid JSON
        if (typeof val === 'string' && val.trim() !== '') {
            // If it's something like "a,b,c"
            if (val.includes(',')) {
                return val.split(',').map(item => item.trim()).filter(item => item);
            }
            // If it's just "a"
            return [val.trim()];
        }
        return [val];
    }
};

/**
 * Safely parse a JSON string into an object.
 * Returns null or defaultValue on failure.
 */
const safeParseObject = (val, defaultValue = null) => {
    if (!val) return defaultValue;
    if (typeof val === 'object') return val;
    try {
        return JSON.parse(val);
    } catch (e) {
        return defaultValue;
    }
};

module.exports = {
    safeParseArray,
    safeParseObject
};
