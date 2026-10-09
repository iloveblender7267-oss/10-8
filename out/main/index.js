"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const Store = require("electron-store");
const os = require("os");
const icon = path.join(__dirname, "../../resources/icon.png");
const DEFAULT_BROWSER_OPTIONS = {
  x: 0,
  y: 0,
  width: 1280,
  height: 1500,
  fullscreen: false,
  frame: true,
  kiosk: false,
  alwaysOnTop: false,
  autoHideMenuBar: false,
  // default vite electron options
  ...process.platform === "linux" ? { icon } : {}
};
const STORE_KEY = "application-settings";
class ApplicationConfig {
  #options;
  constructor() {
    const data = this.#getStoreData();
    this.#options = {
      browser: DEFAULT_BROWSER_OPTIONS,
      guiDisplay: true,
      ...data
    };
    this.#options.browser.webPreferences = {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    };
  }
  /**
   * ストアに情報保存
   */
  setStoreData(data) {
    this.#options = { ...this.#options, ...data };
    delete this.#options.browser?.webPreferences;
    const store = new Store();
    store.set(STORE_KEY, this.#options);
    console.log(`[SAVE] Config.
Path = ${store.path}
data = ${JSON.stringify(data, null, 1)}`);
  }
  /**
   * Storeから情報取得
   */
  #getStoreData() {
    const store = new Store();
    return store.get(STORE_KEY) ?? {};
  }
  /**
   * ブラウザオプション取得
   */
  get browser() {
    return { ...this.options.browser };
  }
  get options() {
    return this.#options;
  }
}
const AppConfig = new ApplicationConfig();
const AppHandleTypes = {
  getConfig: "app:get:config",
  restart: "app:restart",
  save: "app:save"
};
const Shortcuts = {
  showGui: "shortcut:show_gui"
};
const getLocalAddress = () => {
  const interfaces = os.networkInterfaces();
  const ifacesObj = {
    ipv4: [],
    ipv6: []
  };
  for (let dev in interfaces) {
    interfaces[dev].forEach((details) => {
      if (!details.internal) {
        switch (details.family) {
          case "IPv4":
            ifacesObj.ipv4.push({ name: dev, address: details.address });
            break;
          case "IPv6":
            ifacesObj.ipv6.push({ name: dev, address: details.address });
            break;
        }
      }
    });
  }
  return ifacesObj.ipv4[0].address;
};
const icpHandler = ({ window }) => {
  electron.ipcMain.handle(AppHandleTypes.getConfig, (_) => {
    const ip = getLocalAddress();
    const data = AppConfig.options;
    const version = electron.app.getVersion();
    const storePath = `${electron.app.getPath("userData")}/config.json`;
    return { ...data, ip, version, storePath };
  });
  electron.ipcMain.handle(AppHandleTypes.restart, (_, data) => {
    AppConfig.setStoreData(data);
    window.close();
    electron.app.relaunch();
    electron.app.exit();
  });
  electron.ipcMain.handle(AppHandleTypes.save, (_, data) => {
    AppConfig.setStoreData(data);
  });
};
const shortcut = ({ window }) => {
  electron.globalShortcut.register("ctrl+1", () => {
    window.webContents.send(Shortcuts.showGui);
  });
};
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "1";
function createWindow() {
  const mainWindow = new electron.BrowserWindow(AppConfig.browser);
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  shortcut({ window: mainWindow });
  icpHandler({ window: mainWindow });
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("will-quit", () => {
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
