require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const { poolPromise, sql } = require("./src/utils/db"); // Import the database connection
const bcrypt = require("bcryptjs");
const logger = require("./src/utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");

  // CSP header for development
  res.header(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://localhost:* ws://localhost:*; script-src 'self' 'unsafe-eval'; style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; font-src 'self' https://cdn.jsdelivr.net; img-src 'self' data:"
  );

  next();
});

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files
app.use(express.static("public"));
app.use("/src", express.static("src"));

// Login endpoint
app.post("/api/login", authLimiter, async (req, res) => {
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

// Stock Report endpoint
app.post("/api/stock-report", async (req, res) => {
  const { year = 2025, months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] } =
    req.body;

  const stockQuery = `
    SELECT * FROM
    (
    SELECT ITM.CODE AS KOD, ITM.NAME AS AÇIKLAMA, ITM.STGRPCODE AS GRUP,ITM.CYPHCODE AS [Y.KODU],ITM.SPECODE AS [Ö.KOD],ITM.SPECODE2 AS [Ö.KOD-2],ITM.SPECODE3 AS [Ö.KOD-3], ITM.SPECODE4 AS [Ö.KOD-4], ITM.SPECODE5 AS [Ö.KOD-5],
    (SELECT DESCR FROM LG_010_MARK WHERE LOGICALREF=ITM.MARKREF) AS [MARKA],
    A.YEAR_ AS YIL, A.AY,A.MONTH_, 
    (SELECT CODE FROM LG_010_UNITSETL WHERE UNITSETREF=ITM.UNITSETREF AND MAINUNIT=1) AS "A.BİRİM" 
    ,A.SATIS, A.ALIM 
    ,(SELECT ROUND(ONHAND,2) FROM LV_010_01_GNTOTST WHERE STOCKREF=ITM.LOGICALREF AND INVENNO=-1) AS "FİİLİ STOK"
    ,(SELECT ROUND(ACTSORDER,2) FROM LV_010_01_GNTOTST WHERE STOCKREF=ITM.LOGICALREF AND INVENNO=-1) AS "BEKLEYEN SİP."
    ,(SELECT TOP(1) PRICE FROM LG_010_PRCLIST WHERE CARDREF=ITM.LOGICALREF AND ACTIVE=0 AND PTYPE=1) AS "ALIŞ FİY."
    ,(SELECT TOP(1) PRICE FROM LG_010_PRCLIST WHERE CARDREF=ITM.LOGICALREF AND ACTIVE=0 AND PTYPE=2) AS "SATIŞ FİY."

    FROM LG_010_ITEMS ITM , 
    (SELECT [STOCKREF]
          ,MONTH_
          ,CASE MONTH_ 
    WHEN 1 THEN '01-Ocak'
    when 2 then '02-Şubat'
    when 3 then '03-Mart'
    when 4 then '04-Nisan'
    when 5 then '05-Mayıs'
    when 6 then '06-Haziran'
    when 7 then '07-Temmuz'
    when 8 then '08-Ağustos'
    when 9 then '09-Eylül'
    when 10 then '10-Ekim'
    when 11 then '11-Kasım'
    when 12 then '12-Aralık' end AS AY
          ,SUM([SALES_AMOUNT]) AS SATIS
          ,SUM([SALES_RETAMNT]) AS SIADE
          ,SUM([PURCHASES_AMOUNT]) AS ALIM
          ,SUM([PURCHASES_RETAMNT]) AS AIADE
          ,[YEAR_]  
     FROM [LV_010_01_STINVENS] WHERE MTRLINC<>1 AND INVENNO=-1 
     GROUP BY STOCKREF, YEAR_,MONTH_ ) AS A
     WHERE A.STOCKREF=ITM.LOGICALREF
    ) AS DYNMQRY
    WHERE
    (DYNMQRY.MONTH_ IN (${months.join(",")}))
    AND (DYNMQRY.[YIL] = @year)
    ORDER BY DYNMQRY.[KOD] ASC, DYNMQRY.[AÇIKLAMA] ASC, DYNMQRY.[GRUP] ASC, DYNMQRY.[Ö.KOD] ASC, DYNMQRY.[Ö.KOD-2] ASC, DYNMQRY.[Ö.KOD-3] ASC
  `;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("year", sql.Int, year)
      .query(stockQuery);

    res.json({
      success: true,
      data: result.recordset,
      columns: Object.keys(result.recordset[0] || {}),
      count: result.recordset.length,
    });
  } catch (error) {
    console.error("Stock report query failed:", error);
    res.status(500).json({
      success: false,
      message: "Stok raporu alınırken hata oluştu.",
      error: error.message,
    });
  }
});

// Get all users endpoint (for admin)
app.get("/api/users", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT UserID, UserName, UserType FROM Users ORDER BY UserName");

    res.json({
      success: true,
      users: result.recordset,
    });
  } catch (error) {
    console.error("Database query failed:", error);
    res.status(500).json({
      success: false,
      message: "Kullanıcılar alınırken hata oluştu.",
    });
  }
});

// Admin change password endpoint
app.post("/api/admin/change-password", async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    const pool = await poolPromise;

    // Check if the user exists
    const userCheck = await pool
      .request()
      .input("UserID", sql.Int, userId)
      .query("SELECT UserID, UserName FROM Users WHERE UserID = @UserID");

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await pool
      .request()
      .input("UserID", sql.Int, userId)
      .input("Password", sql.NVarChar, hashedPassword)
      .query("UPDATE Users SET Password = @Password WHERE UserID = @UserID");

    res.json({
      success: true,
      message: "Şifre başarıyla değiştirildi.",
    });
  } catch (error) {
    console.error("Database query failed:", error);
    res.status(500).json({
      success: false,
      message: "Şifre değiştirilemedi.",
    });
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

// Start the server
startServer();

module.exports = { startServer };
