package tvclockserver.networking;

import com.google.gson.Gson;
import tvclockserver.networking.models.*;
import tvclockserver.scheduleList.ScheduleItemGeneric;
import tvclockserver.storage.ApplicationData;
import tvclockserver.storage.ApplicationDataIdentifier;
import tvclockserver.taskList.TaskItem;
import tvclockserver.taskList.TaskListManager;

import java.util.*;

/**
 * Performs the corresponding actions and sets the corresponding fields as specified by Packet
 */
public class PacketHandler implements IMessageReceived {
    private static Gson gson = new Gson();

    /**
     * Handles messages received from connections
     * @param receivedPacket Deserialized data sent from a client
     * @param connection The connection which received the data
     */
    @Override
    public void handleMessage(Packet receivedPacket, Connection connection) {
        switch (receivedPacket.requestType) {
            case Post: //POST request from client
                updateData(receivedPacket.data, receivedPacket.dataIdentifiers);

                // Send reply to packet sender acknowledging reception of packet
                sendResponsePacket(receivedPacket, connection);

                // Forward post contents via UPDATE out to all clients INCLUDING the one which sent the post request
                // This is done for offline networking, so when the client's data gets overridden with server data
                // The clients DataActionPackets are flushed, causing contents on the server to update, and the client will see the
                // New data it created itself
                if (receivedPacket.sendUpdate)
//                   sendUpdateRequest(receivedPacket.data, receivedPacket.dataIdentifiers, new Connection[] {connection});
                    sendUpdateRequest(receivedPacket.data, receivedPacket.dataIdentifiers, null);
                break;

            case Get: //GET request from client
                ArrayList<Object> returnData = new ArrayList<>();
                for (String identifier : receivedPacket.dataIdentifiers) {
                    returnData.add(retrieveData(identifier));
                }

                Gson gson = new Gson();
                Packet returnPacket = new Packet(
                        RequestType.Get, gson.toJson(returnData), receivedPacket.dataIdentifiers, receivedPacket.id, true);

                connection.sendMessage(gson.toJson(returnPacket, Packet.class));
                break;
        }
    }

    /**
     * Retrieves data at identifier and sends out an UPDATE request
     * @param identifier identifier for the data to send
     */
    public static void sendItemUpdateRequest(String identifier) {
        sendUpdateRequest(
                gson.toJson(retrieveData(identifier)),
                new String[]{identifier},
                null
        );
    }


    // Helper methods
    private static void sendUpdateRequest(String data, String[] dataIdentifiers, Connection[] excludedConnections) {
        Packet updatePacket = new Packet(RequestType.Update, data, dataIdentifiers, false);

        if (excludedConnections == null)
            ConnectionManager.sendMessage(gson.toJson(updatePacket, Packet.class));
        else
            ConnectionManager.sendMessage(gson.toJson(updatePacket, Packet.class), excludedConnections);
    }

    private static void sendResponsePacket(Packet packet, Connection connection) {
        packet.isResponse = true;
        packet.isServer = true;

        connection.sendMessage(gson.toJson(packet));
    }

    /**
     * Fetches data stored by the identifier
     * @param identifier Identifier of data to access
     * @return Data serialized to json
     */
    private static Object retrieveData(String identifier) {
        switch (identifier) {
            case ApplicationDataIdentifier.taskItems:
                return ApplicationData.taskItems;

            case ApplicationDataIdentifier.scheduleItems:
                return ApplicationData.scheduleItems;

            case ApplicationDataIdentifier.periodItems:
                return ApplicationData.periodItems;
        }

        return null;
    }

    /**
     * Updates data marked by the identifier with the new provided data
     * @param json Value of new data
     * @param identifiers Target data identifiers
     */
    private static void updateData(String json, String[] identifiers) {
        // Todo, convert data to a string array instead for efficiency, thus I do not need to deserialize the entire array each iteration

        int i = 0;
        //Json can be deserialized into string array, and assigned to identifiers in this loop
        for (String identifier : identifiers) {
            switch (identifier) {
                case ApplicationDataIdentifier.taskItems:
                case ApplicationDataIdentifier.scheduleItems:
                case ApplicationDataIdentifier.periodItems:
                    updateListData(identifier, gson.fromJson(json, DataActionPacket[].class)[i]);
                    break;

                case ApplicationDataIdentifier.openWeatherMapKey:
                    ApplicationData.openWeatherMapKey = gson.fromJson(json, String[].class)[i];
                    break;
                case ApplicationDataIdentifier.googleDocsDocumentId:
                    ApplicationData.googleDocsDocumentId = gson.fromJson(json, String[].class)[i];
                    break;
                case ApplicationDataIdentifier.openWeatherMapLocationCity:
                    ApplicationData.openWeatherMapLocationCity = gson.fromJson(json, String[].class)[i];
                    break;
            }
            i++;
        }
    }

    private static void updateListData(String dataIdentifier, DataActionPacket packet) {
        // Because the objects are stored as arrays instead of lists, they cannot be directly modified
        // They will instead be converted to a list, operations will be performed on it
        // The list will then be converted back into an array, and set
        switch (dataIdentifier) {
            case ApplicationDataIdentifier.taskItems:
                ApplicationData.taskItems = dataActionDispatcher(
                        packet.dataAction,
                        ApplicationData.taskItems,
                        gson.fromJson(packet.dataJson, TaskItem.class)

                ).toArray(new TaskItem[0]);

                //Add taskItem name to a list to show up on screen
                List<TaskItem> taskListSync = Collections.synchronizedList(TaskListManager.taskListItems);
                synchronized (taskListSync) {
                    taskListSync.clear();
                    Collections.addAll(taskListSync, ApplicationData.taskItems);
                }
                break;

            case ApplicationDataIdentifier.scheduleItems:
                ApplicationData.scheduleItems = dataActionDispatcher(
                        packet.dataAction,
                        ApplicationData.scheduleItems,
                        gson.fromJson(packet.dataJson, ScheduleItemGeneric.class)
                ).toArray(new ScheduleItemGeneric[0]);
                break;

            case ApplicationDataIdentifier.periodItems:
                ApplicationData.periodItems = dataActionDispatcher(
                        packet.dataAction,
                        ApplicationData.periodItems,
                        gson.fromJson(packet.dataJson, ScheduleItemGeneric.class)
                ).toArray(new ScheduleItemGeneric[0]);
                break;
        }
    }

    // Helper functions for the 3 DataActions

    /**
     * Dispatches the list and item to different methods depending on the DataAction
     * @param dataAction DataAction of packet
     * @param array list in which the item will interact with
     * @param item object inheriting class DataActionItem
     * @return List of DataActionItems, cast this into an array with .toArray(new T[0])
     */
    private static List<DataActionItem> dataActionDispatcher(DataAction dataAction, DataActionItem[] array, DataActionItem item) {
        if (array == null)
            array = new DataActionItem[] {};

        List<DataActionItem> list = new ArrayList<>(Arrays.asList(array));
        switch (dataAction) {
            case Add:
                dataActionAdd(list, item);
                break;

            case Edit:
                dataActionEdit(list, item);
                break;

            case Remove:
                dataActionDelete(list, item);
                break;
        }

        return list;
    }

    private static void dataActionAdd(List<DataActionItem> list, DataActionItem item) {
        // Do not add if item with same hash already exists
        for (int i = 0; i < list.size(); ++i) {
            if (list.get(i).hash.equals(item.hash)) {
                return;
            }
        }

        list.add(item);
    }
    private static void dataActionEdit(List<DataActionItem> list, DataActionItem item) {
        for (int i = 0; i < list.size(); ++i) {
            if (list.get(i).hash.equals(item.hash)) {
                list.set(i, item);
                break;
            }
        }
    }
    private static void dataActionDelete(List<DataActionItem> list, DataActionItem item) {
        for (int i = 0; i < list.size(); ++i) {
            if (list.get(i).hash.equals(item.hash)) {
                list.remove(i);
                break;
            }
        }
    }

}
