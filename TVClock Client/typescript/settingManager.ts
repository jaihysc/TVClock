//Renderer

import { ipcRenderer } from "electron";

let networkingHostname = $("#networking-hostname");
let networkingPort = $("#networking-port");
let networkingUpdateBtn = $("#networking-info-update-btn");

networkingUpdateBtn.on("click", () => {
    if (networkingHostname != null)
    ipcRenderer.send("networking-info-modify", new networkingConfig(
        String(networkingHostname.val()), Number(networkingPort.val()))
    )
});

class networkingConfig {
    constructor(hostname: string, port: number) {
        this.hostname = hostname;
        this.port = port;
    }
    hostname: string = "localhost";
    port: number = 4999;
}