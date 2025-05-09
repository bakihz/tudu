const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("./db");

const addUser = async (username, userType, plainPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const pool = await poolPromise;
    await pool
      .request()
      .input("UserId", sql.NVarChar, username)
      .input("UserType", sql.NVarChar, userType)
      .input("Password", sql.NVarChar, hashedPassword)
      .query(
        "INSERT INTO Users (UserId, UserType, Password) VALUES (@UserId, @UserType, @Password)"
      );

    console.log(`User ${username} added successfully.`);
  } catch (error) {
    console.error("Error adding user:", error);
  }
};

// Example usage
addUser("admin", "admin", "admin123");
addUser("user", "user", "user123");
