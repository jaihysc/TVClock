package networking;

import com.google.gson.Gson;
import networking.models.IMessageReceived;
import networking.models.Packet;
import networking.models.RequestType;
import scheduleList.ScheduleItem;
import storage.ApplicationData;
import storage.ApplicationDataIdentifiers;
import taskList.TaskItem;

import java.util.ArrayList;

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
                for (int i = 0; i < receivedPacket.data.length; ++i) {
                    updateData(receivedPacket.dataIdentifiers[i], receivedPacket.data[i]);
                }

                //TODO, send UPDATE out to all clients
                break;

            case Get: //GET request from client
                ArrayList<String> returnData = new ArrayList<>();
                for (String identifier : receivedPacket.dataIdentifiers) {
                    returnData.add(retrieveDataJson(identifier));
                }
                Packet returnPacket = new Packet();

                returnPacket.requestType = RequestType.Response;
                returnPacket.dataIdentifiers = receivedPacket.dataIdentifiers;
                returnPacket.data = returnData.toArray(new String[0]);
                returnPacket.id = receivedPacket.id;
                returnPacket.timestamp = System.currentTimeMillis() / 1000L;

                Gson gson = new Gson();
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
                var opaa = gson.fromJson(json, TaskItem[].class);
                ApplicationData.taskItems = opaa;
                break;

            case ApplicationDataIdentifiers.scheduleItems:
                ApplicationData.scheduleItems = gson.fromJson(json, ScheduleItem[].class);
                break;
        }
    }
}
