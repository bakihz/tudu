// preload.js
const { contextBridge } = require("electron");
const { poolPromise, sql } = require("./db");

contextBridge.exposeInMainWorld("api", {
  getTasks: async () => {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Tasks");
    return result.recordset;
  },

  addTask: async (task) => {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Tick", sql.Bit, task.tick)
      .input("Name", sql.NVarChar, task.name)
      .input("CompletionTime", sql.DateTime, task.completionTime)
      .input("TaskType", sql.Int, task.taskType)
      .input("TaskCreationDate", sql.DateTime, task.taskCreationDate)
      .input("Deadline", sql.DateTime, task.deadline)
      .input("Interval", sql.Int, task.interval)
      .input("IsRecurring", sql.Bit, task.isRecurring)
      .input("UserID", sql.Int, task.user)
      .input("CreatorID", sql.Int, task.creator)
      .input("Details", sql.NVarChar, task.details).query(`
        INSERT INTO Tasks (
          Tick, Name, CompletionTime, TaskType, TaskCreationDate, Deadline,
          Interval, IsRecurring, UserID, CreatorID, Details
        )
        VALUES (
          @Tick, @Name, @CompletionTime, @TaskType, @TaskCreationDate, @Deadline,
          @Interval, @IsRecurring, @UserID, @CreatorID, @Details
        )
      `);
  },
});
