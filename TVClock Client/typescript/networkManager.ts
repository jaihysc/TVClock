let connectionRefreshButton = document.getElementById("connection-refresh");
let connectionStatusText = document.getElementById("connection-status");

//Handle connection bar refresh button clicks
if (connectionRefreshButton != null) {
    connectionRefreshButton.addEventListener("click", () =>
    {
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

