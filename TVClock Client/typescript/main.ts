import {app, BrowserWindow, ipcMain} from "electron";
import {DataActionPacket, NetworkManager} from "./NetworkManager";
import {NetworkingStatus, NetworkOperation, RequestType} from "./RequestTypes";
import {ViewManager} from "./viewManager";

// Command line arguments
for (let arg of process.argv) {
    switch (arg) {
        case "-d":  // -d Enables debug logging
            NetworkManager.debugLog = true;
    }
}

let mainWindow: BrowserWindow;

async function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 1920,
        height: 1080,
    });

    mainWindow.on("closed", () => {
        console.log("Program exiting...");

        //Close networking connections
        try {
            NetworkManager.disconnect();
        } catch {
        }

        // Dereference the window object
        mainWindow.destroy();

        console.log("Goodbye!");
    });

    mainWindow.setMenuBarVisibility(false);
    await mainWindow.loadFile("./views/index.html");

    mainWindow.webContents.send(NetworkingStatus.SetConnectionStatus, "disconnected");
    initializeNetworking();
}

function initializeNetworking(): void {
    NetworkManager.initialize(mainWindow);

    //Event handlers from renderer process
    ipcMain.on(NetworkOperation.Reconnect, () => {
        NetworkManager.reconnect();
    });

    //Sends specified identifiers with RequestType and returns the response
    ipcMain.on(NetworkOperation.Send, (event: any, args: { requestType: RequestType; identifiers: any[]; data: any[]; sendUpdate: boolean; sendResponse: boolean}) => {
        if (args.sendUpdate == undefined)
            args.sendUpdate = true;
        if (args.sendResponse == undefined)
            args.sendResponse = true;

        NetworkManager.send(event, args.requestType, args.identifiers, args.data, args.sendUpdate, args.sendResponse);
    });

    ipcMain.on(NetworkOperation.DataActionPacketBufferAdd, (event: any, args: { dataActionPacket: DataActionPacket }) => {
        NetworkManager.dataActionPacketBufferAdd(args.dataActionPacket);
    });

    //Allow for changing of port + hostname
    ipcMain.on(NetworkOperation.ConfigModify, (event: any, arg: { port: number; hostname: string; }) => {
        NetworkManager.modifyConfig(arg.hostname, arg.port)
    });
}

// electron has finished initialization, ready to create browser windows.
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