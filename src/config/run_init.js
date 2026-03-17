require("dotenv").config();
const initDatabase = require('./init_db');

(async () => {
    try {
        console.log("Running manual DB Init...");
        await initDatabase();
        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
