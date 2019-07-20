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
//Networking test
//Run networking after the document is loaded to give the user something to look at
$(function () {
    //Send in async if a return from the server is not needed
    //todo, requesttype is serialized or deserialized incorrectly
    electron_1.ipcRenderer.send("networking-send", { requestType: "Get", identifiers: ["todo-view-taskList"] });
    // let val = ipcRenderer.sendSync("networking-send", {requestType: 0, identifiers: ["todo-view-taskList"]});
    // console.log(val);
});
