const { BrowserWindow, app, ipcMain } = require("electron");
const path = require("path");
const { poolPromise, sql } = require("./db");

let win;

app.on("ready", () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: false, // Not fullscreen
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Ensure the correct path to preload.js
      contextIsolation: true, // Enable context isolation
      nodeIntegration: false, // Disable nodeIntegration for security
      enableRemoteModule: false, // Disable remote module
      sandbox: false, // Allow Node.js modules in preload
    },
  });

  win.maximize(); // <-- This will maximize the window

  win.loadFile("login.html");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    win.loadFile("login.html");
  }
});

ipcMain.handle("update-task", async (event, task) => {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("TaskID", sql.Int, task.TaskID)
      .input("TaskName", sql.NVarChar, task.TaskName)
      .input("Details", sql.NVarChar, task.Details)
      .input(
        "Deadline",
        sql.DateTime,
        task.Deadline ? new Date(task.Deadline) : null
      )
      .input("TaskType", sql.Int, task.TaskType)
      .input("IsRecurring", sql.Bit, task.IsRecurring)
      .input("UserID", sql.Int, task.UserID) // Add this line if needed
      .input("Tick", sql.Bit, task.Tick) // Add this line if needed
      .query(`
        UPDATE Tasks SET
          TaskName = @TaskName,
          Details = @Details,
          Deadline = @Deadline,
          TaskType = @TaskType,
          IsRecurring = @IsRecurring,
          Tick = @Tick
        WHERE TaskID = @TaskID
      `);
    const result = await pool.request().query(`
      SELECT 
        t.*, 
        u.UserName AS CreatorName
      FROM Tasks t
      LEFT JOIN Users u ON t.CreatorID = u.UserID
    `);
    return { success: true, result: result.recordset };
  } catch (err) {
    console.error("Error updating task:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("add-task", async (event, task) => {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("TaskName", sql.NVarChar, task.TaskName)
      .input("Details", sql.NVarChar, task.Details)
      .input(
        "Deadline",
        sql.DateTime,
        task.Deadline ? new Date(task.Deadline) : null
      )
      .input("TaskType", sql.Int, task.TaskType)
      .input("IsRecurring", sql.Bit, task.IsRecurring)
      .input("Tick", sql.Bit, task.Tick)
      .input("CreatorID", sql.Int, task.CreatorID) // <-- Make sure this is set!
      .input("UserID", sql.Int, task.UserID) // <-- Make sure this is set!
      .query(`
        INSERT INTO Tasks (TaskName, Details, Deadline, TaskType, IsRecurring, CreatorID, Tick, UserID)
        VALUES (@TaskName, @Details, @Deadline, @TaskType, @IsRecurring, @CreatorID, @Tick, @UserID)
      `);
    return { success: true };
  } catch (err) {
    console.error("Error adding task:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("get-tasks", async () => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
  SELECT
    t.TaskID,
    t.Tick,
    t.TaskName,
    t.CompletionTime,
    t.TaskType,
    t.TaskCreationDate,
    t.Deadline,
    t.Interval,
    t.IsRecurring,
    t.UserID,
    t.CreatorID,
    t.Details,
    u.UserName AS CreatorName
  FROM Tasks t
  LEFT JOIN Users u ON t.CreatorID = u.UserID
`);
    // Return the tasks with the creator's name
    return result.recordset;
  } catch (err) {
    console.error("Error loading tasks:", err);
    return [];
  }
});

ipcMain.handle("delete-task", async (event, taskId) => {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("TaskID", sql.Int, taskId)
      .query("DELETE FROM Tasks WHERE TaskID = @TaskID");
    return { success: true };
  } catch (err) {
    console.error("Error deleting task:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("get-users", async () => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT UserID, UserName FROM Users");
    return result.recordset;
  } catch (err) {
    console.error("Error loading users:", err);
    return [];
  }
});
