package networking.models;

public class Packet {
    public RequestType requestType;
    public String[] data; //Another list of json to deserialize?
    public String[] dataIdentifiers;
    public long timestamp;
    public long id;

    public Packet() {
    }
    public Packet(RequestType requestType, String[] data, String[] dataIdentifiers) {
        this.requestType = requestType;
        this.data = data;
        this.dataIdentifiers = dataIdentifiers;
        this.timestamp = System.currentTimeMillis() / 1000L;
    }

    public Packet(RequestType requestType, String[] data, String[] dataIdentifiers, long id) {
        this.requestType = requestType;
        this.data = data;
        this.dataIdentifiers = dataIdentifiers;
        this.id = id;
        this.timestamp = System.currentTimeMillis() / 1000L;
    }
}