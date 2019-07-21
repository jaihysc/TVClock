"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RequestType;
(function (RequestType) {
    RequestType["Get"] = "Get";
    RequestType["Response"] = "Response";
    RequestType["Post"] = "Post";
    RequestType["Update"] = "Update";
})(RequestType = exports.RequestType || (exports.RequestType = {}));
var NetworkOperation;
(function (NetworkOperation) {
    NetworkOperation["Send"] = "networking-send";
})(NetworkOperation = exports.NetworkOperation || (exports.NetworkOperation = {}));
var LocalStorageOperation;
(function (LocalStorageOperation) {
    LocalStorageOperation["Save"] = "data-save";
    LocalStorageOperation["Fetch"] = "data-retrieve";
})(LocalStorageOperation = exports.LocalStorageOperation || (exports.LocalStorageOperation = {}));
