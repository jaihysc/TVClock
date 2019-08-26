import {DataActionItem} from "./NetworkingFunctions";
import {DataAction, DataActionPacket} from "./NetworkManager";

export class DataActionFunctions {
    // Dispatches DataActionsPackets to make their appropriate modifications to the targetArray
    // Returns the item inheriting the DataActionItem class which was modified, undefined if nothing was modified
    public static handleDataActionPacket(dataActionPackets: DataActionPacket[], targetArray: DataActionItem[]): DataActionItem | undefined {
        for (let dataActionPacket of dataActionPackets) {
            switch (dataActionPacket.dataAction) {
                case DataAction.Add:
                    return this.add(targetArray, JSON.parse(dataActionPacket.dataJson));
                    break;

                case DataAction.Edit:
                    return this.edit(targetArray, JSON.parse(dataActionPacket.dataJson));
                    break;

                case DataAction.Remove:
                    this.remove(targetArray, dataActionPacket.hash);
                    break;
            }
        }

        return undefined;
    }

    // These are copies of the methods on the server side
    private static add(targetArray: DataActionItem[], item: DataActionItem): DataActionItem | undefined {
        // Do not add if item with same hash already exists
        for (let i = 0; i < targetArray.length; ++i) {
            if (targetArray[i].hash == item.hash) {
                return undefined;
            }
        }

        targetArray.push(item);
        return item;
    }

    private static edit(targetArray: DataActionItem[], item: DataActionItem): DataActionItem | undefined {
        for (let i = 0; i < targetArray.length; ++i) {
            if (targetArray[i].hash == item.hash) {
                targetArray[i] = item;
                return item;
            }
        }

        return undefined;
    }

    // Does not return the item deleted since the item does not need to be specified in order to delete
    private static remove(targetArray: DataActionItem[], hash: string): void {
        for (let i = 0; i < targetArray.length; ++i) {
            if (targetArray[i].hash == hash) {
                targetArray.splice(i, 1);
                return;
            }
        }
    }
}