"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RequestType;
(function (RequestType) {
    RequestType["Get"] = "Get";
    RequestType["Response"] = "Response";
    RequestType["Post"] = "Post";
    RequestType["Update"] = "Update";
})(RequestType = exports.RequestType || (exports.RequestType = {}));
var NetworkingStatus;
(function (NetworkingStatus) {
    NetworkingStatus["SetStatus"] = "networking-status";
    NetworkingStatus["Ready"] = "ready";
    NetworkingStatus["Data"] = "data";
    NetworkingStatus["Close"] = "close";
    NetworkingStatus["Error"] = "error";
})(NetworkingStatus = exports.NetworkingStatus || (exports.NetworkingStatus = {}));
var NetworkOperation;
(function (NetworkOperation) {
    NetworkOperation["Send"] = "networking-send";
    NetworkOperation["Reconnect"] = "networking-reconnect";
    NetworkOperation["ConfigModify"] = "networking-info-modify";
    NetworkOperation["SetDisplayAddress"] = "networking-display-address";
})(NetworkOperation = exports.NetworkOperation || (exports.NetworkOperation = {}));
var LocalStorageOperation;
(function (LocalStorageOperation) {
    LocalStorageOperation["Save"] = "data-save";
    LocalStorageOperation["Fetch"] = "data-retrieve";
})(LocalStorageOperation = exports.LocalStorageOperation || (exports.LocalStorageOperation = {}));
