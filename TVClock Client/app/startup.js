"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var RequestTypes_1 = require("./RequestTypes");
var connectionStatusText = $("#connection-status");
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
var networkingHostname = $("#networking-hostname");
var networkingPort = $("#networking-port");
var networkingUpdateBtn = $("#networking-info-update-btn");
networkingUpdateBtn.on("click", function () {
    if (networkingHostname != null)
        electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.ConfigModify, { hostname: String(networkingHostname.val()), port: Number(networkingPort.val()) });
});
