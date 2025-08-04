const {
  app,
  BrowserWindow,
  ipcMain,
  nativeImage,
  Tray,
  Menu,
  Notification,
} = require("electron");
const PImage = require("pureimage");
const { PassThrough } = require("stream");
const path = require("path");
const { poolPromise, sql } = require("./src/utils/db"); // <-- fixed path
const { startServer } = require("./server.js");
const AutoLaunch = require("auto-launch");
const { electron } = require("process");
const { autoUpdater } = require("electron-updater");

let win;
let tray = null;
let isQuiting = false;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit(); // Zaten çalışıyorsa çık
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}

if (app.isPackaged) {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
    args: [],
  });
}

const tuduAutoLauncher = new AutoLaunch({ name: "Tudu" });
tuduAutoLauncher.disable(); // Eski kayıt varsa temizler

// --- App Lifecycle ---
app.on("ready", () => {
  // Auto updater ayarları
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
    
    // Her 10 dakikada bir güncelleme kontrol et
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 10 * 60 * 1000); // 10 minutes
  }

  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "icon.ico"),
    title: "Tudu",
    fullscreen: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      sandbox: false,
      devTools: false,
    },
  });

  win.setMenuBarVisibility(true);
  win.setAutoHideMenuBar(false);

  win.maximize();
  win.loadFile("./public/login.html");

  // Start the server ONLY ONCE here
  if (!app.serverStarted) {
    startServer();
    app.serverStarted = true;
  }

  // Tray setup
  tray = new Tray(path.join(__dirname, "icon.ico")); // Use your icon file here
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Göster",
      click: () => {
        win.show();
      },
    },
    {
      label: "Çıkış",
      click: () => {
        isQuiting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("Tudu");
  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    win.show();
  });

  // When hiding to tray, do NOT destroy the window, just hide it
  win.on("close", (event) => {
    if (!isQuiting) {
      event.preventDefault();
      win.minimize(); // <-- keep minimized, not hidden
    } else {
      win = null;
    }
    return false;
  });
  win.on("minimize", (event) => {
    event.preventDefault();
    win.minimize(); // <-- keep minimized, not hidden
  });
  win.on("restore", () => {
    win.show();
  });
  win.on("closed", () => {
    win = null; // Clear the reference when closed
  });
  // Ensure the window is focused when clicked
  win.webContents.on("did-finish-load", () => {
    win.webContents.executeJavaScript(`
      document.addEventListener('mousedown', function() {
        window.focus();
      });
    `);
  });
});

// --- Auto Updater Events ---
autoUpdater.on("checking-for-update", () => {
  console.log("Güncellemeler kontrol ediliyor...");
});

autoUpdater.on("update-available", (info) => {
  console.log("Güncelleme mevcut:", info.version);
  if (win && !win.isDestroyed()) {
    win.webContents.send("update-available", info);
  }
});

autoUpdater.on("update-not-available", () => {
  console.log("Güncel sürüm kullanılıyor.");
});

autoUpdater.on("error", (err) => {
  console.log("Güncelleme hatası:", err);
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "İndirme hızı: " + progressObj.bytesPerSecond;
  log_message = log_message + " - İndirilen " + progressObj.percent + "%";
  log_message = log_message + " (" + progressObj.transferred + "/" + progressObj.total + ")";
  console.log(log_message);
  
  if (win && !win.isDestroyed()) {
    win.webContents.send("download-progress", progressObj);
  }
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Güncelleme indirildi:", info.version);
  if (win && !win.isDestroyed()) {
    win.webContents.send("update-downloaded", info);
  }
  
  // 5 saniye sonra otomatik olarak yeniden başlat
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 5000);
});

app.on("before-quit", () => {
  isQuiting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// In your activate event, always check if win is null or destroyed
app.on("activate", () => {
  if (!win || win.isDestroyed()) {
    win = new BrowserWindow({
      width: 800,
      height: 600,
      title: "Tudu",
      icon: path.join(__dirname, "icon.ico"),
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        devTools: false,
      },
    });
    win.loadFile("./public/login.html");
    // Re-attach your close event handler here if needed
    win.on("close", (event) => {
      if (!isQuiting) {
        event.preventDefault();
        win.minimize(); // <-- keep minimized, not hidden
      } else {
        win = null;
      }
      return false;
    });
  } else {
    win.show();
  }
});

app.on("browser-window-created", (_, window) => {
  window.webContents.on("before-input-event", (event, input) => {
    if (input.key === "Alt") {
      event.preventDefault();
    }
  });

  // Ensure window regains focus when any click occurs inside it
  window.webContents.executeJavaScript(`
    document.addEventListener('mousedown', function() {
      window.focus();
    });
  `);
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
      .query("SELECT UserID, UserName, UserType FROM Users");
    return result.recordset;
  } catch (err) {
    console.error("Error loading users:", err);
    return [];
  }
});
ipcMain.on("set-badge-count", async (event, count) => {
  if (process.platform !== "win32") return;
  if (!win) return;
  if (count > 0) {
    const size = 64;
    const img = PImage.make(size, size);
    const ctx = img.getContext("2d");

    ctx.fillStyle = "#007bff";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "30pt Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(count > 99 ? "99+" : String(count), size / 2, size / 2);

    const stream = new PassThrough();
    const chunks = [];
    PImage.encodePNGToStream(img, stream);
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const overlay = nativeImage.createFromBuffer(buffer);
      win.setOverlayIcon(overlay, `${count} pending tasks`);
    });
  } else {
    win.setOverlayIcon(null, "");
  }
});

ipcMain.on("show-notification", (event, { title, body }) => {
  new Notification({
    title,
    body,
    icon: path.join(__dirname, "icon.ico"),
  }).show();
});

// Register Arial or use a bundled TTF font
PImage.registerFont(path.join(__dirname, "arial.ttf"), "Arial").loadSync();
