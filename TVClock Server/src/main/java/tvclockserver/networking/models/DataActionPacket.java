package tvclockserver.networking.models;

public class DataActionPacket {
    public DataAction dataAction;
    public String hash;            // Hash of UNIX timestamp of packet creation date + data string
    public String dataJson;            // Data serialized into json string
}
