package networking;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;

import com.google.gson.Gson;

public class ConnectionManager {
    private PrintWriter Out;
    private BufferedReader In;
    private Gson gson = new Gson(); //For handling json, which is how information will be sent

    private boolean ConnectionEstablished;

    /**
     * Handles transfer of data between this application and a client
     * @param portNumber port to listen on
     */
    public ConnectionManager(int portNumber) {
        new Thread(() -> {
            initialize(portNumber);
        }).start();
        System.out.println("NETWORKING | Awaiting connection...");
    }

    private void initialize(int portNumber) {
        try {
            ServerSocket serverSocket = new ServerSocket(portNumber);
            Socket clientSocket = serverSocket.accept();
            Out = new PrintWriter(clientSocket.getOutputStream(), true);
            In = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));

            ConnectionEstablished = true;
            System.out.println("NETWORKING | Connection established");
        } catch (IOException e) {
            System.out.println("NETWORKING | Exception caught when trying to listen on port " + portNumber);
        }
    }

    /**
     * Sends specified message to client
     * @param string message
     */
    public void sendMessage(String string) {
        Out.println(string);
    }

    /**
     * Handles all incoming messages by passing the message to the handler
     * @param handler Method which implements IMessageReceived
     */
    public void handleMessages(IMessageReceived handler) {
        new Thread(() -> {
            while (true) {
                String receivedMessage;
                try {
                    if (ConnectionEstablished && (receivedMessage = In.readLine()) != null) {
                        handler.handleMessage(gson.fromJson(receivedMessage, Packet.class));
                    }

                    Thread.sleep(5000);
                } catch (Exception ex) {
                    System.out.println("NETWORKING | Error getting message");
                }
            }
        }).start();
    }
}
