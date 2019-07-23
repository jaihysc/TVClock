import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.input.KeyCode;
import javafx.stage.Stage;
import javafx.stage.StageStyle;
import networking.SettingMenu;


public class Main extends Application {

    @Override
    public void start(Stage primaryStage) throws Exception{
        primaryStage.setTitle("TVClock Server");
        primaryStage.initStyle(StageStyle.UNDECORATED);

        Parent root = FXMLLoader.load(getClass().getResource("layout/Main.fxml"));
        Scene mainScene = new Scene(root, 1920, 1080);

        mainScene.getStylesheets().add("layout/MainStyle.css");

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
