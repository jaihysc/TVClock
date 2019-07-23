"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var RequestTypes_1 = require("./RequestTypes");
var connectionRefreshButton = document.getElementById("connection-refresh");
var connectionStatusText = document.getElementById("connection-status");
if (connectionRefreshButton != null) {
    connectionRefreshButton.addEventListener("click", function () {
        electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.Reconnect, true);
    });
}
electron_1.ipcRenderer.on(RequestTypes_1.NetworkOperation.SetDisplayAddress, function (event, data) {
    if (data.hostname == "localhost")
        data.hostname = "127.0.0.1";
    $("#connected-server-address").html(data.hostname + ":" + data.port);
});
electron_1.ipcRenderer.on(RequestTypes_1.NetworkingStatus.SetStatus, function (event, data) {
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
