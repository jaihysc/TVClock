import {ipcRenderer} from "electron";
import {NetworkOperation, RequestType} from "./RequestTypes";
import {DataAction, DataActionPacket} from "./NetworkManager";
const crypto = require("crypto");

export interface DataActionItem {
    hash: string;
}

export class NetworkingFunctions {
    // Sends a packet containing a DataActionPacket to modify lists
    static sendDataActionPacket(actionType: DataAction, dataIdentifier: string, hash: string, data: any): void {
        let dataJSON =  JSON.stringify(data);
        let dataActionPacket = new DataActionPacket(actionType, dataIdentifier, hash, dataJSON);

        ipcRenderer.send(
            NetworkOperation.DataActionPacketBufferAdd,
            {
                dataActionPacket: dataActionPacket
            }
        );
    }

    // Generates hashes, it is important this doesn't create any overlapping hashes
    static createHash(string: string): string {
        // MD5 is ok here as a hash algorithm since this is not used for encryption
        return crypto.createHash('md5').update(string).digest('hex');
    }
}