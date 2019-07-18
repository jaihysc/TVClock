"use strict";
//Main
//Handles communication between the client and server
var RequestType;
(function (RequestType) {
    RequestType[RequestType["Fetch"] = 0] = "Fetch";
    RequestType[RequestType["Response"] = 1] = "Response";
    RequestType[RequestType["Update"] = 2] = "Update";
    RequestType[RequestType["Sync"] = 3] = "Sync";
})(RequestType || (RequestType = {}));
//Class to deseralize responses from the server
var ServerResponse = /** @class */ (function () {
    function ServerResponse() {
    }
    return ServerResponse;
}());
