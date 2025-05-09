const express = require("express");
const bodyParser = require("body-parser");
const { poolPromise, sql } = require("./db"); // Import the database connection

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Get a connection from the pool
    const pool = await poolPromise;

    // Query the database for the user
    const result = await pool
      .request()
      .input("UserId", sql.NVarChar, username) // Use 'UserId' instead of 'username'
      .input("Password", sql.NVarChar, password) // Use 'Password' instead of 'password'
      .query(
        "SELECT UserType FROM Users WHERE UserId = @UserId AND Password = @Password"
      );

    if (result.recordset.length > 0) {
      // User found
      res.json({ userType: result.recordset[0].UserType });
    } else {
      // User not found
      res.status(401).json({ message: "Invalid username or password." });
    }
  } catch (error) {
    console.error("Database query failed:", error);
    res
      .status(500)
      .json({ message: "An error occurred. Please try again later." });
  }
});

// Tasks endpoint
app.post("/api/tasks", async (req, res) => {
  const { userId } = req.body; // Replace 'userId' with the actual user ID from the request

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("UserID", sql.Int, userId)
      .query("SELECT * FROM Tasks WHERE UserID = @UserID");

    res.json(result.recordset);
  } catch (error) {
    console.error("Database query failed:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching tasks." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
