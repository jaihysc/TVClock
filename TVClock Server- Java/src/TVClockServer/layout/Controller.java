package TVClockServer.layout;

import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.fxml.Initializable;
import javafx.scene.control.Label;
import javafx.util.Duration;

import java.net.URL;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.ResourceBundle;

public class Controller implements Initializable {
    public Label timeLabel;
    public Label dateLabel;
    public Label amPmLabel;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        //Clock
        updateTime();

        //Task list
        initializeTaskList();
    }

    //Fetch task list information... TODO
    private void initializeTaskList() {

    }

    /**
     * Updates the time and date on screen to the current system time
     */
    private void updateTime() {
        Timeline clock = new Timeline(new KeyFrame(Duration.ZERO, e -> {
            timeLabel.setText(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));

            dateLabel.setText(LocalDateTime.now().format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy")));

            amPmLabel.setText(LocalDateTime.now().format(DateTimeFormatter.ofPattern("a")));

        }), new KeyFrame(Duration.millis(500)));

        clock.setCycleCount(Animation.INDEFINITE);
        clock.play();
    }



}
