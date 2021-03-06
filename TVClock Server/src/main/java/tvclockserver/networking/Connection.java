package tvclockserver.networking;

import com.google.gson.Gson;
import tvclockserver.networking.models.IMessageReceived;
import tvclockserver.networking.models.IConnectionListeners;
import tvclockserver.networking.models.Packet;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;

public class Connection implements IConnectionListeners {
    private PrintWriter Out;
    private BufferedReader In;
    private Socket socket;

    private Gson gson = new Gson(); //For handling json

    private long id;
    private boolean connectionActive = true;

    /**
     * Handles transfer of data between this application and a client
     * @param socket port to listen on
     * @param messageHandler handler for received messages
     * @param id id to keep track of each connection, should be in incremental order
     */
    Connection(Socket socket, IMessageReceived messageHandler, long id) {
        try {
            Out = new PrintWriter(socket.getOutputStream(), true);
            In = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            this.socket = socket;

            handleMessages(messageHandler);

            this.id = id;
            logMessage("Connection established");
        } catch (IOException e) {
            logMessage("Exception caught when trying to listen on port " + socket);
        }
    }

    /**
     * Awaits an event to send message, then sends message specified in connectionManager to client
     */
    @Override
    public void sendMessage(String message) {
        Out.println(message);
    }

    @Override
    public void disconnect() {
        try {
            socket.close();
        } catch (IOException e) {
            logMessage("Failed to disconnect");
        }
    }

    /**
     * Returns whether or not the current connection is active
     * @return active status
     */
    @Override
    public boolean isActive() {
        return connectionActive;
    }

    /**
     * Handles all incoming messages by passing the message to the handler
     * @param handler Method which implements IMessageReceived
     */
    private void handleMessages(IMessageReceived handler) {
        new Thread(() -> {
            while (true) {
                String receivedMessage;
                try {
                    if ((receivedMessage = In.readLine()) != null) {
                        logMessage("Received message: " + receivedMessage);

                        try {
                            handler.handleMessage(gson.fromJson(receivedMessage, Packet.class), this);
                        } catch (Exception e) {
                            logMessage("Error occurred handling received message: " + e.getLocalizedMessage());
                        }
                    } else {
                        //Also terminate the thread if the received message is a null, which is assumed to be that the
                        //Initiator closed
                        logMessage("Client connection closed, thread terminating");
                        connectionActive = false;
                        socket.close();
                        break;
                    }

                    Thread.sleep(100);
                } catch (InterruptedException ex) {
                    logMessage("Error getting message");

                } catch (IOException ex) {
                    logMessage("Client connection IOException, thread terminating");
                    //Thread termination upon error
                    connectionActive = false;
                    break;
                }
            }
        }).start();
    }

    private void logMessage(String message) {
        System.out.println("Networking | Thread " + id + " - " + message);
    }
}
