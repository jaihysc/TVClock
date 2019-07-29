package tvclockserver.networking;

import tvclockserver.networking.models.IConnectionListeners;
import tvclockserver.networking.models.IMessageReceived;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ConnectionManager {
    private static long id = 0; //Used to identify each connection

    private static Thread activeConnectionManager = null;
    private static ServerSocket serverSocket = null;

    private static List<IConnectionListeners> connections = new ArrayList<>();

    /**
     * Begins handling transfer of data between this application and clients
     * @param portNumber port to listen on
     */
    public static void startConnectionManager(int portNumber, IMessageReceived messageHandler) {
        //Terminate the last connection manager
        if (activeConnectionManager != null) {
            System.out.println("Networking | Old Connection Manager exiting");
            try {
                serverSocket.close();
            } catch (IOException e) {
                System.out.println("Networking | Error closing old Connection Manager");
            }
            activeConnectionManager.interrupt();

            //Disconnect all sockets and clear connection list
            for (IConnectionListeners c : connections) {
                c.disconnect();
            }
            connections.clear();
            id = 0; //Reset client thread id
        }

        System.out.println("Networking | Initializing connection manager on port " + portNumber);
        activeConnectionManager = new Thread(acceptConnections(portNumber, messageHandler));
        activeConnectionManager.start();
        System.out.println("Networking | Initializing connection manager on port " + portNumber + " Done");
    }

    private static Runnable acceptConnections(int portNumber, IMessageReceived messageHandler) {
        return () -> {
            try {
                serverSocket = new ServerSocket(portNumber);

                while (!Thread.currentThread().isInterrupted()) {
                    try {
                        //Constantly accept new connections via the port, then create a connection thread to manage each one
                        Socket socket = serverSocket.accept();

                        //Synchronise since this is running async
                        List<IConnectionListeners> synchronizedConnections = Collections.synchronizedList(connections);
                        synchronized (synchronizedConnections) {
                            synchronizedConnections.add(new Connection(socket, messageHandler, id++));
                        }
                    } catch (IOException e) {
                        if (!Thread.currentThread().isInterrupted()) //Do not print errors if this thread is exiting
                            System.out.println("Networking | Error creating connection thread");
                    }
                }
            } catch (IOException e) {
                System.out.println("Networking | Error initializing networking");
            }
        };
    }

    /**
     * Sends the specified message to all connected clients
     * @param message message to send
     */
    public static void sendMessage(String message) {
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

        //Synchronise since startConnectionManager runs in a thread
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
