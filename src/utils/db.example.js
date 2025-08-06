const sql = require("mssql");

// Database configuration
const config = {
  user: "your_username", // Replace with your SQL Server username
  password: "your_password", // Replace with your SQL Server password
  server: "your_server_ip", // Replace with your SQL Server hostname or IP
  database: "your_database", // Replace with your database name
  port: 1433, // Default SQL Server port
  options: {
    encrypt: false, // Use encryption if required
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
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
};
