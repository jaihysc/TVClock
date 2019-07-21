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
        Gson gson = new Gson();

        switch (receivedPacket.requestType) {
            case Post: //POST request from client
                for (int i = 0; i < receivedPacket.data.length; ++i) {
                    updateData(receivedPacket.dataIdentifiers[i], receivedPacket.data[i]);
                }

                //send UPDATE out to all clients
                Packet updatePacket = new Packet(RequestType.Update, receivedPacket.data, receivedPacket.dataIdentifiers);
                ConnectionManager.sendMessage(gson.toJson(updatePacket, Packet.class));

                break;

            case Get: //GET request from client
                ArrayList<String> returnData = new ArrayList<>();
                for (String identifier : receivedPacket.dataIdentifiers) {
                    returnData.add(retrieveDataJson(identifier));
                }
                Packet returnPacket = new Packet(
                        RequestType.Response, returnData.toArray(new String[0]), receivedPacket.dataIdentifiers, receivedPacket.id);

                connection.sendMessage(gson.toJson(returnPacket, Packet.class));
                break;
        }
    }

    /**
     * Fetches data stored by the identifier
     * @param identifier Identifier of data to access
     * @return Data serialized to json
     */
    private static String retrieveDataJson(String identifier) {
        Gson gson = new Gson();

        switch (identifier) {
            case ApplicationDataIdentifiers.taskItems:
                return gson.toJson(ApplicationData.taskItems, TaskItem[].class);

            case ApplicationDataIdentifiers.scheduleItems:
                return gson.toJson(ApplicationData.scheduleItems, TaskItem[].class);

            case ApplicationDataIdentifiers.periodItems:
                return gson.toJson(ApplicationData.periodItems, TaskItem[].class);
        }

        return null;
    }

    /**
     * Updates data marked by the identifier with the new provided data
     * @param identifier Target data identifier
     * @param json Value of new data
     */
    private static void updateData(String identifier, String json) {
        Gson gson = new Gson();
        switch (identifier) {
            case ApplicationDataIdentifiers.taskItems:
                ApplicationData.taskItems = gson.fromJson(json, TaskItem[].class);

                //Add taskItem name to a list to show up on screen
                List<String> taskListSync = Collections.synchronizedList(TaskListManager.taskListItems);
                taskListSync.clear();
                synchronized (taskListSync) {
                    for (var taskItem : ApplicationData.taskItems) {
                        taskListSync.add(taskItem.text);
                    }
                }

                break;

            case ApplicationDataIdentifiers.scheduleItems:
                ApplicationData.scheduleItems = gson.fromJson(json, ScheduleItemGeneric[].class);
                break;

            case ApplicationDataIdentifiers.periodItems:
                ApplicationData.periodItems = gson.fromJson(json, ScheduleItemGeneric[].class);
                break;
        }
    }
}
