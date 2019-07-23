package networking.models;

/**
 * Implemented by connection, allows for control of connection threads in connectionManager
 */
public interface IConnectionListeners {
    void sendMessage(String message);
    void disconnect();
    boolean isActive();
}
