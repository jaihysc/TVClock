"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var dataNode = (function () {
    function dataNode() {
        this.identifier = "";
        this.data = null;
        this.left = null;
        this.right = null;
    }
    return dataNode;
}());
var headNode = new dataNode();
electron_1.ipcMain.on("data-save", function (event, arg) {
    dataAdd(arg.identifier, arg.data);
});
electron_1.ipcMain.on("data-retrieve", function (event, identifier) {
    var foundNode = binaryNodeSearch(headNode, identifier);
    if (foundNode == undefined) {
        event.returnValue = undefined;
        return;
    }
    if (foundNode.identifier != identifier) {
        event.returnValue = undefined;
        return;
    }
    event.returnValue = foundNode.data;
});
function dataAdd(identifier, data) {
    var foundNode = binaryNodeSearch(headNode, identifier);
    foundNode.identifier = identifier;
    foundNode.data = data;
}
function binaryNodeSearch(node, identifier) {
    if (node.identifier == "" || node.identifier == identifier) {
        return node;
    }
    if (identifierCompare(identifier, node.identifier)) {
        if (node.left != null) {
            return binaryNodeSearch(node.left, identifier);
        }
        else {
            node.left = new dataNode();
            return node.left;
        }
    }
    else {
        if (node.right != null) {
            return binaryNodeSearch(node.right, identifier);
        }
        else {
            node.right = new dataNode();
            return node.right;
        }
    }
}
function identifierCompare(identifier1, identifier2) {
    if (identifier1 < identifier2)
        return true;
    else
        return false;
}
