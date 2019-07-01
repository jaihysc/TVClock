package networking.models;

public interface IMessageReceived {
    public void handleMessage(Packet packet);
}