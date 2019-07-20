package networking.models;

import networking.Connection;

public interface IMessageReceived {
    public void handleMessage(Packet packet, Connection connection);
}