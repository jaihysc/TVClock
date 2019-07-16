"use strict";
//Renderer
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var networkingHostname = $("#networking-hostname");
var networkingPort = $("#networking-port");
var networkingUpdateBtn = $("#networking-info-update-btn");
networkingUpdateBtn.on("click", function () {
    if (networkingHostname != null)
        electron_1.ipcRenderer.send("networking-info-modify", new networkingConfig(String(networkingHostname.val()), Number(networkingPort.val())));
});
var networkingConfig = /** @class */ (function () {
    function networkingConfig(hostname, port) {
        this.hostname = "localhost";
        this.port = 4999;
        this.hostname = hostname;
        this.port = port;
    }
    return networkingConfig;
}());
