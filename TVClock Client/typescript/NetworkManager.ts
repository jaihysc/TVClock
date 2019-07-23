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

class NetworkingConfig {
    hostname: string;
    port: number;
    constructor(hostname: string, port: number) {
        this.hostname = hostname;
        this.port = port;
    }
}

export class NetworkManager {
    networkClient: Socket;
    window: BrowserWindow;

    networkConfig: NetworkingConfig;
    queuedRequests: {id: number; event: any}[]; //Array of send packets awaiting a response
    networkingId: number = 0;
    callback: () => void; //Function returning void

    networkConnected: boolean = false;

    constructor(window: BrowserWindow, callback: () => void) {
        let net = require("net");
        this.networkClient = new net.Socket();
        this.window = window;

        this.networkConfig = new NetworkingConfig("", 0);

        this.queuedRequests = [];
        this.networkingId = 0;
        this.callback = callback;

        //Start networking
        this.initialize();
    }

    initialize() {
        //Events
        this.networkClient.on(NetworkingStatus.Data, (response: Buffer) => {
            if (response == undefined)
                return;

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
        });

        //Run the callback only once after the first initial connection
        this.networkClient.once(NetworkingStatus.Ready, () => {
            this.callback();
        });

        this.networkClient.on(NetworkingStatus.Close, () => {
            console.log("Networking | Connection closed");
            this.disconnect();
            this.window.webContents.send(NetworkingStatus.SetStatus, "disconnected");
        });

        this.networkClient.on(NetworkingStatus.Error, (error: string) => {
            console.log("Networking | " + error);
            this.disconnect();

            //Return null to all networking-send events
            this.queuedRequests.forEach(value => {
                value.event.returnValue = null;
            });
            this.queuedRequests = []; //clear queued requests

            this.window.webContents.send(NetworkingStatus.SetStatus, "disconnected");
        });
    }

    send(event: any, requestType: RequestType, identifiers: string[], data: any[]) {
        if (!this.networkConnected) {
            //Return undefined because we are not connected
            event.returnValue = undefined;
            return;
        }

        let id = this.networkingId++;
        let dataJson: string[] = [];

        //Serialize data into string arrays first
        if (data != undefined) {
            dataJson.push(JSON.stringify(data));
        }

        let packet = new NetworkingPacket(requestType, dataJson, identifiers, Date.now(), id);

        //Log the return event in an array for a data reply
        this.queuedRequests.push({id: id, event: event});

        //Serialize into json string and send it to the server
        let str = JSON.stringify(packet);
        this.sendString(str);
    }

    sendString(str: string) {
        // console.log("Networking | Buffering: " + str);
        this.networkClient.write(str + "\r\n", () => { //Make sure to include \r\n so the server recognises it as a message
            console.log("Networking | Sent: " + str);
        });
    }

    modifyConfig(hostname: string, port: number) {
        this.networkConfig.hostname = hostname;
        this.networkConfig.port = port;

        //Reconnect with new settings
        this.reconnect();
    }

    connect() {
        if (this.networkConnected)
            return;

        console.log("Networking | Connecting");
        this.window.webContents.send(NetworkingStatus.SetStatus, "connecting");

        //Attempt to establish connection on specified port
        this.networkClient.connect(this.networkConfig.port, this.networkConfig.hostname, () => {
            console.log("Networking | Connection established");

            this.networkConnected = true;

            this.window.webContents.send(NetworkingStatus.SetStatus, "connected");
            this.window.webContents.send(NetworkOperation.SetDisplayAddress,{
                hostname: this.networkConfig.hostname,
                port: String(this.networkConfig.port)}
            );
        });
    }

    disconnect() {
        if (!this.networkConnected) //Nothing to disconnect from if never connected
            return;

        console.log("Networking | Disconnecting");
        this.networkConnected = false;
        this.networkClient.end();
    }

    reconnect() {
        //Do not await for connection close if connection is already closed
        if (this.networkConnected) {
            this.disconnect();
            this.networkClient.once(NetworkingStatus.Close, () => {
                this.connectWithEvent();
            });
        } else {
            this.connectWithEvent();
        }
    }

    private connectWithEvent() {
        this.connect();
        this.networkClient.once(NetworkingStatus.Ready, () => {
            //Send reconnect event out so views can refresh their data
            this.window.webContents.send(NetworkOperation.Reconnect);
        });
    }
}