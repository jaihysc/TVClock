package tvclockserver;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.input.KeyCode;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import tvclockserver.networking.SettingMenu;

import java.net.URL;


public class Main extends Application {

    @Override
    public void start(Stage primaryStage) throws Exception{
        primaryStage.setTitle("TVClock Server");
        primaryStage.initStyle(StageStyle.UNDECORATED);

        Parent root = FXMLLoader.load(getClass().getResource("/tvclockserver/layout/Main.fxml"));
        Scene mainScene = new Scene(root, 1920, 1080);

        //Load resource with getClass().getResource("path") as it cannot find it otherwise
        mainScene.getStylesheets().add(getClass().getResource("/tvclockserver/layout/MainStyle.css").toExternalForm());

        //Listen for S key to open the settings menu
        mainScene.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.S) {
                SettingMenu.showSettingsScene();
            }
        });
        primaryStage.setScene(mainScene);
        primaryStage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
