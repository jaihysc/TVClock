package tvclockserver.networking.models;

public class DataActionPacket {
    public DataAction dataAction;
    public String hash;                // Unique hash identifier for target data to modify, hash is created when the data is first created
    public String dataJson;            // Data serialized into json string

    public DataActionPacket(DataAction dataAction, String hash, String dataJson) {
        this.dataAction = dataAction;
        this.hash = hash;
        this.dataJson = dataJson;
    }
}
