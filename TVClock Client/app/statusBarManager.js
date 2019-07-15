"use strict";
//Renderer
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
//Networking button and text
var electron = __importStar(require("electron"));
var connectionRefreshButton = document.getElementById("connection-refresh");
var connectionStatusText = document.getElementById("connection-status");
//Used to send data to main
var ipcRenderer = electron.ipcRenderer;
//Handle connection bar refresh button clicks
if (connectionRefreshButton != null) {
    connectionRefreshButton.addEventListener("click", function () {
        //Send to main to retry networking
        ipcRenderer.send("networking-reconnect", true);
    });
}
//Handle the appearance of the status bar depending on networking condition
ipcRenderer.on("networking-status", function (event, data) {
    if (connectionStatusText != null) {
        switch (data) {
            case "connecting":
                connectionStatusText.innerHTML = "Connecting...";
                break;
            case "connected":
                connectionStatusText.innerHTML = "Connected";
                connectionStatusText.style.color = "limegreen";
                break;
            case "disconnected":
                connectionStatusText.innerHTML = "Disconnected";
                connectionStatusText.style.color = "darkgray";
                break;
            default:
                console.log("An invalid networking-status was received");
                break;
        }
    }
});
