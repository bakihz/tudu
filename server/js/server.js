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
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("UserName", sql.NVarChar, username)
      .input("Password", sql.NVarChar, password)
      .query(
        "SELECT UserID, UserName, UserType FROM Users WHERE UserName = @UserName AND Password = @Password"
      );

    if (result.recordset.length > 0) {
      // User found
      const user = result.recordset[0];
      res.json({
        userId: user.UserID, // <-- Make sure this is included
        userName: user.UserName,
        userType: user.UserType,
      });
    } else {
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
  const { userId } = req.body; // userId from the request

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("UserID", sql.Int, userId)
      .query("SELECT * FROM Tasks WHERE CreatorID = @UserID");

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
