import { ipcRenderer } from "electron";
import {NetworkOperation} from "./RequestTypes";

//Networking
let networkingHostname = $("#networking-hostname");
let networkingPort = $("#networking-port");
let networkingUpdateBtn = $("#networking-info-update-btn");

//Updating networking status with refresh button click
networkingUpdateBtn.on("click", () => {
    if (networkingHostname != null)
        ipcRenderer.send(NetworkOperation.ConfigModify,
            {hostname: String(networkingHostname.val()), port: Number(networkingPort.val())}
        );
});