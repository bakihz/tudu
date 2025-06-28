const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { poolPromise, sql } = require("./server/js/db"); // <-- fixed path
const { startServer } = require("./server.js");

let win;

// --- App Lifecycle ---
app.on("ready", () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreen: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      sandbox: false,
    },
  });

  win.maximize();
  win.loadFile("./public/login.html");
  startServer();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
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
    win.loadFile("/login/login.html");
  }
});

// --- IPC Handlers ---

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
        t.isDeleted,
        creator.UserName AS CreatorName,
        assignee.UserName AS UserName
      FROM Tasks t
      LEFT JOIN Users creator ON t.CreatorID = creator.UserID
      LEFT JOIN Users assignee ON t.UserID = assignee.UserID
    `);
    return result.recordset;
  } catch (err) {
    console.error("Error loading tasks:", err);
    return [];
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
      .input("CreatorID", sql.Int, task.CreatorID)
      .input("UserID", sql.Int, task.UserID)
      .input("Interval", sql.Int, task.Interval).query(`
        INSERT INTO Tasks (TaskName, Details, Deadline, TaskType, IsRecurring, CreatorID, Tick, UserID, Interval)
        VALUES (@TaskName, @Details, @Deadline, @TaskType, @IsRecurring, @CreatorID, @Tick, @UserID, @Interval)
      `);
    return { success: true };
  } catch (err) {
    console.error("Error adding task:", err);
    return { success: false, error: err.message };
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
      .input("UserID", sql.Int, task.UserID)
      .input("Tick", sql.Bit, task.Tick)
      .input("Interval", sql.Int, task.Interval)
      .input(
        "CompletionTime",
        sql.DateTime,
        task.CompletionTime ? new Date(task.CompletionTime) : null
      )
      .input("isDeleted", sql.Bit, task.isDeleted).query(`
        UPDATE Tasks
        SET TaskName = @TaskName,
            Details = @Details,
            Deadline = @Deadline,
            TaskType = @TaskType,
            IsRecurring = @IsRecurring,
            Tick = @Tick,
            Interval = @Interval,
            CompletionTime = @CompletionTime,
            isDeleted = @isDeleted
        WHERE TaskID = @TaskID
      `);
    // Optionally return updated tasks
    const result = await pool.request().query(`
      SELECT 
        t.*, 
        u.UserName AS CreatorName
      FROM Tasks t
      LEFT JOIN Users u ON t.CreatorID = u.UserID
    `);
    console.log("Task updated successfully:", result.recordset);
    return { success: true, result: result.recordset };
  } catch (err) {
    console.error("Error updating task:", err);
    return { success: false, error: err.message };
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
