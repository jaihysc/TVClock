package networking;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

public class SettingMenu {
    public static void showSettingsScene() {
        Stage stage = new Stage();
        Parent startup = null;
        try {
            startup = FXMLLoader.load(SettingMenu.class.getClassLoader().getResource("layout/Startup.fxml"));
            Scene scene = new Scene(startup, 1920, 1080);
            stage.setScene(scene);
            stage.show();
        } catch (IOException ex) {
            ex.printStackTrace();
        }
    }
}
