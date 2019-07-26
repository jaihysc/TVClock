package networking;

import com.google.gson.Gson;
import networking.models.IMessageReceived;
import networking.models.Packet;
import networking.models.RequestType;
import scheduleList.ScheduleItemGeneric;
import storage.ApplicationData;
import storage.ApplicationDataIdentifiers;
import taskList.TaskItem;
import taskList.TaskListManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Performs the corresponding actions and sets the corresponding fields as specified by Packet
 */
public class PacketHandler implements IMessageReceived {
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

                //send UPDATE out to all clients
                if (receivedPacket.sendUpdate)
                    sendUpdateRequest(receivedPacket.data, receivedPacket.dataIdentifiers);
                break;

            case Get: //GET request from client
                ArrayList<Object> returnData = new ArrayList<>();
                for (String identifier : receivedPacket.dataIdentifiers) {
                    returnData.add(retrieveData(identifier));
                }

                Gson gson = new Gson();
                Packet returnPacket = new Packet(
                        RequestType.Response, gson.toJson(returnData), receivedPacket.dataIdentifiers, receivedPacket.id);

                connection.sendMessage(gson.toJson(returnPacket, Packet.class));
                break;
        }
    }

    public static void sendItemUpdateRequest(String identifier) {
        Gson gson = new Gson();
        sendUpdateRequest(gson.toJson(retrieveData(identifier)), new String[]{identifier});
    }

    private static void sendUpdateRequest(String data, String[] dataIdentifiers) {
        Gson gson = new Gson();

        Packet updatePacket = new Packet(RequestType.Update, data, dataIdentifiers);
        ConnectionManager.sendMessage(gson.toJson(updatePacket, Packet.class));
    }

    /**
     * Fetches data stored by the identifier
     * @param identifier Identifier of data to access
     * @return Data serialized to json
     */
    private static Object retrieveData(String identifier) {
        switch (identifier) {
            case ApplicationDataIdentifiers.taskItems:
                return ApplicationData.taskItems;

            case ApplicationDataIdentifiers.scheduleItems:
                return ApplicationData.scheduleItems;

            case ApplicationDataIdentifiers.periodItems:
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
        Gson gson = new Gson();

        int i = 0;
        //Json can be deserialized into string array, and assigned to identifiers in this loop
        for (String identifier : identifiers) {
            switch (identifier) {
                case ApplicationDataIdentifiers.taskItems:
                    ApplicationData.taskItems = gson.fromJson(json, TaskItem[].class);

                    //Add taskItem name to a list to show up on screen
                    List<TaskItem> taskListSync = Collections.synchronizedList(TaskListManager.taskListItems);
                    synchronized (taskListSync) {
                        taskListSync.clear();
                        Collections.addAll(taskListSync, ApplicationData.taskItems);
                    }

                    break;

                case ApplicationDataIdentifiers.scheduleItems:
                    ApplicationData.scheduleItems = gson.fromJson(json, ScheduleItemGeneric[].class);
                    break;

                case ApplicationDataIdentifiers.periodItems:
                    ApplicationData.periodItems = gson.fromJson(json, ScheduleItemGeneric[].class);
                    break;

                case ApplicationDataIdentifiers.openWeatherMapKey:
                    ApplicationData.openWeatherMapKey = gson.fromJson(json, String[].class)[i];
                    break;

                case ApplicationDataIdentifiers.googleDocsDocumentId:
                    ApplicationData.googleDocsDocumentId = gson.fromJson(json, String[].class)[i];
                    break;
            }
            i++;
        }
    }
}
