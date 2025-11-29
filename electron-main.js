const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

let mainWindow;
const APP_ID = 'com.flowgui.architect';
const DATA_ROOT = path.join(app.getPath('userData'), 'FlowGUI');
const SCREENS_DIR = path.join(DATA_ROOT, 'screens');
const LOGS_DIR = path.join(DATA_ROOT, 'logs');

function ensureDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    console.error(`[ERROR] Unable to create directory ${dirPath}`, err);
  }
}

function ensureAppPaths() {
  ensureDirectory(DATA_ROOT);
  ensureDirectory(SCREENS_DIR);
  ensureDirectory(LOGS_DIR);
  console.log(`[STORAGE] Data root: ${DATA_ROOT}`);
  console.log(`[STORAGE] Screens dir: ${SCREENS_DIR}`);
  console.log(`[STORAGE] Logs dir: ${LOGS_DIR}`);
}

// Ensure Windows taskbar/pinned icons use the packaged icon
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID);
}

function resolveIconPath() {
  if (app.isPackaged) {
    const packagedIcon = path.join(process.resourcesPath, 'icon.ico');
    if (fs.existsSync(packagedIcon)) {
      return packagedIcon;
    }
  }
  return path.join(__dirname, 'icon.ico');
}

function createWindow() {
  ensureAppPaths();
  console.log('Creating main window...');
  console.log(`[APP INFO] isPackaged: ${app.isPackaged}`);
  console.log(`[APP INFO] Process resourcesPath: ${process.resourcesPath || 'N/A'}`);
  console.log(`[APP INFO] __dirname: ${__dirname}`);
  console.log(`[APP INFO] process.execPath: ${process.execPath}`);

  // Setup file logging
  const logPath = path.join(LOGS_DIR, 'app.log');
  fs.writeFileSync(logPath, `[STARTUP] App started at ${new Date().toISOString()}\n`);

  function logToFile(msg) {
    try {
      fs.appendFileSync(logPath, msg + '\n');
    } catch (e) {
      // ignore
    }
  }

  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => {
    originalLog(...args);
    logToFile(`[LOG] ${args.join(' ')}`);
  };

  console.error = (...args) => {
    originalError(...args);
    logToFile(`[ERROR] ${args.join(' ')}`);
  };

  logToFile(`[INFO] Log path: ${logPath}`);
  logToFile(`[INFO] __dirname: ${__dirname}`);


  const iconPath = resolveIconPath();
  console.log(`[ICON] Using icon at: ${iconPath}`);

  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    backgroundColor: '#1e1e1e', // Matches tailwind mc-bg
    titleBarStyle: 'hidden', // Hide native title bar for custom UI
    titleBarOverlay: {
      color: '#2d2d2d', // Matches tailwind mc-panel
      symbolColor: '#e0e0e0', // Matches tailwind mc-text
      height: 48 // Matches header height (h-12)
    },
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Enable devtools for debugging
      devTools: isDev
    },
    show: false // Don't show until ready to prevent white flash
  });

  // Determine the correct path for production vs development
  let indexPath, preloadPath, distDir;

  if (app.isPackaged) {
    // In a packaged app, the resources are inside the asar file
    // The asar archive contains the dist folder directly, so we need to reference it as app.asar/dist
    indexPath = path.join(__dirname, 'dist', 'index.html'); // __dirname points to resources/app.asar/ when packaged
    preloadPath = path.join(__dirname, 'electron-preload.js');
    distDir = path.join(__dirname, 'dist');

    console.log('[PATH DEBUG] App is packaged - using app.asar paths');
    console.log(`[PATH DEBUG] __dirname points to: ${__dirname}`);
    console.log(`[PATH DEBUG] Attempting to load HTML from: ${indexPath}`);
    console.log(`[PATH DEBUG] Preload script path: ${preloadPath}`);
  } else {
    // In development
    indexPath = path.join(__dirname, 'dist', 'index.html');
    preloadPath = path.join(__dirname, 'electron-preload.js');
    distDir = path.join(__dirname, 'dist');

    console.log('[PATH DEBUG] App in development mode');
    console.log(`[PATH DEBUG] __dirname: ${__dirname}`);
    console.log(`[PATH DEBUG] Attempting to load HTML from: ${indexPath}`);
    console.log(`[PATH DEBUG] Preload script path: ${preloadPath}`);
  }

  console.log(`[FILE CHECK] HTML file exists: ${fs.existsSync(indexPath)}`);
  console.log(`[FILE CHECK] Preload script exists: ${fs.existsSync(preloadPath)}`);

  // Check if dist directory exists
  console.log(`[FILE CHECK] Dist directory exists: ${fs.existsSync(distDir)}`);
  if (fs.existsSync(distDir)) {
    try {
      const files = fs.readdirSync(distDir);
      console.log(`[FILE CHECK] Files in dist directory:`, files);

      // Check for assets directory
      const assetsDir = path.join(distDir, 'assets');
      console.log(`[FILE CHECK] Assets directory exists: ${fs.existsSync(assetsDir)}`);
      if (fs.existsSync(assetsDir)) {
        const assets = fs.readdirSync(assetsDir);
        console.log(`[FILE CHECK] Files in assets directory:`, assets);
      }
    } catch (err) {
      console.error('[ERROR] Could not read dist directory:', err);
    }
  } else {
    console.error('[ERROR] Dist directory does not exist at expected location');
    console.log('[INFO] Checking alternative locations...');

    const appDir = path.dirname(__dirname);
    console.log(`[INFO] Checking parent directory: ${appDir}`);
    console.log(`[INFO] Parent directory exists: ${fs.existsSync(appDir)}`);
    if (fs.existsSync(appDir)) {
      try {
        const parentFiles = fs.readdirSync(appDir);
        console.log(`[INFO] Files in parent directory:`, parentFiles);
      } catch (err) {
        console.error('[ERROR] Could not read parent directory:', err);
      }
    }
  }

  // Load the index.html file
  // In a production build, this points to the dist/index.html
  mainWindow.loadFile(indexPath)
    .then(() => {
      console.log('[SUCCESS] Successfully loaded HTML file');

      // Add more webContents event listeners for debugging
      mainWindow.webContents.on('did-finish-load', () => {
        console.log('[WEB CONTENTS] Page finished loading');
      });

      mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('[WEB CONTENTS ERROR] Failed to load page:', errorCode, errorDescription);
      });

      mainWindow.webContents.on('crashed', (event, killed) => {
        console.error('[WEB CONTENTS ERROR] Page crashed:', killed);
      });

      mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[RENDERER] ${message} (${sourceId}:${line})`);
      });
    })
    .catch(err => {
      console.error('[ERROR] Failed to load file:', err);
      console.error('[ERROR] Full error details:', err.stack);
    });

  mainWindow.once('ready-to-show', () => {
    console.log('Window is ready to show.');
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Open external links (like docs) in the user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Add error handling for renderer process crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[RENDERER ERROR] Renderer process gone:', details.reason, details.exitCode);
  });
}

async function readScreensFromDisk() {
  ensureDirectory(SCREENS_DIR);
  const files = fs.readdirSync(SCREENS_DIR).filter(file => file.endsWith('.json'));
  const screens = [];
  for (const file of files) {
    const filePath = path.join(SCREENS_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed?.id) {
        screens.push(parsed);
      }
    } catch (err) {
      console.error(`[ERROR] Failed to parse screen file ${filePath}`, err);
    }
  }
  return screens;
}

async function saveScreensToDisk(screens) {
  ensureDirectory(SCREENS_DIR);
  const seenIds = new Set();
  for (const screen of screens) {
    if (!screen?.id) continue;
    seenIds.add(screen.id);
    const screenPath = path.join(SCREENS_DIR, `${screen.id}.json`);
    try {
      fs.writeFileSync(screenPath, JSON.stringify(screen, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[ERROR] Failed to write screen ${screen.id}`, err);
    }
  }

  // Clean up old files
  const existingFiles = fs.readdirSync(SCREENS_DIR).filter(file => file.endsWith('.json'));
  for (const file of existingFiles) {
    const screenId = file.replace('.json', '');
    if (!seenIds.has(screenId)) {
      try {
        fs.unlinkSync(path.join(SCREENS_DIR, file));
      } catch (err) {
        console.error(`[ERROR] Failed to delete stale screen file ${file}`, err);
      }
    }
  }
}

function registerIpcHandlers() {
  ipcMain.handle('screens:list', async () => {
    try {
      return await readScreensFromDisk();
    } catch (err) {
      console.error('[ERROR] Failed to list screens', err);
      return [];
    }
  });

  ipcMain.handle('screens:saveAll', async (_event, screens) => {
    try {
      if (Array.isArray(screens)) {
        await saveScreensToDisk(screens);
      }
      return { success: true };
    } catch (err) {
      console.error('[ERROR] Failed to save screens', err);
      return { success: false, error: err?.message };
    }
  });

  ipcMain.handle('storage:paths', () => ({
    dataRoot: DATA_ROOT,
    screensDir: SCREENS_DIR,
    logsDir: LOGS_DIR
  }));

  ipcMain.handle('storage:openScreensDir', () => {
    ensureDirectory(SCREENS_DIR);
    return shell.openPath(SCREENS_DIR);
  });

  ipcMain.handle('storage:openLogsDir', () => {
    ensureDirectory(LOGS_DIR);
    return shell.openPath(LOGS_DIR);
  });

  ipcMain.handle('screens:export', async (_event, screen) => {
    try {
      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Export Screen',
        defaultPath: path.join(app.getPath('documents'), `${screen.name || 'screen'}.json`),
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (filePath) {
        fs.writeFileSync(filePath, JSON.stringify(screen, null, 2), 'utf-8');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[ERROR] Failed to export screen', err);
      return false;
    }
  });

  ipcMain.handle('screens:import', async () => {
    try {
      const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Import Screen',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (filePaths && filePaths.length > 0) {
        const content = fs.readFileSync(filePaths[0], 'utf-8');
        const screen = JSON.parse(content);
        // Ensure it has a new ID to avoid conflicts if imported into same project
        // But keep original ID if user wants to overwrite? 
        // For safety, let's generate a new ID in the frontend if needed, 
        // but here we just return the object.
        return screen;
      }
      return null;
    } catch (err) {
      console.error('[ERROR] Failed to import screen', err);
      return null;
    }
  });
}

app.whenReady().then(() => {
  ensureAppPaths();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});