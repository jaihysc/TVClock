"use strict";
//Renderer
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron"); //Used to send data to main
//Networking button and text
var connectionRefreshButton = document.getElementById("connection-refresh");
var connectionStatusText = document.getElementById("connection-status");
//Handle connection bar refresh button clicks
if (connectionRefreshButton != null) {
    connectionRefreshButton.addEventListener("click", function () {
        //Send to main to retry networking
        electron_1.ipcRenderer.send("networking-reconnect", true);
    });
}
//Handle the appearance of the status bar depending on networking condition
electron_1.ipcRenderer.on("networking-status", function (event, data) {
    if (connectionStatusText != null) {
        switch (data) {
            case "connecting":
                connectionStatusText.innerHTML = "Connecting...";
                connectionStatusText.style.color = "white";
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
