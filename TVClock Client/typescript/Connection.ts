import {Socket} from "net";
import {NetworkingStatus} from "./RequestTypes";

export class Connection {
    networkClient: Socket;
    id: number;

    constructor(id: number,
                ready: (id: number) => void, data: (id: number, response: string) => void,
                close: (id: number) => void, error: (id: number, str: string) => void) {
        let net = require("net");
        this.networkClient = new net.Socket();
        this.id = id;

        //Run the callback only once after the first initial connection
        this.networkClient.on(NetworkingStatus.Ready,
            () => { ready(this.id); });

        this.networkClient.on(NetworkingStatus.Data,
            (response: string) => { data(this.id, response) });

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