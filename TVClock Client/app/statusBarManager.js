"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var RequestTypes_1 = require("./RequestTypes");
var connectionRefreshButton = $("#connection-refresh");
var connectionStatusText = $("#connection-status");
if (connectionRefreshButton != null) {
    connectionRefreshButton.on("click", function () {
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
                connectionStatusText.html("Connecting...");
                connectionStatusText.css("color", "white");
                break;
            case "connected":
                connectionStatusText.html("Connected");
                connectionStatusText.css("color", "limegreen");
                break;
            case "disconnected":
                connectionStatusText.html("Disconnected");
                connectionStatusText.css("color", "darkgray");
                break;
            default:
                console.log("An invalid networking-status was received");
                break;
        }
    }
});
