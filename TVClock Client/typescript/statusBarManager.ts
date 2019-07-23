//Renderer

import { ipcRenderer } from "electron"; //Used to send data to main
import {NetworkingStatus, NetworkOperation} from "./RequestTypes";

//Networking button and text
let connectionRefreshButton = $("#connection-refresh");
let connectionStatusText = $("#connection-status");

//Handle connection bar refresh button clicks
if (connectionRefreshButton != null) {
    connectionRefreshButton.on("click", () =>
    {
        //Send to main to retry networking
        ipcRenderer.send(NetworkOperation.Reconnect, true);
    });
}


ipcRenderer.on(NetworkOperation.SetDisplayAddress, (event: any, data: {hostname: string; port: string}) => {
    if (data.hostname == "localhost")
        data.hostname = "127.0.0.1";
    $("#connected-server-address").html(`${data.hostname}:${data.port}`);
});

//Handle the appearance of the status bar depending on networking condition
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