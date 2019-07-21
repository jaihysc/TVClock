import { app, BrowserWindow } from "electron";
import { ipcMain } from "electron";
import { RequestType } from "./RequestTypes";
import {domainToASCII} from "url";

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

//---------------------------------
//Networking
//Handles communication between the client and server

//Class to serialize / deserialize responses to and from the server
class NetworkingPacket {
    requestType: String | undefined;
    data: string[] | undefined;
    dataIdentifiers: string[] | undefined;
    timestamp: number | undefined;
    id: number; //Used for identifying the response, which will be on the same id

    constructor(requestType: RequestType, data: string[], dataIdentifiers: string[], timestamp: number, id: number) {
        this.requestType = requestType;
        this.data = data;
        this.dataIdentifiers = dataIdentifiers;
        this.timestamp = timestamp;
        this.id = id;
    }
}

class NetworkingConfig {
    hostname: string = "localhost";
    port: number = 4999;
}

let networkConfig = new NetworkingConfig();
let networkingQueuedRequests: {id: number; event: any}[] = [];
let networkingId: number = 0;

function initNetworking() {
    networkClient.on("data", function(response: Buffer) {
        console.log("Networking | Received: " + response);
        let returnedPacket: NetworkingPacket;
        try {
            returnedPacket = JSON.parse(response.toString());

        } catch (e) {
            console.log("Networking | Error handling received message: " + e);
            return;
        }

        //Handle update requests from the server
        if (returnedPacket.requestType == RequestType.Update) {
            if (returnedPacket.dataIdentifiers == undefined || returnedPacket.data == undefined)
                return;

            for (let i = 0; i < returnedPacket.dataIdentifiers.length; ++ i) {
                //Update requests will use the channel specified by dataIdentifiers with "-update" appended at the end
                //schedule-view-scheduleItems would become schedule-view-scheduleItems-update
                mainWindow.webContents.send(
                    returnedPacket.dataIdentifiers[i] + "-update", returnedPacket.data[i]);
            }
            return;
        }

        let foundId = false;
        //Find event matching returnedVal id
        for (let i = 0; i < networkingQueuedRequests.length; ++i) {
            if (networkingQueuedRequests[i].id === returnedPacket.id) {
                //Return deserialized server response to caller
                //Note the data is still in json as it is stored in a string array
                networkingQueuedRequests[i].event.returnValue = {identifiers: returnedPacket.dataIdentifiers, data: returnedPacket.data};

                networkingQueuedRequests.splice(i, 1); //Remove networkingRequests element after fulfilling request
                foundId = true;
                break;
            }
        }

        if (!foundId)
            console.log("Networking | Received packet with no matching id - Ignoring");
    });

    networkClient.on("close", function() {
        mainWindow.webContents.send("networking-status", "disconnected");
        console.log("Networking | Connection closed");
    });

    networkClient.on("error", (error: string) => {
        console.log("Networking | " + error);

        //Return null to all networking-send events
        networkingQueuedRequests.forEach(value => {
            value.event.returnValue = null;
        });
        networkingQueuedRequests = []; //clear queued requests

        mainWindow.webContents.send("networking-status", "disconnected");
    });

    //Start networking
    networkConnect();

    //Event handlers for reconnect and send from renderer process
    ipcMain.on("networking-reconnect", (event: any, arg: string) => {
        console.log("Networking | Attempting to reconnect");
        networkConnect();
    });

    //Sends specified identifiers with RequestType and returns the response
    ipcMain.on("networking-send", (event: any, args: { requestType: RequestType; identifiers: any[]; data: any[]}) => {
        let id = networkingId++;

        let dataJson: string[] = [];
        //Serialize data into string arrays first
        if (args.data != undefined) {
            dataJson.push(JSON.stringify(args.data));
        }

        let packet = new NetworkingPacket(args.requestType, dataJson, args.identifiers, Date.now(), id);

        //Log the return event in an array for a data reply
        networkingQueuedRequests.push({id: id, event: event});

        //Serialize into json string and send it to the server
        networkSend(JSON.stringify(packet));
    });

    //Allow for changing of port + hostname
    ipcMain.on("networking-info-modify", (event: any, arg: { port: number; hostname: string; }) => {
        //Should receive hostname + port
        networkConfig.port = arg.port;
        networkConfig.hostname = arg.hostname;

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

        mainWindow.webContents.send("main-ready"); //Inform that network is established
        console.log("Networking | Connection established");
    });
}

function networkSend(str: string) {
    return networkClient.write(str + "\r\n", () => { //Make sure to include \r\n so the server recognises it as a message
        console.log("Networking | Sent: " + str);
    });
}


// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
require("./dataPersistence");