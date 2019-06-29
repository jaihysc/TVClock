package layout;

import docs.DocsFacade;
import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.fxml.Initializable;
import javafx.scene.control.Label;
import javafx.util.Duration;

import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ResourceBundle;
import java.util.regex.Pattern;

public class Controller implements Initializable {
    public Label timeLabel;
    public Label dateLabel;
    public Label amPmLabel;
    public Label noticeText;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        //Clock
        updateTime();

        //Task list
        initializeTaskList();

        //Notice bar
        UpdateNoticeBar();
    }

    //Fetch task list information... TODO
    private void initializeTaskList() {

    }

    private void UpdateNoticeBar() {
        Timeline notice = new Timeline(new KeyFrame(Duration.ZERO, e -> {
            noticeText.setText(DocsFacade.fetchDoc());

        }), new KeyFrame(Duration.minutes(1)));

        notice.setCycleCount(Animation.INDEFINITE);
        notice.play();
    }

    /**
     * Updates the time and date on screen to the current system time
     */
    private void updateTime() {
        Timeline clock = new Timeline(new KeyFrame(Duration.ZERO, e -> {
            timeLabel.setText(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));

            dateLabel.setText(LocalDateTime.now().format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy")));

            amPmLabel.setText(LocalDateTime.now().format(DateTimeFormatter.ofPattern("a"))
                    .replaceAll(Pattern.quote("."), "") //Remove the dots between A.M. and P.M.
                    .toUpperCase());

        }), new KeyFrame(Duration.millis(500)));

        clock.setCycleCount(Animation.INDEFINITE);
        clock.play();
    }



}
