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
    );

    let hostname = networkingHostname.val();
    if (hostname == "localhost")
        hostname = "127.0.0.1";

    ipcRenderer.send("networking-display-address",
        {hostname: hostname, port: Number(networkingPort.val())}
    );
});