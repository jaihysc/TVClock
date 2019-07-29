package tvclockserver.layout;

import javafx.event.ActionEvent;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import javafx.stage.Stage;
import tvclockserver.networking.ConnectionManager;
import tvclockserver.networking.PacketHandler;
import tvclockserver.storage.ApplicationData;

public class StartupController {
    public TextField port;
    public Button confirmButton;
    public TextField openWeatherMapApiKey;
    public TextField openWeatherMapLocationCity;
    public TextField googleDocId;

    public void submitNetworkingParameters(ActionEvent actionEvent) {
        //Networking
        try {
            int portNumber = Integer.parseInt(port.getText());
            ConnectionManager.startConnectionManager(portNumber, new PacketHandler());
        } catch (Exception e) {
        }

        //Set the weather parameters if filled in
        String val;
        if (!(val = openWeatherMapApiKey.getText()).equals(""))
            ApplicationData.openWeatherMapKey = val;
        if (!(val = openWeatherMapLocationCity.getText()).equals(""))
            ApplicationData.openWeatherMapLocationCity = val;

        if (!(val = googleDocId.getText()).equals(""))
            ApplicationData.googleDocsDocumentId = val;


        //Close this stage
        Stage stage = (Stage) confirmButton.getScene().getWindow();
        stage.close();
    }
}
