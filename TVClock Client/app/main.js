"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var electron_2 = require("electron");
var RequestTypes_1 = require("./RequestTypes");
var mainWindow;
//Networking
var net = require("net");
var networkClient = new net.Socket();
function createWindow() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mainWindow = new electron_1.BrowserWindow({
                        webPreferences: {
                            nodeIntegration: true
                        },
                        width: 1920,
                        height: 1080,
                    });
                    return [4 /*yield*/, mainWindow.loadFile("index.html")];
                case 1:
                    _a.sent();
                    mainWindow.setMenuBarVisibility(false);
                    // Open the DevTools.
                    mainWindow.webContents.openDevTools();
                    // Window close
                    mainWindow.on("closed", function () {
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
                    return [2 /*return*/];
            }
        });
    });
}
// electron has finished initialization
// ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on("ready", createWindow);
// Quit when all windows are closed.
electron_1.app.on("window-all-closed", function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(mainWindow === null)) return [3 /*break*/, 2];
                return [4 /*yield*/, createWindow()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
//---------------------------------
//Networking
//Handles communication between the client and server
//Class to serialize / deserialize responses to and from the server
var NetworkingPacket = /** @class */ (function () {
    function NetworkingPacket(requestType, data, dataIdentifiers, timestamp, id) {
        this.requestType = requestType;
        this.data = data;
        this.dataIdentifiers = dataIdentifiers;
        this.timestamp = timestamp;
        this.id = id;
    }
    return NetworkingPacket;
}());
var NetworkingConfig = /** @class */ (function () {
    function NetworkingConfig() {
        this.hostname = "localhost";
        this.port = 4999;
    }
    return NetworkingConfig;
}());
var networkConfig = new NetworkingConfig();
var networkingQueuedRequests = [];
var networkingId = 0;
function initNetworking() {
    networkClient.on("data", function (response) {
        console.log("Networking | Received: " + response);
        var returnedPacket;
        try {
            returnedPacket = JSON.parse(response.toString());
        }
        catch (e) {
            console.log("Networking | Error handling received message: " + e);
            return;
        }
        //Handle update requests from the server
        if (returnedPacket.requestType == RequestTypes_1.RequestType.Update) {
            if (returnedPacket.dataIdentifiers == undefined || returnedPacket.data == undefined)
                return;
            for (var i = 0; i < returnedPacket.dataIdentifiers.length; ++i) {
                //Update requests will use the channel specified by dataIdentifiers with "-update" appended at the end
                //schedule-view-scheduleItems would become schedule-view-scheduleItems-update
                mainWindow.webContents.send(returnedPacket.dataIdentifiers[i] + "-update", returnedPacket.data[i]);
            }
            return;
        }
        var foundId = false;
        //Find event matching returnedVal id
        for (var i = 0; i < networkingQueuedRequests.length; ++i) {
            if (networkingQueuedRequests[i].id === returnedPacket.id) {
                //Return deserialized server response to caller
                //Note the data is still in json as it is stored in a string array
                networkingQueuedRequests[i].event.returnValue = { identifiers: returnedPacket.dataIdentifiers, data: returnedPacket.data };
                networkingQueuedRequests.splice(i, 1); //Remove networkingRequests element after fulfilling request
                foundId = true;
                break;
            }
        }
        if (!foundId)
            console.log("Networking | Received packet with no matching id - Ignoring");
    });
    networkClient.on("close", function () {
        mainWindow.webContents.send("networking-status", "disconnected");
        console.log("Networking | Connection closed");
    });
    networkClient.on("error", function (error) {
        console.log("Networking | " + error);
        //Return null to all networking-send events
        networkingQueuedRequests.forEach(function (value) {
            value.event.returnValue = null;
        });
        networkingQueuedRequests = []; //clear queued requests
        mainWindow.webContents.send("networking-status", "disconnected");
    });
    //Start networking
    networkConnect();
    //Event handlers for reconnect and send from renderer process
    electron_2.ipcMain.on("networking-reconnect", function (event, arg) {
        console.log("Networking | Attempting to reconnect");
        networkConnect();
    });
    //Sends specified identifiers with RequestType and returns the response
    electron_2.ipcMain.on("networking-send", function (event, args) {
        var id = networkingId++;
        var dataJson = [];
        //Serialize data into string arrays first
        if (args.data != undefined) {
            dataJson.push(JSON.stringify(args.data));
        }
        var packet = new NetworkingPacket(args.requestType, dataJson, args.identifiers, Date.now(), id);
        //Log the return event in an array for a data reply
        networkingQueuedRequests.push({ id: id, event: event });
        //Serialize into json string and send it to the server
        networkSend(JSON.stringify(packet));
    });
    //Allow for changing of port + hostname
    electron_2.ipcMain.on("networking-info-modify", function (event, arg) {
        //Should receive hostname + port
        networkConfig.port = arg.port;
        networkConfig.hostname = arg.hostname;
        //Reconnect with new settings
        networkDisconnect();
        networkConnect();
    });
}
function networkDisconnect() {
    console.log("Networking | Disconnecting");
    networkClient.end();
}
function networkConnect() {
    mainWindow.webContents.send("networking-status", "connecting");
    console.log("Networking | Connecting");
    //Attempt to establish connection on specified port
    networkClient.connect(networkConfig.port, networkConfig.hostname, function () {
        //connection established
        mainWindow.webContents.send("networking-status", "connected");
        mainWindow.webContents.send("main-ready"); //Inform that network is established
        console.log("Networking | Connection established");
    });
}
function networkSend(str) {
    return networkClient.write(str + "\r\n", function () {
        console.log("Networking | Sent: " + str);
    });
}
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
require("./dataPersistence");
