//Main

import {NetworkingStatus, NetworkOperation, RequestType} from "./RequestTypes";
import {StringTags} from "./ViewCommon";
import {Connection} from "./Connection";
import BrowserWindow = Electron.BrowserWindow;

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
    window: BrowserWindow;
    connection: Connection;

    networkConnected: boolean = false;
    readyCallbackUsed: boolean = false; //Whether the initial ready callback was used

    queuedRequests: {id: number; event: any}[]; //Array of send packets awaiting a response
    networkingId: number = 0; //Keeps track of send and received requests

    connectionId: number = 0; //Keeps track of current active connection to avoid listening to events
                                // emitted after a connection has been discarded
    activeConnectionId: number = 0; //Id of active connection, automatically set to the id of the highest connectionId
                                //connection when it emits an event

    hostname: string = "";
    port: number = 0;

    // Buffer to store outbound DataActionPackets
    private dataActionPacketBuffer: DataActionPacket[] = [];  // Add to front, pop from back as the outbound DataActionPackets are sent

    readyCallback: () => void;
    dataCallback: (id: number, response: Buffer) => void;
    closeCallback: (id: number) => void;
    errorCallback: (id: number, str: string) => void;

    constructor(window: BrowserWindow, ready: () => void) {
        this.window = window;

        this.queuedRequests = [];
        this.networkingId = 0;

        this.readyCallback = () => {
            if (!this.readyCallbackUsed) {
                this.readyCallbackUsed = true;
                ready();
            }
        };
        this.dataCallback = (id: number, response: Buffer) => {
            if (response == undefined || id < this.activeConnectionId) //Ignore old connection's events
                return;
            this.checkConnectionId(id);

            console.log("Networking | Received: " + response);

            let returnedPacket: NetworkingPacket;
            try {
                returnedPacket = JSON.parse(response.toString());
                if (returnedPacket == undefined)
                    return;
            } catch (e) {
                console.log("Networking | Error handling received message: " + e);
                return;
            }

            //--------------------------------
            // Handle server responses
            if (returnedPacket.isServer) {
                if (returnedPacket.isResponse) {
                    switch (returnedPacket.requestType) {
                        case RequestType.Get:
                            break;

                        case RequestType.Post:
                            this.dataActionPacketResponse(returnedPacket);
                            break;

                        case RequestType.Update:
                            break;

                    }
                }

                //Handle update requests from the server
                if (returnedPacket.requestType == RequestType.Update) {
                    if (returnedPacket.dataIdentifiers == undefined || returnedPacket.data == undefined)
                        return;

                    let dataItems: any = JSON.parse(returnedPacket.data);
                    for (let i = 0; i < returnedPacket.dataIdentifiers.length; ++ i) {
                        //Update requests will use the channel specified by dataIdentifiers with "-update" appended at the end
                        //schedule-view-scheduleItems would become schedule-view-scheduleItems-update
                        this.window.webContents.send(
                            returnedPacket.dataIdentifiers[i] + StringTags.NetworkingUpdateEvent, dataItems);
                    }
                    return;
                }
            }

            let foundId = false;
            //Find event matching returnedVal id
            for (let i = 0; i < this.queuedRequests.length; ++i) {
                if (this.queuedRequests[i].id === returnedPacket.id) {
                    //Return deserialized server response to caller
                    //Note the data is still in json as it is stored in a string array
                    this.queuedRequests[i].event.returnValue = {identifiers: returnedPacket.dataIdentifiers, data: returnedPacket.data};

                    this.queuedRequests.splice(i, 1); //Remove networkingRequests element after fulfilling request
                    foundId = true;
                    break;
                }
            }

            if (!foundId && returnedPacket.id != -1)
                console.log("Networking | Received packet with no matching id - Ignoring");
        };
        this.closeCallback = (id: number) => {
            if (id < this.activeConnectionId)
                return;
            this.checkConnectionId(id);

            console.log("Networking | Connection closed");
            try {
                this.window.webContents.send(NetworkingStatus.SetStatus, "disconnected");
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

            this.window.webContents.send(NetworkingStatus.SetStatus, "disconnected");
        };

        this.connection = new Connection(this.connectionId++, this.readyCallback, this.dataCallback, this.closeCallback, this.errorCallback);
    }

    private checkConnectionId(id: number) {
        if (id > this.activeConnectionId)
            this.activeConnectionId = id;
    }

    send(event: any, requestType: RequestType, identifiers: string[], data: any[], sendUpdate: boolean = true) {
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

    modifyConfig(hostname: string, port: number) {
        this.hostname = hostname;
        this.port = port;

        //Reconnect with new settings
        this.reconnect();
    }

    connect() {
        if (this.networkConnected || this.connection == undefined)
            return;

        console.log("Networking | Connecting");
        this.window.webContents.send(NetworkingStatus.SetStatus, "connecting");

        //Attempt to establish connection on specified port
        this.connection.connect(this.hostname, this.port, () => {
            console.log("Networking | Connection established");
            this.checkConnectionId(this.connection.id);

            this.networkConnected = true;

            this.window.webContents.send(NetworkingStatus.SetStatus, "connected");

            // Flush away DataActionBuffer using the connection
            this.dataActionPacketBufferFlush();

            //Sets the visible connected address display. e.g 127.0.0.1:4999
            this.window.webContents.send(NetworkOperation.SetDisplayAddress,{
                hostname: this.hostname,
                port: String(this.port)}
            );
        });
    }

    disconnect() {
        if (!this.networkConnected || this.connection == undefined) //Nothing to disconnect from if never connected
            return;

        console.log("Networking | Disconnecting");
        this.networkConnected = false;
        this.connection.disconnect();
    }

    //Disconnects and reestablishes a connection, emitting a Reconnect event for views to refresh their data
    reconnect() {
        //Do not await for connection close if connection is already closed
        if (this.networkConnected && this.connection != undefined) {
            this.disconnect();
            this.reconnectConnection();
        } else {
            this.reconnectConnection();
        }
    }

    private reconnectConnection() {
        this.connection = new Connection(this.connectionId++, () => {
            this.readyCallback(); //Check whether or not initial ready callback has ran,
            this.window.webContents.send(NetworkOperation.Reconnect);

        }, this.dataCallback, this.closeCallback, this.errorCallback);
        this.connect();
    }

    // Buffer methods

    // Adds the dataActionPacket to the beginning of the buffer
    dataActionPacketBufferAdd(dataActionPacket: DataActionPacket): void {
        // Possible pre-processing here?
        this.dataActionPacketBuffer.unshift(dataActionPacket);

        this.dataActionPacketBufferFlush();

        console.log("DataActionPacket has been inserted. Hash:" + dataActionPacket.hash);
    }

    // Attempts to write out and flush the dataActionPacket buffer
    dataActionPacketBufferFlush(): void {
        if (!this.networkConnected)
            return;

        // Send together in one packet for EFFICIENCY!
        let dataStr: string = JSON.stringify(this.dataActionPacketBuffer);  // TOdo, I will make it sent the array instead, I promise
        let dataIdentifiers: string[] = [];

        for (let dataActionPacket of this.dataActionPacketBuffer) {
            dataIdentifiers.push(dataActionPacket.dataIdentifier);
        }

        let packet = new NetworkingPacket(RequestType.Post, dataStr, dataIdentifiers, Date.now(), -1, false);

        let packetString = JSON.stringify(packet);
        this.connection.sendString(packetString, () => {
            console.log("Networking | DataActionPacketBuffer sent: " + packetString);
            console.log("Networking | DataActionPacketBuffer flushed");
        });
    }

    // Handle server responses from flushing the dataActionPacketBuffer
    // Removes packets from the dataActionPacketBuffer which has been acknowledged with a server response
    private dataActionPacketResponse(packet: NetworkingPacket): void {
        if (packet.data == undefined)
            return;

        let responseDataActionPacket: DataActionPacket[] = JSON.parse(packet.data);

        // If returned packet was not a DataActionPacket
        if (!responseDataActionPacket)
            return;

        for (let i = 0; i < this.dataActionPacketBuffer.length; ++i) {
            for (let j = 0; j < responseDataActionPacket.length; ++j) {
                if (this.dataActionPacketBuffer[i].hash == responseDataActionPacket[j].hash)
                    this.dataActionPacketBuffer.splice(i, 1);
            }
        }
    }
}