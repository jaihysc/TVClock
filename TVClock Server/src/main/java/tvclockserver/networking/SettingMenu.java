package tvclockserver.networking;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

public class SettingMenu {
    public static void showSettingsScene() {
        Stage stage = new Stage();
        Parent startup;
        try {
            startup = FXMLLoader.load(SettingMenu.class.getResource("/tvclockserver/layout/Startup.fxml"));
            Scene scene = new Scene(startup, 1920, 1080);
            stage.setTitle("TVClock Server Settings");

            stage.setScene(scene);
            stage.showAndWait();
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }
}
