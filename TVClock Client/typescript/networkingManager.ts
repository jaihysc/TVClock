//Main
//Handles communication between the client and server

enum RequestType {
    Fetch, //Client - Request data from server
    Response, //Server - A response to fetch request from server

    Update, //Client - Update data on server
    Sync, //Server - Update client data from server
}

//Class to deserialize responses from the server
class ServerResponse {
    requestType: RequestType | undefined;
    data: any[] | undefined;
    dataIdentifiers: string[] | undefined;
    timestamp: Date | undefined;
}