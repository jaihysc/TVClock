package layout;

import docs.DocsFacade;
import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.fxml.Initializable;
import javafx.scene.control.Label;
import javafx.util.Duration;
import weather.OpenWeatherMapFacade;
import weather.models.*;

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

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        //Clock
        updateTime();

        //Task list
        initializeTaskList();

        //Notice bar
        updateNoticeBar();

        //Forecast
        updateWeather();
    }

    //Fetch task list information... TODO
    private void initializeTaskList() {

    }

    /**
     * Calls the google docs api for notices
     */
    private void updateNoticeBar() {
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

            List response = forecastResponse.getList()[0];

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

            //This comes back null
//            precipitationLabel.setText("P | " + response.getRain().getThe3H());

            Wind wind = response.getWind();
            //Convert m/s to km/h
            windSpeedLabel.setText((double)Math.round(wind.getSpeed() * 60 * 60 / 1000 * 100) / 100 + " Km/h");
            windDirectionLabel.setText(degreeToCardinal(wind.getDeg()));
        }), new KeyFrame(Duration.minutes(10)));

        t.setCycleCount(Animation.INDEFINITE);
        t.play();
    }

    private String degreeToCardinal(double degree) {
        String[] directions = {"N", "NE", "E", "SE", "S", "SW", "W", "NW"};
        return directions[ (int)Math.round((  (degree % 360) / 45)) % 8 ];
    }

}
