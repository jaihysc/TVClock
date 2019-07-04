package networking;

import networking.models.IConnectionListeners;
import networking.models.IMessageReceived;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

public class ConnectionManager {
    private static long id = 0; //Used to identify each connection

    private static List<IConnectionListeners> connections = new ArrayList<>();

    /**
     * Begins handling transfer of data between this application and clients
     * @param portNumber port to listen on
     */
    public static void startNetworking(int portNumber, IMessageReceived messageHandler) {
        System.out.println("Networking | Initializing networking...");

        new Thread(() -> {
            try {
                ServerSocket serverSocket = new ServerSocket(portNumber);

                while (true) {
                    try {
                        //Constantly accept new connections via the port, then create a connection thread to manage each one
                        Socket socket = serverSocket.accept();

                        //Synchronise since this is running async
                        List<IConnectionListeners> synchronizedConnections = Collections.synchronizedList(connections);
                        synchronized (synchronizedConnections) {
                            synchronizedConnections.add(new Connection(socket, messageHandler, id++));
                        }

                        sendMessage("Hey bud"); //TODO, remove, this is for testing
                    } catch (IOException e) {
                        System.out.println("Networking | Error creating connection thread");
                    }
                }
            } catch (IOException e) {
                System.out.println("Networking | Error initializing networking");
            }
        }).start();
    }

    /**
     * Sends the specified message to all connected clients
     * @param message message to send
     */
    private static void sendMessage(String message) {
        trimConnections();

        for (IConnectionListeners connection : connections)
            connection.sendMessage(message);

        System.out.println("Networking | Sent message: " + message);
    }

    /**
     * Removes connections no longer in use
     */
    private static void trimConnections() {
        List<IConnectionListeners> newConnections = new ArrayList<>();
        List<IConnectionListeners> synchronizedConnections = Collections.synchronizedList(connections);

        //Synchronise since startNetworking runs in a thread
        synchronized (synchronizedConnections) {
            for (IConnectionListeners connection : synchronizedConnections) {
                if (connection.isActive())
                    newConnections.add(connection);
            }

            synchronizedConnections.clear();
            synchronizedConnections.addAll(newConnections);
        }
    }
}
