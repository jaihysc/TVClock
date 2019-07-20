export enum RequestType {
    Get = "Get", //Client - Request data from server
    Response = "Response", //Server - A response to fetch request from server

    Post = "Post", //Client - Update data on server
    Update = "Update", //Server - Update client data from server
}