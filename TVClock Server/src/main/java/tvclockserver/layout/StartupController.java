package tvclockserver.layout;

import javafx.event.ActionEvent;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import tvclockserver.networking.ConnectionManager;
import tvclockserver.networking.PacketHandler;

public class StartupController {
    public TextField port;
    public Button confirmButton;

    public void submitNetworkingParameters(ActionEvent actionEvent) {
        //Networking
        int portNumber;
        try {
            portNumber = Integer.parseInt(port.getText());
        } catch (Exception e) {
            return;
        }

        ConnectionManager.startConnectionManager(portNumber, new PacketHandler());

        //Close this stage
        Stage stage = (Stage) confirmButton.getScene().getWindow();
        stage.close();
    }
}
