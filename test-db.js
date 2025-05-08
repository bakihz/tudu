const { poolPromise } = require("./db");

const testDatabaseConnection = async () => {
  try {
    const pool = await poolPromise;
    console.log("Database connection successful!");
    const result = await pool.request().query("SELECT 1 AS Test");
    console.log("Test query result:", result.recordset);
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
};

testDatabaseConnection();
