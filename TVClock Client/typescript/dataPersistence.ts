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

ipcMain.on("data-save", (event: any, arg: { identifier: string; data: any; }) => {
    dataAdd(arg.identifier, arg.data);
});

ipcMain.on("data-retrieve", (event: any, identifier: string) => {
    let foundNode = binaryNodeSearch(headNode, identifier);

    //Send back an undefined response if it failed to find a node
    if (foundNode == undefined) {
        event.reply("data-retrieve-response", undefined);
        return;
    }

    if (foundNode.identifier != identifier) {
        event.reply("data-retrieve-response", undefined);
        return;
    }

    event.reply("data-retrieve-response", foundNode.data);
});

//Searches for the identifier Returns null if there is no match
function dataAdd(identifier: string, data: any) {
    let foundNode = binaryNodeSearch(headNode, identifier);
    if (foundNode != undefined) {
        foundNode.identifier = identifier;
        foundNode.data = data;
    }
}

//Returns an  dataNode in the binary tree using the identifier, undefined if it does not exist
function binaryNodeSearch(node: dataNode, identifier: string) {
    //if node does not have values, return it
    if (node.identifier == "" || node.identifier == identifier) {
        return node;
    }

    //left
    if (identifierCompare(identifier, node.identifier)) {
        //Recursively traverse the nodes until finding a non active node
        if (node.left != undefined) {
            binaryNodeSearch(node.left, identifier);
        } else {
            node.left = new dataNode();
            return node.left;
        }
    } else {
        //Right
        if (node.right != undefined) {
            binaryNodeSearch(node.right, identifier);
        } else {
            node.right = new dataNode();
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