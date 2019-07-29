package tvclockserver.layout;

import tvclockserver.docs.DocsFacade;
import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.fxml.Initializable;
import javafx.geometry.Insets;
import javafx.scene.control.*;
import javafx.scene.layout.Background;
import javafx.scene.layout.BackgroundFill;
import javafx.scene.layout.CornerRadii;
import javafx.scene.paint.Color;
import javafx.util.Duration;
import tvclockserver.networking.SettingMenu;
import tvclockserver.storage.ApplicationData;
import tvclockserver.taskList.TaskItem;
import tvclockserver.taskList.TaskListManager;
import tvclockserver.weather.OpenWeatherMapFacade;
import tvclockserver.weather.models.*;

import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.ResourceBundle;
import java.util.regex.Pattern;

public class Controller implements Initializable {
    public Label timeLabel;
    public Label dateLabel;
    public Label amPmLabel;

    public Label noticeText;

    //Weather bar
    public Label weatherDescription;
    public Label temperatureLabel;
    public Label uvIndexLabel;
    public Label humidityLabel;

    public Label precipitationLabel;
    public Label windDirectionLabel;
    public Label windSpeedLabel;

    public Label forecastLabel0;
    public Label forecastLabel1;
    public Label forecastLabel2;
    public Label forecastLabel3;
    public Label forecastLabel4;

    public ListView<String> taskList;
    public SplitPane taskListSplitPane;

    public ProgressBar dayProgressionBar;
    public Label scheduleBar;
    public Label schedulePreviewBar;
    public Label scheduleBarPreviewInline;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        //Open the startup stage to get the networking hostname and port
        SettingMenu.showSettingsScene();
        collapseSchedulePreview(); //Disable inline schedule bar on startup

        //-----------------------------
        //Initialize display elements
        dayProgressionBar.setProgress(0.25);
        //Clock
        updateTime();

        //Task list
        initializeTaskList();

        //Notice bar
        updateNoticeBar();

        //Forecast
        updateWeather();

        //Schedule bar
        initializeScheduleBar();
        initializeDayProgressionBar();
    }

    private void initializeScheduleBar() {
        Timeline t = new Timeline(new KeyFrame(Duration.ZERO, e -> {
            //Match current hour to scheduleItem belonging to that hour
            int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);

            //Index the scheduleItems 0-23
            if (ApplicationData.scheduleItems != null && ApplicationData.scheduleItems.length > hour) {
                setScheduleBarLabel(hour, scheduleBar);
                int nextHour = hour+1;
                if (nextHour > 23)
                    nextHour = 0;
                setScheduleBarLabel(nextHour, schedulePreviewBar);
                setScheduleBarLabel(nextHour, scheduleBarPreviewInline);
            }

        }), new KeyFrame(Duration.seconds(10)));

        t.setCycleCount(Animation.INDEFINITE);
        t.play();
    }

    private void setScheduleBarLabel(int nextHour, Label label) {
        if (ApplicationData.scheduleItems[nextHour] != null) {
            label.setText(ApplicationData.scheduleItems[nextHour].periodName);

            Color color = Color.web(ApplicationData.scheduleItems[nextHour].color);
            label.setBackground(new Background(
                    new BackgroundFill(
                            color,
                            CornerRadii.EMPTY, Insets.EMPTY)));
            label.setTextFill(color.invert());
        }
    }

    //Fetch task list information
    private void initializeTaskList() {
        taskList.getSelectionModel().setSelectionMode(SelectionMode.MULTIPLE);

        Timeline t = new Timeline(new KeyFrame(Duration.ZERO, e -> {
            //Trim off old taskItems
            TaskListManager.trimOldTasks();

            taskList.getItems().clear(); //Clear the taskList before adding new items
            List<TaskItem> taskListSync = Collections.synchronizedList(TaskListManager.taskListItems);

            //Synchronise since this runs in a thread
            synchronized (taskListSync) {
                //Collapse the divider if there are no items
                if (taskListSync.size() == 0) {
                    taskListSplitPane.setDividerPosition(0, 0);
                    collapseSchedulePreview();
                    return;
                } else {
                    taskListSplitPane.setDividerPosition(0, 0.2);
                    expandSchedulePreview();
                }

                int wrapCharacter = (int) Math.round(taskListSplitPane.getDividerPositions()[0] * 100);

                for (var item : taskListSync) {
                    //Add task if start date is greater than current date and end date is less than current date
                    if (TaskListManager.isDateCurrent(item.startDate, item.endDate))
                        taskList.getItems().add(TaskListManager.wrapText(item.text, wrapCharacter));
                }
            }
        }), new KeyFrame(Duration.seconds(10)));

        t.setCycleCount(Animation.INDEFINITE);
        t.play();
    }

    //Sets the progress of the bottom progress bar based on time of day
    private void initializeDayProgressionBar() {
        Timeline t = new Timeline(new KeyFrame(Duration.ZERO, e -> {
            //Get the total number of seconds in the current time
            double val = LocalDateTime.now().getHour() * 60 * 60;
            val += LocalDateTime.now().getMinute() * 60;
            val += LocalDateTime.now().getSecond();

            //Normalize seconds to value between 0 - 1
            double c = val / 86400; //86400 being the number of seconds in a day (24 hours)
            dayProgressionBar.setProgress(c);

        }), new KeyFrame(Duration.minutes(1)));

        t.setCycleCount(Animation.INDEFINITE);
        t.play();
    }

    /**
     * Calls the google docs api for notices
     */
    private void updateNoticeBar() {
        Timeline notice = new Timeline(new KeyFrame(Duration.ZERO, e -> {
            String text = DocsFacade.fetchDoc();

            //Hide notice bar if no text is present
            if (text.isBlank()) {
                noticeText.setManaged(false);
                noticeText.setText("");
            } else {
                noticeText.setManaged(true);
                noticeText.setText(text);
            }

        }), new KeyFrame(Duration.minutes(1)));

        notice.setCycleCount(Animation.INDEFINITE);
        notice.play();
    }

    /**
     * Updates the time and date on screen to the current system time
     */
    private void updateTime() {
        Timeline clock = new Timeline(new KeyFrame(Duration.ZERO, e -> {
            timeLabel.setText(LocalDateTime.now().format(DateTimeFormatter.ofPattern("hh:mm:ss")));

            dateLabel.setText(LocalDateTime.now().format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy")));

            amPmLabel.setText(LocalDateTime.now().format(DateTimeFormatter.ofPattern("a"))
                    .replaceAll(Pattern.quote("."), "") //Remove the dots between A.M. and P.M.
                    .toUpperCase());

        }), new KeyFrame(Duration.millis(500)));

        clock.setCycleCount(Animation.INDEFINITE);
        clock.play();
    }

    /**
     * Calls the OpenWeatherMap API to update the weather status on screen
     */
    private void updateWeather() {
        Timeline t = new Timeline(new KeyFrame(Duration.ZERO, e -> {
            ForecastResponse forecastResponse = OpenWeatherMapFacade.getForecastInfo();

            if (forecastResponse == null) {
                weatherDescription.setText("Unable to fetch weather information");
                return;
            }

            var coords = forecastResponse.getCity().getCoord();
            updateUVIndex(coords.getLat(), coords.getLon());

            tvclockserver.weather.models.List response = forecastResponse.getList()[0];

            Weather weather = response.getWeather()[0];
            weatherDescription.setText(weather.getDescription());

            //Set the forecast labels
            forecastLabel0.setText(forecastResponse.getList()[8].getWeather()[0].getDescription());
            forecastLabel1.setText(forecastResponse.getList()[16].getWeather()[0].getDescription());
            forecastLabel2.setText(forecastResponse.getList()[24].getWeather()[0].getDescription());
            forecastLabel3.setText(forecastResponse.getList()[32].getWeather()[0].getDescription());
            forecastLabel4.setText(forecastResponse.getList()[39].getWeather()[0].getDescription());


            MainClass temperature = response.getMain();
            temperatureLabel.setText(temperature.getTemp() + " C");
            humidityLabel.setText("H | " + temperature.getHumidity() + "%");

            //This comes back null if there is no rain / snow
            Rain rain;
            Snow snow;
            if ((rain = response.getRain()) != null && rain.getThe3H() != null)
                precipitationLabel.setText("P | " + rain.getThe3H() + "mm");
            else if ((snow = response.getSnow()) != null && snow.getThe3H() != null)
                precipitationLabel.setText("P | " + snow.getThe3H() + "mm");
            else
                precipitationLabel.setText("");

            Wind wind = response.getWind();
            //Convert m/s to km/h
            windSpeedLabel.setText((double)Math.round(wind.getSpeed() * 60 * 60 / 1000 * 100) / 100 + " Km/h");
            windDirectionLabel.setText(degreeToCardinal(wind.getDeg()));
        }), new KeyFrame(Duration.minutes(10)));

        t.setCycleCount(Animation.INDEFINITE);
        t.play();
    }

    private void updateUVIndex(double lat, double lon) {
        UVIndexResponse response = OpenWeatherMapFacade.getUVIndex(lat, lon);
        if (response == null)
            return;

        uvIndexLabel.setText("UV | " + response.getValue() + "");
    }

    private String degreeToCardinal(double degree) {
        String[] directions = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"};
        return directions[ (int)Math.round((  (degree % 360) / 45)) % 8 ];
    }

    /**
     * Moves the schedule preview from the task list inline with the current schedule
     */
    private void collapseSchedulePreview() {
        scheduleBarPreviewInline.setManaged(true);
        scheduleBar.setPrefWidth(1920/2);
    }
    /**
     * Pushes back schedule preview into the task list, expanding the bar for the current schedule
     */
    private void expandSchedulePreview() {
        scheduleBarPreviewInline.setManaged(false);
        scheduleBar.setPrefWidth(1920);
    }
}
