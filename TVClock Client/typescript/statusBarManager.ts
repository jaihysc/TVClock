//Renderer

import { ipcRenderer } from "electron"; //Used to send data to main
import {NetworkingStatus, NetworkOperation} from "./RequestTypes";

//Handle the appearance of the status bar depending on networking condition
export class StatusBarManager {
    public static addConnectionStatusElement(textElement: JQuery<HTMLElement>) {
        ipcRenderer.on(NetworkingStatus.SetConnectionStatus, (event: any, data: string) => {
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

                // Use user provided text as html if none is provided
                default:
                    textElement.html(data);
                    textElement.css("color", "white");
                    break;
            }
        });
    }
}
StatusBarManager.addConnectionStatusElement($("#connection-status"));

//Networking button and text
let connectionRefreshButton = $("#connection-refresh");

//Handle connection bar refresh button clicks
if (connectionRefreshButton != null) {
    connectionRefreshButton.on("click", () => {
        //Send to main to retry networking
        ipcRenderer.send(NetworkOperation.Reconnect, true);
    });
}

// Add F5 as shortcut for refresh button
$(document).on("keyup", (event: any) => {
    if (event.keyCode === 116)  // F5 key
        ipcRenderer.send(NetworkOperation.Reconnect, true);
});

// Status bar middle text
let statusBarText = $("#status-bar-middle-text");

ipcRenderer.on(NetworkingStatus.SetStatusBarText, (event: any, data: string) => {
    statusBarText.text(data);
});

ipcRenderer.on(NetworkOperation.SetDisplayAddress, (event: any, data: {hostname: string; port: string}) => {
    if (data.hostname == "localhost")
        data.hostname = "127.0.0.1";
    $("#connected-server-address").html(`${data.hostname}:${data.port}`);
});