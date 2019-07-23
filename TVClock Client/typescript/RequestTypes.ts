export enum RequestType {
    Get = "Get", //Client - Request data from server
    Response = "Response", //Server - A response to fetch request from server

    Post = "Post", //Client - Update data on server
    Update = "Update", //Server - Update client data from server
}

export enum NetworkingStatus {
    SetStatus = "networking-status",
    Ready = "ready",
    Data = "data",
    Close = "close",
    Error = "error",
}

export enum NetworkOperation {
    Send = "networking-send",
    Reconnect = "networking-reconnect",
    ConfigModify = "networking-info-modify",
    SetDisplayAddress = "networking-display-address"

}

export enum LocalStorageOperation {
    Save = "data-save", //Save to local storage
    Fetch = "data-retrieve" //Fetch from local storage
}