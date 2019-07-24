import {NetworkingStatus, NetworkOperation, RequestType} from "./RequestTypes";
import {Socket} from "net";
import BrowserWindow = Electron.BrowserWindow;

//Handles communication between the client and server

//Class to serialize / deserialize responses to and from the server
class NetworkingPacket {
    requestType: String | undefined;
    data: string[] | undefined;
    dataIdentifiers: string[] | undefined;
    timestamp: number | undefined;
    id: number; //Used for identifying the response, which will be on the same id

    constructor(requestType: RequestType, data: string[], dataIdentifiers: string[], timestamp: number, id: number) {
        this.requestType = requestType;
        this.data = data;
        this.dataIdentifiers = dataIdentifiers;
        this.timestamp = timestamp;
        this.id = id;
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
            } catch (e) {
                console.log("Networking | Error handling received message: " + e);
                return;
            }

            //Handle update requests from the server
            if (returnedPacket.requestType == RequestType.Update) {
                if (returnedPacket.dataIdentifiers == undefined || returnedPacket.data == undefined)
                    return;

                for (let i = 0; i < returnedPacket.dataIdentifiers.length; ++ i) {
                    //Update requests will use the channel specified by dataIdentifiers with "-update" appended at the end
                    //schedule-view-scheduleItems would become schedule-view-scheduleItems-update
                    this.window.webContents.send(
                        returnedPacket.dataIdentifiers[i] + "-update", returnedPacket.data[i]);
                }
                return;
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

            if (!foundId)
                console.log("Networking | Received packet with no matching id - Ignoring");
        };
        this.closeCallback = (id: number) => {
            if (id < this.activeConnectionId)
                return;
            this.checkConnectionId(id);

            console.log("Networking | Connection closed");
            this.window.webContents.send(NetworkingStatus.SetStatus, "disconnected");
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

    send(event: any, requestType: RequestType, identifiers: string[], data: any[]) {
        if (!this.networkConnected || this.connection == undefined) {
            event.returnValue = undefined; //Return undefined because we are not connected
            return;
        }

        let id = this.networkingId++;
        let dataJson: string[] = [];

        //Serialize data into string arrays first
        if (data != undefined) {
            dataJson.push(JSON.stringify(data));
        }

        //Log the return event in an array for a data reply
        this.queuedRequests.push({id: id, event: event});

        //Serialize into json string and send it to the server
        let str = JSON.stringify(new NetworkingPacket(requestType, dataJson, identifiers, Date.now(), id));
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
}

class Connection {
    networkClient: Socket;
    id: number;

    constructor(id: number,
                ready: (id: number) => void, data: (id: number, response: Buffer) => void,
                close: (id: number) => void, error: (id: number, str: string) => void) {
        let net = require("net");
        this.networkClient = new net.Socket();
        this.id = id;

        //Run the callback only once after the first initial connection
        this.networkClient.on(NetworkingStatus.Ready,
            () => { ready(this.id); });

        this.networkClient.on(NetworkingStatus.Data,
            (response: Buffer) => { data(this.id, response) });

        this.networkClient.on(NetworkingStatus.Close,
            () => { close(this.id); });

        this.networkClient.on(NetworkingStatus.Error,
            (str: string) => { error(this.id, str); });
    }

    sendString(str: string, callback: () => void) {
        this.networkClient.write(str + "\r\n", callback);
    }

    connect(hostname: string, port: number, callback: () => void) {
        //Attempt to establish connection on specified port
        this.networkClient.connect(port, hostname, callback);
    }

    disconnect() {
        this.networkClient.end();
    }
}