"use strict";
//Main
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
//Allows other js files to store common data under a identifier so it is not lost on page reload
//Accessed via events
var dataNode = /** @class */ (function () {
    function dataNode() {
        this.identifier = "";
    }
    return dataNode;
}());
//Binary search for adding and retrieving data
var headNode = new dataNode();
electron_1.ipcMain.on("data-store", function (event, arg) {
    dataAdd(arg, arg);
});
electron_1.ipcMain.on("data-retrieve", function (event, identifier) {
    var foundNode = binaryNodeSearch(headNode, identifier);
    if (foundNode == undefined)
        return;
    event.reply("data-retrieve-response", foundNode.data);
});
//Searches for the identifier Returns null if there is no match
function dataAdd(identifier, data) {
    var foundNode = binaryNodeSearch(headNode, identifier);
    foundNode = new dataNode();
    foundNode.identifier = identifier;
    foundNode.data = data;
}
//Returns an  dataNode in the binary tree using the identifier, undefined if it does not exist
function binaryNodeSearch(node, identifier) {
    //if node does not have values, return it
    if (node.identifier == "") {
        return node;
    }
    if (node.identifier == identifier) {
        console.log("Data Persistence | Identifier already exists");
        return;
    }
    //left
    if (identifierCompare(identifier, node.identifier)) {
        //Recursively traverse the nodes until finding a non active node
        if (node.left != undefined) {
            binaryNodeSearch(node.left, identifier);
        }
        else {
            return node.left;
        }
    }
    else {
        //Right
        if (node.right != undefined) {
            binaryNodeSearch(node.right, identifier);
        }
        else {
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
