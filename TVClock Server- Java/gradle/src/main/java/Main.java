import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import networking.ConnectionManager;
import networking.PacketHandler;


public class Main extends Application {

    @Override
    public void start(Stage primaryStage) throws Exception{
        Parent root = FXMLLoader.load(getClass().getResource("layout/Main.fxml"));

        primaryStage.setTitle("Hello World");
//        primaryStage.initStyle(StageStyle.UNDECORATED); //TODO, uncomment this to remove borders in production
        Scene scene = new Scene(root, 1920, 1080);
        scene.getStylesheets().add("layout/MainStyle.css");
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    public static void main(String[] args) {
        //Networking test
        ConnectionManager conman = new ConnectionManager(4999);
        conman.handleMessages(new PacketHandler());
        //
        launch(args);
    }
}
