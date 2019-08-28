export enum RequestType {
    Get = "Get", //Client - Request data from server
    Post = "Post", //Client - Update data on server
    Update = "Update", //Server - Update client data from server
}

export enum NetworkingStatus {
    SetStatusBarText = "status-bar-text-set",
    SetConnectionStatus = "networking-status",
    Ready = "ready",
    Data = "data",
    Close = "close",
    Error = "error",
}

export enum NetworkOperation {
    Send = "networking-send",
    Reconnect = "networking-reconnect",
    ConfigModify = "networking-info-modify",
    SetDisplayAddress = "networking-display-address",
    DataActionPacketBufferAdd = "networking-DataActionPacketBufferAdd",

    ViewDataFetch = "networking-fetch-view-data",
    ViewDataFetchSuccess = "networking-fetch-view-data-success",
    ViewDataFetchFailure = "networking-fetch-view-data-failure"
}