const { poolPromise, sql } = require("./db");
const { hashPassword, comparePassword } = require("./auth");

const addUser = async (username, userType, plainPassword) => {
  try {
    const hashedPassword = await hashPassword(plainPassword);

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

// To hash a password before saving:
// const hashed = await hashPassword("userpassword");

// To check a password during login:
// const isMatch = await comparePassword("inputpassword", hashed);
