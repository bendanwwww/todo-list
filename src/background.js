"use strict";

import { app, protocol, BrowserWindow, screen, ipcMain, remote, shell } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
//import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
const isDevelopment = process.env.NODE_ENV !== "production";

import { initExtra, createTray } from "@/utils/backgroundExtra";

import { autoUpdater } from "electron-updater";

import pkg from "../package.json";
import dayjs from "dayjs";
import path from "path";
import DB from "@/utils/db";

let win;
let memo_win_map = new Map();
let memo_id_win_map = new Map();

const min_win_width = 40;
const min_win_height = 40;

const max_win_width = 1200;
const max_win_height = 800;

const init_win_width = 440;
const init_win_height = 330;

const init_x = 500;
const init_y = 500;


const winURL = isDevelopment
  ? `http://localhost:8080`
  : `file://${__dirname}/index.html`
const downloadReady = false;

if (app.requestSingleInstanceLock()) {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (win) {
      setPosition();
    }
  });
} else {
  app.quit();
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

app.whenReady().then(() => {
  // 这个需要在app.ready触发之后使用
  protocol.registerFileProtocol('atom', (request, callback) => {
    const url = DB.get("settings.background_img_path");
    // refresh("url", url);
    // refresh("dburl", DB.get("settings.background_img_path"));
    callback(decodeURI(path.normalize(url)))
  })
})

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    // backgroundColor: '#40000000',
    width: min_win_width,
    height: min_win_height,
    minWidth: min_win_width,
    minHeight: min_win_height,
    maxWidth: min_win_width,
    maxHeight: min_win_height,
    type: "toolbar",
    frame: false,
    title: pkg.name,
    //resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    //closable: false,
    //show: false,
    transparent: true,
    alwaysOnTop: true,
    useContentSize: true,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      webSecurity: false
    },
  });

  setPosition();

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    // if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
    autoUpdater.checkForUpdatesAndNotify();
    // win.webContents.openDevTools();
  }

  // win.once("ready-to-show", () => {
  //   win.show();
  // });

  //屏蔽windows原生右键菜单
  if (process.platform === "win32") {
    //int WM_INITMENU = 0x116;
    //当一个下拉菜单或子菜单将要被激活时发送此消息，它允许程序在它显示前更改菜单，而不要改变全部
    win.hookWindowMessage(278, function(e) {
      win.setEnabled(false); //窗口禁用

      setTimeout(() => {
        win.setEnabled(true); //窗口启用
      }, 100); //延时太快会立刻启用，太慢会妨碍窗口其他操作，可自行测试最佳时间

      return true;
    });
  }

  win.on("closed", () => {
    win = null;
  });
}

//闪烁问题
app.commandLine.appendSwitch("wm-window-animations-disabled");

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) init();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  // if (isDevelopment && !process.env.IS_TEST) {
  //   // Install Vue Devtools
  //   try {
  //     await installExtension(VUEJS_DEVTOOLS);
  //   } catch (e) {
  //     console.error("Vue Devtools failed to install:", e.toString());
  //   }
  // }

  init();
});

function init() {
  createWindow();
  initExtra();
  createTray(showWindow);
}

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

function setPosition() {
  const size = screen.getPrimaryDisplay().workAreaSize;
  const winSize = win.getSize();
  win.setPosition(size.width - winSize[0] - 30, 30);
}

function showWindow() {
  if (!win.isVisible()) win.show();
}

export function checkVersion(version) {
  // 下载版本号
  downloadFile('http://manager-lsy.oss-cn-beijing.aliyuncs.com/todo_list/version.txt', '/Users/zhihu/person/workspace/my_work/todo-list/version.txt');
  while (!downloadReady) {
    console.info('wait');
  }
  downloadReady = false;
  // 读取版本号
  // const newVersion = readFile('/Users/zhihu/person/workspace/my_work/todo-list/version.txt', version);
  // console.info(newVersion);
}

function downloadFile(url, filePath) {
  let downloadObj = {
    downloadPath: url, // 要下载的链接或文件
    savedPath: filePath // 要保存的路径
  }
  win.webContents.downloadURL(downloadObj.downloadPath);
  win.webContents.session.on('will-download', (event, item) => {
    //设置文件存放位置
    item.setSavePath(downloadObj.savedPath)
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed')
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused');
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`);
        }
      }
    })
    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download successfully');
        downloadReady = true;
        // shell.showItemInFolder(downloadObj.savedPath); // 下载成功后打开文件所在文件夹
      } else {
        console.log(`Download failed: ${state}`);
      }
    })
  });
}

function readFile(filePath, defaultValue) {
  const fs = require("fs");
  const fileData = defaultValue;
  fs.readFile(filePath, "utf8", (err, data) => {
    if(!err) {
      fileData = data;
    }
  });
  return fileData;
}

export function refresh(name, msg) {
  console.info(name)
  win.webContents.send('refresh', name, msg);
}

ipcMain.handle("setIgnoreMouseEvents", (event, ignore) => {
  if (ignore) win.setIgnoreMouseEvents(true, { forward: true });
  else win.setIgnoreMouseEvents(false);
});

ipcMain.handle("hideWindow", (event) => {
  win.hide();
});

ipcMain.handle("openMemoWindows", (event, id) => {
  var vipWin = new BrowserWindow({
    parent: win, // win是主窗口
    backgroundColor: '#20000000',
    width: 400,
    height: 300,
    minWidth: 340,
    minHeight: 255,
    type: "toolbar",
    frame: false,
    title: pkg.name,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    transparent: true,
    alwaysOnTop: true,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      // openDevTools: true
    },
  });
  let now = dayjs();
  memo_win_map.set(now + '', vipWin);
  if (id !== '') {
    memo_id_win_map.set(id + '', vipWin);
  }
  vipWin.loadURL(winURL + '#/memo?id=' + id + '&timestamp=' + now);
  vipWin.on('closed', () => { vipWin = null });
});

ipcMain.handle("setMemoIgnoreMouseEvents", (event, router, ignore) => {
  let memo_win = memo_win_map.get(router);
  // memo_win.webContents.openDevTools()
  if (ignore) memo_win.setIgnoreMouseEvents(true, { forward: true });
  else memo_win.setIgnoreMouseEvents(false);
});

ipcMain.handle("checkMemoWindows", (event, id) => {
  return !memo_id_win_map.has(id);
});

ipcMain.handle("setMemoWindows", (event, id, time) => {
  let memo_win = memo_win_map.get(time);
  memo_id_win_map.set(id + '', memo_win);
});

ipcMain.handle("removeMemoWindows", (event, id, time) => {
  memo_win_map.delete(time);
  memo_id_win_map.delete(id);
});

ipcMain.handle("hasMemoWindows", (event) => {
  return memo_id_win_map.size > 0;
});

ipcMain.handle("showWindows", (event) => {
  const winBounds = win.getBounds();
  let winSize = DB.get("settings.shrink_windows_size");
  if (winSize == undefined) {
    DB.set("settings.shrink_windows_size", [init_win_width, init_win_height]);
    winSize = DB.get("settings.shrink_windows_size");
  }
  console.info("showWindows == " + winBounds.x, winBounds.y, winSize[0], winSize[1]);
  win.setMaximumSize(max_win_width, max_win_height);
  win.setBounds({
    x: winBounds.x - winSize[0] + winBounds.width, 
    y: winBounds.y, 
    width: winSize[0], 
    height: winSize[1] 
  });
});

ipcMain.handle("shrinkWindows", (event) => {
  const winBounds = win.getBounds();
  DB.set("settings.shrink_windows_size", [winBounds.width, winBounds.height]);
  console.info("shrinkWindows == " + winBounds.x, winBounds.y, min_win_width, min_win_height);
  win.setMaximumSize(min_win_width, min_win_height);
  win.setBounds({
    x: winBounds.x + winBounds.width - min_win_width, 
    y: winBounds.y, 
    width: min_win_width, 
    height: min_win_height 
  });
});

