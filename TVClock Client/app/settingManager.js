"use strict";
//Renderer
//Manager for settings view
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var networkingHostname = $("#networking-hostname");
var networkingPort = $("#networking-port");
var networkingUpdateBtn = $("#networking-info-update-btn");
//Updating networking status with refresh button click
networkingUpdateBtn.on("click", function () {
    if (networkingHostname != null)
        electron_1.ipcRenderer.send("networking-info-modify", { hostname: String(networkingHostname.val()), port: Number(networkingPort.val()) });
});
