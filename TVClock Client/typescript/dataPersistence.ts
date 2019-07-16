//Main

import { ipcMain } from "electron";

//Allows other js files to store common data under a identifier so it is not lost on page reload
//Accessed via events

class dataNode {
    left: dataNode | undefined;
    right: dataNode | undefined;

    identifier: string = "";
    data: any;
}

//Binary search for adding and retrieving data
let headNode: dataNode = new dataNode();

ipcMain.on("data-store", (event: any, arg: any) => {
    dataAdd(arg, arg);
});

ipcMain.on("data-retrieve", (event: any, identifier: string) => {
    let foundNode = binaryNodeSearch(headNode, identifier);
    if (foundNode == undefined)
        return;

    event.reply("data-retrieve-response", foundNode.data);
});

//Searches for the identifier Returns null if there is no match
function dataAdd(identifier: string, data: any) {
    let foundNode = binaryNodeSearch(headNode, identifier);
    foundNode = new dataNode();
    foundNode.identifier = identifier;
    foundNode.data = data;
}

//Returns an  dataNode in the binary tree using the identifier, undefined if it does not exist
function binaryNodeSearch(node: dataNode, identifier: string) {
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
        } else {
            return node.left;
        }
    } else {
        //Right
        if (node.right != undefined) {
            binaryNodeSearch(node.right, identifier);
        } else {
            return node.right;
        }
    }
}

//Returns true if identifier 1 is less than identifier 2
function identifierCompare(identifier1: string, identifier2: string) {
    if (identifier1 < identifier2)
        return true;
    else
        return false;
}