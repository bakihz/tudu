const express = require("express");
const bodyParser = require("body-parser");
const { poolPromise, sql } = require("./src/utils/db"); // Import the database connection
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await poolPromise;
    // Fetch user by username only
    const result = await pool
      .request()
      .input("UserName", sql.NVarChar, username)
      .query(
        "SELECT UserID, UserName, UserType, Password FROM Users WHERE UserName = @UserName"
      );

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      // Compare the plain password with the hashed password from DB
      const match = await bcrypt.compare(password, user.Password);
      if (match) {
        res.json({
          userId: user.UserID,
          userName: user.UserName,
          userType: user.UserType,
        });
      } else {
        res.status(401).json({ message: "Invalid username or password." });
      }
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

// Add User endpoint
app.post("/api/add-user", async (req, res) => {
  const { username, password, userType } = req.body;

  try {
    const pool = await poolPromise;
    // Check if the username already exists
    const userCheck = await pool
      .request()
      .input("UserName", sql.NVarChar, username)
      .query("SELECT * FROM Users WHERE UserName = @UserName");

    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ message: "Username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    await pool
      .request()
      .input("UserName", sql.NVarChar, username)
      .input("Password", sql.NVarChar, hashedPassword)
      .input("UserType", sql.NVarChar, userType)
      .query(
        "INSERT INTO Users (UserName, Password, UserType) VALUES (@UserName, @Password, @UserType)"
      );

    res.json({ success: true });
  } catch (error) {
    console.error("Database query failed:", error);
    res
      .status(500)
      .json({ message: "An error occurred while adding the user." });
  }
});

app.post("/api/user/update", async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    const pool = await poolPromise;

    // Check if the user exists
    const userCheck = await pool
      .request()
      .input("UserName", sql.NVarChar, username)
      .query("SELECT * FROM Users WHERE UserName = @UserName");

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = userCheck.recordset[0];

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.Password);
    if (!match) {
      return res.status(401).json({ message: "Invalid current password." });
    }

    // Update password if newPassword is provided
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool
        .request()
        .input("UserID", sql.Int, user.UserID)
        .input("Password", sql.NVarChar, hashedPassword)
        .query("UPDATE Users SET Password = @Password WHERE UserID = @UserID");
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Database query failed:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the user." });
  }
});

function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
