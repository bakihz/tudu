// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getTasks: () => ipcRenderer.invoke("get-tasks"),
  addTask: (task) => ipcRenderer.invoke("add-task", task),
  updateTask: (task) => ipcRenderer.invoke("update-task", task),
  deleteTask: (taskId) => ipcRenderer.invoke("delete-task", taskId),
  getUsers: () => ipcRenderer.invoke("get-users"),
  sendBadgeCount: (count) => ipcRenderer.send("set-badge-count", count),
  showNotification: (options) => ipcRenderer.send("show-notification", options),
});
