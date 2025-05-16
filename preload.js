// preload.js
const { contextBridge, ipcRenderer } = require("electron");
const { poolPromise, sql } = require("./db");

contextBridge.exposeInMainWorld("api", {
  getTasks: () => ipcRenderer.invoke("get-tasks"), // ✅ Use main process
  addTask: async (task) => {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Tick", sql.Bit, task.Tick)
      .input("TaskName", sql.NVarChar, task.TaskName)
      .input("CompletionTime", sql.DateTime, task.CompletionTime)
      .input("TaskType", sql.Int, task.TaskType)
      .input("TaskCreationDate", sql.DateTime, task.TaskCreationDate)
      .input("Deadline", sql.DateTime, task.Deadline)
      .input("Interval", sql.Int, task.Interval)
      .input("IsRecurring", sql.Bit, task.IsRecurring)
      .input("UserID", sql.Int, task.UserID)
      .input("CreatorID", sql.Int, task.CreatorID)
      .input("Details", sql.NVarChar, task.Details).query(`
        INSERT INTO Tasks (
          Tick, TaskName, CompletionTime, TaskType, TaskCreationDate, Deadline,
          Interval, IsRecurring, UserID, CreatorID, Details
        )
        VALUES (
          @Tick, @TaskName, @CompletionTime, @TaskType, @TaskCreationDate, @Deadline,
          @Interval, @IsRecurring, @UserID, @CreatorID, @Details
        )
      `);
  },
  updateTask: (task) => ipcRenderer.invoke("update-task", task),
  deleteTask: (taskId) => ipcRenderer.invoke("delete-task", taskId),
  getUsers: () => ipcRenderer.invoke("get-users"),
});
