import {DataActionItem} from "./NetworkingFunctions";
import {DataAction, DataActionPacket} from "./NetworkManager";

export class DataActionFunctions {
    // Dispatches DataActionsPackets to make their appropriate modifications to the targetArray
    // Returns the item inheriting the DataActionItem class which was modified, undefined if nothing was modified
    public static handleDataActionPacket(dataActionPackets: DataActionPacket[], targetArray: DataActionItem[]): DataActionItem | undefined {
        for (let dataActionPacket of dataActionPackets) {
            let data = JSON.parse(dataActionPacket.dataJson);

            switch (dataActionPacket.dataAction) {
                case DataAction.Add:
                    return this.add(targetArray, data);
                    break;

                case DataAction.Edit:
                    return this.edit(targetArray, data);
                    break;

                case DataAction.Remove:
                    return this.remove(targetArray, data);
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

    private static remove(targetArray: DataActionItem[], item: DataActionItem): DataActionItem | undefined {
        for (let i = 0; i < targetArray.length; ++i) {
            if (targetArray[i].hash == item.hash) {
                targetArray.splice(i, 1);
                return item;
            }
        }

        return undefined;
    }
}