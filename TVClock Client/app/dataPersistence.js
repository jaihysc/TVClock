"use strict";
//Main
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
//Allows other js files to store common data under a identifier so it is not lost on page reload
//Accessed via events
var dataNode = /** @class */ (function () {
    function dataNode() {
        this.identifier = "";
        this.data = null;
        this.left = null;
        this.right = null;
    }
    return dataNode;
}());
//Binary search for adding and retrieving data
var headNode = new dataNode();
electron_1.ipcMain.on("data-save", function (event, arg) {
    dataAdd(arg.identifier, arg.data);
});
electron_1.ipcMain.on("data-retrieve", function (event, identifier) {
    var foundNode = binaryNodeSearch(headNode, identifier);
    //Send back an undefined response if it failed to find a node
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
//Searches for the identifier Returns null if there is no match
function dataAdd(identifier, data) {
    var foundNode = binaryNodeSearch(headNode, identifier);
    foundNode.identifier = identifier;
    foundNode.data = data;
}
//Returns an  dataNode in the binary tree using the identifier, undefined if it does not exist
function binaryNodeSearch(node, identifier) {
    //if node does not have an identifier or is copy of existing identifier, return it
    if (node.identifier == "" || node.identifier == identifier) {
        return node;
    }
    //left
    if (identifierCompare(identifier, node.identifier)) {
        //Recursively traverse the nodes until finding a non active node
        if (node.left != null) {
            return binaryNodeSearch(node.left, identifier);
        }
        else {
            node.left = new dataNode();
            return node.left;
        }
    }
    else {
        //Right
        if (node.right != null) {
            return binaryNodeSearch(node.right, identifier);
        }
        else {
            node.right = new dataNode();
            return node.right;
        }
    }
}
//Returns true if identifier 1 is less than identifier 2
function identifierCompare(identifier1, identifier2) {
    if (identifier1 < identifier2)
        return true;
    else
        return false;
}
