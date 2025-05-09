const { BrowserWindow, app } = require("electron");
const path = require("path");

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
