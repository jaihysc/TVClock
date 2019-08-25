import {DataActionItem} from "./NetworkingFunctions";
import {DataAction, DataActionPacket} from "./NetworkManager";

export class DataActionFunctions {
    // Dispatches DataActionsPackets to make their appropriate modifications to the targetArray
    public static handleDataActionPacket(dataActionPackets: DataActionPacket[], targetArray: DataActionItem[]): void {
        // Todo, date is not parsed correctly
        for (let dataActionPacket of dataActionPackets) {
            let data = JSON.parse(dataActionPacket.dataJson);

            switch (dataActionPacket.dataAction) {
                case DataAction.Add:
                    this.add(targetArray, data);
                    break;

                case DataAction.Edit:
                    this.edit(targetArray, data);
                    break;

                case DataAction.Remove:
                    this.remove(targetArray, data);
                    break;
            }
        }
    }

    // These are copies of the methods on the server side
    private static add(targetArray: DataActionItem[], item: DataActionItem): void {
        // Do not add if item with same hash already exists
        for (let i = 0; i < targetArray.length; ++i) {
            if (targetArray[i].hash == item.hash) {
                return;
            }
        }

        targetArray.push(item);
    }

    private static edit(targetArray: DataActionItem[], item: DataActionItem): void {
        for (let i = 0; i < targetArray.length; ++i) {
            if (targetArray[i].hash == item.hash) {
                targetArray[i] = item;
                break;
            }
        }
    }

    private static remove(targetArray: DataActionItem[], item: DataActionItem): void {
        for (let i = 0; i < targetArray.length; ++i) {
            if (targetArray[i].hash == item.hash) {
                targetArray.splice(i, 1);
                break;
            }
        }
    }
}