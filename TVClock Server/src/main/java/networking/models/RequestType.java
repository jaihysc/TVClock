package networking.models;

public enum RequestType {
    Get, //Sent by a client to retrieve the current information
    Response, //Makes packet as a response from another packet

    Post, //Sent by a client to the server to update information
    Update, //Sent by the server to keep all the clients in sync if a change is made in one client
}
