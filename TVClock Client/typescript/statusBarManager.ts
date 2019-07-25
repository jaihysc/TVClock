//Renderer

import { ipcRenderer } from "electron"; //Used to send data to main
import {NetworkingStatus, NetworkOperation} from "./RequestTypes";

//Handle the appearance of the status bar depending on networking condition
export class StatusBarManager {
    static addConnectionStatusElement(textElement: JQuery<HTMLElement>) {
        ipcRenderer.on(NetworkingStatus.SetStatus, (event: any, data: string) => {
            if (textElement == null)
                return;
            switch (data) {
                case "connecting":
                    textElement.html("Connecting...");
                    textElement.css("color", "white");
                    break;
                case "connected":
                    textElement.html("Connected");
                    textElement.css("color", "limegreen");
                    break;
                case "disconnected":
                    textElement.html("Disconnected");
                    textElement.css("color", "darkgray");
                    break;
                default:
                    console.log("An invalid networking-status was received");
                    break;
            }
        });
    }
}

//Networking button and text
let connectionRefreshButton = $("#connection-refresh");

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

StatusBarManager.addConnectionStatusElement($("#connection-status"));