package networking.models;

import networking.Connection;

public interface IMessageReceived {
    void handleMessage(Packet packet, Connection connection);
}