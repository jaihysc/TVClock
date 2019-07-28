package tvclockserver.networking.models;

import tvclockserver.networking.Connection;

public interface IMessageReceived {
    void handleMessage(Packet packet, Connection connection);
}