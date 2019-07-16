//Renderer

import { ipcRenderer } from "electron"; //Used to send data to main

//Networking button and text
let connectionRefreshButton = document.getElementById("connection-refresh");
let connectionStatusText = document.getElementById("connection-status");

//Handle connection bar refresh button clicks
if (connectionRefreshButton != null) {
    connectionRefreshButton.addEventListener("click", () =>
    {
        //Send to main to retry networking
        ipcRenderer.send("networking-reconnect", true);
    });
}

//Handle the appearance of the status bar depending on networking condition
ipcRenderer.on("networking-status", (event: any, data: string) => {
    if (connectionStatusText != null) {
        switch (data) {
            case "connecting":
                connectionStatusText.innerHTML = "Connecting...";
                connectionStatusText.style.color = "white";
                break;
            case "connected":
                connectionStatusText.innerHTML = "Connected";
                connectionStatusText.style.color = "limegreen";
                break;
            case "disconnected":
                connectionStatusText.innerHTML = "Disconnected";
                connectionStatusText.style.color = "darkgray";
                break;
            default:
                console.log("An invalid networking-status was received");
                break;
        }
    }
});