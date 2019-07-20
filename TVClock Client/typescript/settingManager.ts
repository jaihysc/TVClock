//Renderer
//Manager for settings view

import { ipcRenderer } from "electron";

let networkingHostname = $("#networking-hostname");
let networkingPort = $("#networking-port");
let networkingUpdateBtn = $("#networking-info-update-btn");

//Updating networking status with refresh button click
networkingUpdateBtn.on("click", () => {
    if (networkingHostname != null)
    ipcRenderer.send("networking-info-modify",
        {hostname: String(networkingHostname.val()), port: Number(networkingPort.val())}
    )
});

//Networking test
//Run networking after the document is loaded to give the user something to look at
$(function() {
    //Send in async if a return from the server is not needed
    //todo, requesttype is serialized or deserialized incorrectly
    ipcRenderer.send("networking-send", {requestType: "Get", identifiers: ["todo-view-taskList"]});
    // let val = ipcRenderer.sendSync("networking-send", {requestType: 0, identifiers: ["todo-view-taskList"]});
    // console.log(val);
});