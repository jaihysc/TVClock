package tvclockserver.networking.models;

public class Packet {
    public RequestType requestType;
    public boolean isResponse;         // Is this DataActionPacket a response to one sent by the client?
    public boolean isServer;           // Always true since this is the server side
    public String data; //Serialized json string
    public String[] dataIdentifiers;
    public long timestamp;
    public long id;
    public boolean sendUpdate;

    public Packet(RequestType requestType, String data, String[] dataIdentifiers, boolean isResponse) {
        this.requestType = requestType;
        this.isResponse = isResponse;
        this.isServer = true;
        this.data = data;
        this.dataIdentifiers = dataIdentifiers;
        this.timestamp = System.currentTimeMillis() / 1000L;
    }

    public Packet(RequestType requestType, String data, String[] dataIdentifiers, long id, boolean isResponse) {
        this.requestType = requestType;
        this.isResponse = isResponse;
        this.isServer = true;
        this.data = data;
        this.dataIdentifiers = dataIdentifiers;
        this.id = id;
        this.timestamp = System.currentTimeMillis() / 1000L;
    }
}