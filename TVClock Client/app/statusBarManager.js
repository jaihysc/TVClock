"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var connectionRefreshButton = document.getElementById("connection-refresh");
var connectionStatusText = document.getElementById("connection-status");
if (connectionRefreshButton != null) {
    connectionRefreshButton.addEventListener("click", function () {
        electron_1.ipcRenderer.send("networking-reconnect", true);
    });
}
electron_1.ipcRenderer.on("networking-display-address", function (event, data) {
    $("#connected-server-address").html(data.hostname + ":" + data.port);
});
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
