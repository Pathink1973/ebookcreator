const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const fs = require('fs');
const waitOn = require('wait-on');

let mainWindow;
let serverProcess;
const PORT = 3000;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Load the app
    loadWindow();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

async function loadWindow() {
    try {
        // Wait for the server to be ready
        await waitOn({
            resources: [`http://localhost:${PORT}`],
            timeout: 10000
        });
        mainWindow.loadURL(`http://localhost:${PORT}`);
        
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    } catch (error) {
        console.error('Error loading window:', error);
        app.quit();
    }
}

function startServer() {
    const serverPath = path.join(__dirname, 'server.js');
    serverProcess = spawn('node', [serverPath], {
        stdio: 'inherit'
    });

    serverProcess.on('error', (error) => {
        console.error('Failed to start server:', error);
        app.quit();
    });
}

// Initialize paths
function initializePaths() {
    const downloadsPath = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadsPath)) {
        fs.mkdirSync(downloadsPath, { recursive: true });
    }
}

app.on('ready', () => {
    initializePaths();
    startServer();
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});

// Handle IPC messages
ipcMain.on('download-complete', (event, data) => {
    event.reply('download-status', { status: 'complete', data });
});

ipcMain.on('download-error', (event, error) => {
    event.reply('download-status', { status: 'error', error });
});

// Error handling for the main process
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});
