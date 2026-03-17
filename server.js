require("dotenv").config();
const app = require("./src/app");

// initialize DB connection
const initDatabase = require("./src/config/init_db");

const PORT = process.env.PORT || 5001;

// Start Server after DB Init
(async () => {
  await initDatabase();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Somacy server running on port ${PORT}`);
  });
})();
