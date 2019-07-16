package networking.models;

public enum RequestType {
    Sync, //Sent by the server to keep all the clients in sync if a change is made in one client
    Update, //Sent by a client to the server to update information
    Fetch //Sent by a client to retrieve the current information
}
