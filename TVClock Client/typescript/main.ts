import {app, BrowserWindow, ipcMain} from "electron";
import {NetworkManager} from "./NetworkManager";
import {NetworkingStatus, NetworkOperation, RequestType} from "./RequestTypes";
import {NetworkingFunctions} from "./NetworkingFunctions";

let mainWindow: BrowserWindow;

async function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: 1920,
        height: 1080,
    });

    mainWindow.setMenuBarVisibility(false);
    await mainWindow.loadFile("./startup.html");

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    require("./dataPersistence");

    //Networking
    let networkManager = new NetworkManager(mainWindow, async () => {
        //Load pages once connection is established
        await mainWindow.loadFile("./index.html");
        mainWindow.webContents.send(NetworkingStatus.SetStatus, "connected");
        mainWindow.webContents.send(NetworkOperation.SetDisplayAddress,{
            hostname: networkManager.hostname,
            port: String(networkManager.port)}
        );
    });

    //Event handlers from renderer process
    ipcMain.on(NetworkOperation.Reconnect, () => {
        networkManager.reconnect();
    });

    //Sends specified identifiers with RequestType and returns the response
    ipcMain.on(NetworkOperation.Send, (event: any, args: { requestType: RequestType; identifiers: any[]; data: any[]; sendUpdate: boolean}) => {
        networkManager.send(event, args.requestType, args.identifiers, args.data, args.sendUpdate);
    });

    //Allow for changing of port + hostname
    ipcMain.on(NetworkOperation.ConfigModify, (event: any, arg: { port: number; hostname: string; }) => {
        networkManager.modifyConfig(arg.hostname, arg.port)
    });

    // Window close
    mainWindow.on("closed", () => {
        console.log("Program exiting...");

        //Close networking connections
        try {
            networkManager.disconnect();
        } catch {
        }

        // Dereference the window object
        mainWindow.destroy();

        console.log("Goodbye!");
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