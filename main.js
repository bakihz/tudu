const { BrowserWindow, app, ipcMain } = require("electron");
const path = require("path");
const { poolPromise, sql } = require("./db");

let win;

app.on("ready", () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Ensure the correct path to preload.js
      contextIsolation: true, // Enable context isolation
      nodeIntegration: false, // Disable nodeIntegration for security
      enableRemoteModule: false, // Disable remote module
      sandbox: false, // Allow Node.js modules in preload
    },
  });

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
    await pool.request()
      .input("TaskID", sql.Int, task.TaskID)
      .input("Name", sql.NVarChar, task.Name)
      .input("Details", sql.NVarChar, task.Details)
      .input("Deadline", sql.DateTime, task.Deadline ? new Date(task.Deadline) : null)
      .input("TaskType", sql.Int, task.TaskType)
      .input("IsRecurring", sql.Bit, task.IsRecurring)
      // Add other fields as needed
      .query(`
        UPDATE Tasks SET
          Name = @Name,
          Details = @Details,
          Deadline = @Deadline,
          TaskType = @TaskType,
          IsRecurring = @IsRecurring
        WHERE TaskID = @TaskID
      `);
    const result = await pool.request().query(`
      SELECT 
        t.*, 
        u.Name AS CreatorName
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
    await pool.request()
      .input("Name", sql.NVarChar, task.name)
      .input("Details", sql.NVarChar, task.details)
      .input("Deadline", sql.DateTime, task.deadline ? new Date(task.deadline) : null)
      .input("TaskType", sql.Int, task.taskType)
      .input("IsRecurring", sql.Bit, task.isRecurring)
      .input("CreatorID", sql.Int, task.creator) // <-- Make sure this is set!
      // Add other fields as needed
      .query(`
        INSERT INTO Tasks (Name, Details, Deadline, TaskType, IsRecurring, CreatorID)
        VALUES (@Name, @Details, @Deadline, @TaskType, @IsRecurring, @CreatorID)
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
        t.*, 
        u.Name AS CreatorName
      FROM Tasks t
      LEFT JOIN Users u ON t.CreatorID = u.UserID
    `);
    return result.recordset;
  } catch (err) {
    console.error("Error loading tasks:", err);
    return [];
  }
});

ipcMain.handle("delete-task", async (event, taskId) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("TaskID", sql.Int, taskId)
      .query("DELETE FROM Tasks WHERE TaskID = @TaskID");
    return { success: true };
  } catch (err) {
    console.error("Error deleting task:", err);
    return { success: false, error: err.message };
  }
});
