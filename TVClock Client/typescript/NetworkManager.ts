//Main

import {NetworkingStatus, NetworkOperation, RequestType} from "./RequestTypes";
import {StringTags} from "./ViewCommon";
import {Connection} from "./Connection";
import BrowserWindow = Electron.BrowserWindow;
import {ipcMain} from "electron";

//Handles communication between the client and server

//Class to serialize / deserialize responses to and from the server
class NetworkingPacket {
    requestType: string | undefined;
    isResponse: boolean = false;
    isServer: boolean = false;
    data: string | undefined; //Data is stored as a json string
    dataIdentifiers: string[] | undefined;
    timestamp: number | undefined;
    id: number; //Used for identifying the response, which will be on the same id
    sendUpdate: boolean; //Whether or not the server should send a update request to other connect clients

    constructor(requestType: RequestType, data: string, dataIdentifiers: string[], timestamp: number, id: number, sendUpdate: boolean = true) {
        this.requestType = requestType;
        this.data = data;
        this.dataIdentifiers = dataIdentifiers;
        this.timestamp = timestamp;
        this.id = id;
        this.sendUpdate = sendUpdate;
    }
}


export enum DataAction {
    Add = "Add", // Must use the enum string names when serializing to JSON or else the server can't deserialize it
    Edit = "Edit",
    Remove = "Remove"
}
export class DataActionPacket {
    dataAction: DataAction;
    dataIdentifier: string;
    hash: string;
    dataJson: string;

    constructor(dataAction: DataAction, dataIdentifier: string, hash: string, dataJson: string) {
        this.dataAction = dataAction;
        this.dataIdentifier = dataIdentifier;
        this.hash = hash;
        this.dataJson = dataJson;
    }
}

export class NetworkManager {
    private static window: BrowserWindow;
    private static connection: Connection;

    private static networkConnected: boolean = false;
    private static readyCallbackUsed: boolean = false; //Whether the initial ready callback was used

    private static queuedRequests: {id: number; event: any}[]; //Array of send packets awaiting a response
    private static networkingId: number = 0; //Keeps track of send and received requests

    private static connectionId: number = 0; //Keeps track of current active connection to avoid listening to events
                                // emitted after a connection has been discarded
    private static activeConnectionId: number = 0; //Id of active connection, automatically set to the id of the highest connectionId
                                //connection when it emits an event

    public static hostname: string = "";
    public static port: number = 0;

    // Buffer to store outbound DataActionPackets
    private static dataActionPacketBuffer: DataActionPacket[] = [];  // Add to front, pop from back as the outbound DataActionPackets are sent

    private static readyCallback: () => void;
    private static dataCallback: (id: number, response: string) => void;
    private static closeCallback: (id: number) => void;
    private static errorCallback: (id: number, str: string) => void;

    public static init(window: BrowserWindow, ready: () => void): void {
        this.window = window;

        this.queuedRequests = [];
        this.networkingId = 0;

        this.readyCallback = () => {
            this.readyCallbackUsed = true;
            ready();
        };
        this.dataCallback = (id: number, responseJson: string) => {
            if (responseJson == undefined || id < this.activeConnectionId) //Ignore old connection's events
                return;
            this.checkConnectionId(id);

            // If multiple packets are chained together, split them
            // They often get chained when a DataActionPacket response and an update request are sent by the server in rapid succession
            let responses: string[] = responseJson.toString().split('\n');
            responses.pop();  // .split() Always seems to create 1 additional blank element
            console.log("Networking | Received [" + responses.length + "]: " + responseJson);

            let packets: NetworkingPacket[] = [];
            for (let str of responses)
                try {
                    packets.push(JSON.parse(str));
                } catch (e) {
                    // console.log("Networking | Error handling received message: " + e);  // Prints false positive error message at times if there are extra newline characters
                }

            for (let packet of packets)
                this.processReceivedPacket(packet);
        };
        this.closeCallback = (id: number) => {
            if (id < this.activeConnectionId)
                return;
            this.checkConnectionId(id);

            console.log("Networking | Connection closed");
            try {
                this.window.webContents.send(NetworkingStatus.SetConnectionStatus, "disconnected");
            } catch {
                console.log("Networking | Connection closed, failed to send disconnect status");
            }
        };
        this.errorCallback = (id: number, str: string) => {
            if (id < this.activeConnectionId)
                return;
            this.checkConnectionId(id);

            console.log("Networking | " + str);
            this.disconnect();

            //Return null to all networking-send events
            this.queuedRequests.forEach(value => {
                value.event.returnValue = null;
            });
            this.queuedRequests = []; //clear queued requests

            this.window.webContents.send(NetworkingStatus.SetConnectionStatus, "disconnected");
        };

        this.connection = new Connection(this.connectionId++, this.readyCallback, this.dataCallback, this.closeCallback, this.errorCallback);
    }

    // TOdo, refactor this
    private static processReceivedPacket(packet: NetworkingPacket): void {
        // Handle server responses
        if (packet.isServer) {
            if (packet.isResponse) {
                switch (packet.requestType) {
                    case RequestType.Get:
                        break;

                    case RequestType.Post:
                        this.dataActionPacketResponse(packet);
                        break;

                    case RequestType.Update:
                        break;
                }
            }

            //Handle update requests from the server
            if (packet.requestType == RequestType.Update) {
                if (packet.dataIdentifiers == undefined || packet.data == undefined)
                    return;

                let dataItems: any = JSON.parse(packet.data);
                for (let i = 0; i < packet.dataIdentifiers.length; ++i) {
                    //Update requests will use the channel specified by dataIdentifiers with "-update" appended at the end
                    //schedule-view-scheduleItems would become schedule-view-scheduleItems-update
                    this.window.webContents.send(
                        packet.dataIdentifiers[i] + StringTags.NetworkingUpdateEvent, dataItems);
                }
                return;
            }
        }

        let foundId = false;
        //Find event matching returnedVal id
        for (let i = 0; i < this.queuedRequests.length; ++i) {
            if (this.queuedRequests[i].id === packet.id) {
                //Return deserialized server response to caller
                //Note the data is still in json as it is stored in a string array
                this.queuedRequests[i].event.returnValue = {
                    identifiers: packet.dataIdentifiers,
                    data: packet.data
                };

                this.queuedRequests.splice(i, 1); //Remove networkingRequests element after fulfilling request
                foundId = true;
                break;
            }
        }

        if (!foundId && packet.id != -1)
            console.log("Networking | Received packet with no matching id - Ignoring");
    }

    private static checkConnectionId(id: number): void {
        if (id > this.activeConnectionId)
            this.activeConnectionId = id;
    }

    public static send(event: any, requestType: RequestType, identifiers: string[], data: any[], sendUpdate: boolean = true): void {
        if (!this.networkConnected || this.connection == undefined) {
            event.returnValue = undefined; //Return undefined because we are not connected
            return;
        }

        let id = this.networkingId++;

        //Log the return event in an array for a data reply
        this.queuedRequests.push({id: id, event: event});

        //Serialize into json string and send it to the server
        let str = JSON.stringify(new NetworkingPacket(requestType, JSON.stringify(data), identifiers, Date.now(), id, sendUpdate));
        this.connection.sendString(str, () => {
            console.log("Networking | Sent: " + str);
        });
    }

    public static modifyConfig(hostname: string, port: number): void {
        this.hostname = hostname;
        this.port = port;

        //Reconnect with new settings
        this.reconnect();
    }

    public static connect(): void {
        if (this.networkConnected || this.connection == undefined)
            return;

        console.log("Networking | Connecting");
        this.window.webContents.send(NetworkingStatus.SetConnectionStatus, "connecting");

        //Attempt to establish connection on specified port
        this.connection.connect(this.hostname, this.port, () => {
            console.log("Networking | Connection established");
            this.checkConnectionId(this.connection.id);

            this.networkConnected = true;

            this.window.webContents.send(NetworkingStatus.SetConnectionStatus, "connected");

            // Flush away DataActionBuffer using the connection
            this.dataActionPacketBufferFlush();

            //Sets the visible connected address display. e.g 127.0.0.1:4999
            this.window.webContents.send(NetworkOperation.SetDisplayAddress,{
                hostname: this.hostname,
                port: String(this.port)}
            );
        });
    }

    public static disconnect(): void {
        if (!this.networkConnected || this.connection == undefined) //Nothing to disconnect from if never connected
            return;

        console.log("Networking | Disconnecting");
        this.networkConnected = false;
        this.connection.disconnect();
    }

    //Disconnects and reestablishes a connection, emitting a Reconnect event for views to refresh their data
    public static reconnect(): void {
        //Do not await for connection close if connection is already closed
        if (this.networkConnected && this.connection != undefined) {
            this.disconnect();
            this.reconnectConnection();
        } else {
            this.reconnectConnection();
        }
    }

    private static reconnectConnection(): void {
        this.connection = new Connection(this.connectionId++, () => {
            // Run ready callback only once
            if (!this.readyCallbackUsed) {
                this.readyCallback();
            } else {
                // Run this after the first successful connection
                this.fetchViewData();
            }
        }, this.dataCallback, this.closeCallback, this.errorCallback);
        this.connect();
    }

    public static fetchViewData(): void {
        // Fetch view data
        this.window.webContents.send(NetworkingStatus.SetStatusBarText, "Fetching data from server...");

        // Event handler for this located in renderer.ts
        this.window.webContents.send(NetworkOperation.ViewDataFetch);  // Emits event startup-fetch-view-data-success | or startup-fetch-view-data-failed

        ipcMain.on(NetworkOperation.ViewDataFetchSuccess, () => {
            this.window.webContents.send(NetworkingStatus.SetStatusBarText, "");
            this.window.webContents.send(NetworkOperation.Reconnect);
        });

        ipcMain.on(NetworkOperation.ViewDataFetchFailure, () => {
            this.window.webContents.send(NetworkingStatus.SetStatusBarText, "Fetching data from server timed out");
        });
    }

    // Buffer methods

    // Adds the dataActionPacket to the beginning of the buffer
    public static dataActionPacketBufferAdd(dataActionPacket: DataActionPacket): void {
        // Possible pre-processing here?
        this.dataActionPacketBuffer.unshift(dataActionPacket);

        this.dataActionPacketBufferFlush();

        console.log("DataActionPacket has been inserted. Hash:" + dataActionPacket.hash);
    }

    // Attempts to write out and flush the dataActionPacket buffer
    public static dataActionPacketBufferFlush(): void {
        if (!this.networkConnected || this.dataActionPacketBuffer.length <= 0)
            return;

        // Send together in one packet for EFFICIENCY!
        let dataStr: string = JSON.stringify(this.dataActionPacketBuffer);  // TOdo, I will make it sent the array instead, I promise
        let dataIdentifiers: string[] = [];

        for (let dataActionPacket of this.dataActionPacketBuffer) {
            dataIdentifiers.push(dataActionPacket.dataIdentifier);
        }

        let packet = new NetworkingPacket(RequestType.Post, dataStr, dataIdentifiers, Date.now(), -1, true);

        let packetString = JSON.stringify(packet);
        this.connection.sendString(packetString, () => {
            console.log("Networking | DataActionPacketBuffer sent: " + packetString);
            console.log("Networking | DataActionPacketBuffer flushed");
        });
    }

    // Handle server responses from flushing the dataActionPacketBuffer
    // Removes packets from the dataActionPacketBuffer which has been acknowledged with a server response
    private static dataActionPacketResponse(packet: NetworkingPacket): void {
        if (packet.data == undefined || packet.requestType != RequestType.Post)
            return;

        let responseDataActionPacket: DataActionPacket[] = JSON.parse(packet.data);

        if (!responseDataActionPacket)  // If returned packet was not a DataActionPacket
            return;

        for (let j = 0; j < responseDataActionPacket.length; ++j) {
            for (let i = this.dataActionPacketBuffer.length - 1; i >= 0; --i) {
                if (this.dataActionPacketBuffer[i].hash == responseDataActionPacket[j].hash)
                    this.dataActionPacketBuffer.splice(i, 1);
            }
        }

        if (this.dataActionPacketBuffer.length <= 0)
            console.log("Networking | DataActionPacketBuffer cleared");
    }
}