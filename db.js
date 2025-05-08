const sql = require("mssql");

// Database configuration
const config = {
  user: "tudu", // Replace with your SQL Server username
  password: "Yakamoz57", // Replace with your SQL Server password
  server: "SERVER", // Replace with your SQL Server hostname or IP
  database: "tuduDB", // Replace with your database name
  port: 1433, // Default SQL Server port
  options: {
    encrypt: true, // Use encryption if required
    trustServerCertificate: true, // Set to true if using a self-signed certificate
  },
};

// Connect to the database
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("Database connection failed:", config.server, err);
    console.error("Error details:", err.originalError);
    console.error("Error code:", err.code);
    console.error("Error number:", err.number);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
};
