package networking.models;

public class Packet {
    public RequestType requestType;
    public String[] data; //Another list of json to deserialize?
    public String[] dataIdentifiers;
    public long timestamp;
    public long id;
}