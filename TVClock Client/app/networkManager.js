"use strict";
var connectionRefreshButton = document.getElementById("connection-refresh");
var connectionStatusText = document.getElementById("connection-status");
//Handle connection bar refresh button clicks
if (connectionRefreshButton != null) {
    connectionRefreshButton.addEventListener("click", function () {
        networkConnect();
    });
}
//Start networking
networkConnect();
function networkConnect() {
    //Catch nulls
    if (connectionStatusText == null)
        return;
    //connection established
    connectionStatusText.innerHTML = "Connected";
    connectionStatusText.style.color = "limegreen";
    //connection failed
    connectionStatusText.innerHTML = "Disconnected";
    connectionStatusText.style.color = "darkgray";
}
