"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var RequestTypes_1 = require("./RequestTypes");
var networkingHostname = $("#networking-hostname");
var networkingPort = $("#networking-port");
var networkingUpdateBtn = $("#networking-info-update-btn");
networkingUpdateBtn.on("click", function () {
    if (networkingHostname != null)
        electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.ConfigModify, { hostname: String(networkingHostname.val()), port: Number(networkingPort.val()) });
    var hostname = networkingHostname.val();
    if (hostname == "localhost")
        hostname = "127.0.0.1";
    electron_1.ipcRenderer.send("networking-display-address", { hostname: hostname, port: Number(networkingPort.val()) });
});
