package TVClockServer;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import javafx.stage.StageStyle;

import java.text.SimpleDateFormat;
import java.util.Date;

public class Main extends Application {

    @Override
    public void start(Stage primaryStage) throws Exception{
        Parent root = FXMLLoader.load(getClass().getResource("layout/Main.fxml"));

        primaryStage.setTitle("Hello World");
//        primaryStage.initStyle(StageStyle.UNDECORATED);
        Scene scene = new Scene(root, 1920, 1080);
        scene.getStylesheets().add("TVClockServer/layout/MainStyle.css");
        primaryStage.setScene(scene);
        primaryStage.show();
    }


    public static void main(String[] args) {
        launch(args);
    }
}
