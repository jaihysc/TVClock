import { app, BrowserWindow } from "electron";
import { ipcMain } from "electron";

let mainWindow: BrowserWindow;

//Networking
let net = require("net");
let networkClient = new net.Socket();

async function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 1920,
        height: 1080,
    });

    await mainWindow.loadFile("index.html");
    mainWindow.setMenuBarVisibility(false);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Window close
    mainWindow.on("closed", () => {
        console.log("Program exiting...");

        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow.destroy();

        //Close networking connections
        networkDisconnect();

        console.log("Goodbye!");
    });

    //Setup networking
    initNetworking();
}

// electron has finished initialization
// ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", async () => {
    // On OS X it"s common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        await createWindow();
    }
});

//Networking settings
class networkingConfig {
    hostname: string = "localhost";
    port: number = 4999;
}

let networkConfig = new networkingConfig();

function initNetworking() {
    networkClient.on("data", function(data: Buffer) {
        console.log("Networking | Received: " + data);
    });

    networkClient.on("close", function() {
        mainWindow.webContents.send("networking-status", "disconnected");
        console.log("Networking | Connection closed");
    });

    networkClient.on("error", (error: string) => {
        console.log("Networking | " + error);
        mainWindow.webContents.send("networking-status", "disconnected");
    });

    //Start networking
    networkConnect();

    //Event handlers for reconnect and send from renderer process
    ipcMain.on("networking-reconnect", (event: any, arg: string) => {
        console.log("Networking | Attempting to reconnect");
        networkConnect();
    });
    ipcMain.on("networking-send", (event: any, arg: string) => {
        console.log("Networking | Sent: "+ arg);
        networkSend(arg);
    });

    //Allow for changing of port + hostname
    ipcMain.on("networking-info-modify", (event: any, arg: networkingConfig) => {
        //Should receive hostname + port
        networkConfig = arg;
        //Reconnect with new settings
        networkDisconnect();
        networkConnect();
    })
}

function networkDisconnect() {
    console.log("Networking | Disconnecting");
    networkClient.end();
}

function networkConnect() {
    mainWindow.webContents.send("networking-status", "connecting");
    console.log("Networking | Connecting");

    //Attempt to establish connection on specified port
    networkClient.connect(networkConfig.port, networkConfig.hostname, () => {
        //connection established
        mainWindow.webContents.send("networking-status", "connected");

        console.log("Networking | Connection established");
    });
}

function networkSend(str: string) {
    networkClient.write(str + "\r\n"); //Make sure to include \r\n so the server recognises it as a message
}


// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
require("./dataPersistence");