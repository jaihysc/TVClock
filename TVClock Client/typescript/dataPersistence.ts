//Main

import { ipcMain } from "electron";
import {LocalStorageOperation} from "./RequestTypes";

//Allows other js files to store common data under a identifier so it is not lost on page reload
//Accessed via events

class dataNode {
    left: dataNode | null;
    right: dataNode | null;

    identifier: string;
    data: any;

    constructor() {
        this.identifier = "";
        this.data = null;
        this.left = null;
        this.right = null;
    }
}

//Binary search for adding and retrieving data
let headNode: dataNode = new dataNode();

ipcMain.on(LocalStorageOperation.Save, (event: any, arg: { identifier: string; data: any; }) => {
    dataAdd(arg.identifier, arg.data);
    event.returnValue = undefined;
});

ipcMain.on(LocalStorageOperation.Fetch, (event: any, identifier: string) => {
    let foundNode = binaryNodeSearch(headNode, identifier);

    //Send back an undefined response if it failed to find a node
    if (foundNode == undefined || foundNode.identifier != identifier) {
        event.returnValue = undefined;
        return;
    }

    event.returnValue = foundNode.data;
});

//Searches for the identifier Returns null if there is no match
function dataAdd(identifier: string, data: any) {
    let foundNode = binaryNodeSearch(headNode, identifier);
    foundNode.identifier = identifier;
    foundNode.data = data;
}

//Returns an  dataNode in the binary tree using the identifier, undefined if it does not exist
function binaryNodeSearch(node: dataNode, identifier: string): dataNode {
    //if node does not have an identifier or is copy of existing identifier, return it
    if (node.identifier == "" || node.identifier == identifier) {
        return node;
    }

    //left
    if (identifierCompare(identifier, node.identifier)) {
        //Recursively traverse the nodes until finding a non active node
        if (node.left != null) {
            return binaryNodeSearch(node.left, identifier);
        } else {
            node.left = new dataNode();
            return node.left;
        }
    } else {
        //Right
        if (node.right != null) {
            return binaryNodeSearch(node.right, identifier);
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