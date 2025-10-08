const { pool, sql } = require("./db");

(async () => {
  try {
    const pool = await poolPromise;
    console.log("Database connection successful!");
    const result = await pool.request().query("SELECT 1 AS test");
    console.log("Test query result:", result.recordset);
  } catch (error) {
    console.error("Error testing db.js:", error);
  }
})();
