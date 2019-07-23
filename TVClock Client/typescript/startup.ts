import { ipcRenderer } from "electron";
import {NetworkingStatus, NetworkOperation} from "./RequestTypes";

//Networking
let connectionStatusText = $("#connection-status");

ipcRenderer.on(NetworkingStatus.SetStatus, (event: any, data: string) => {
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