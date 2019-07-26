package weather;

import com.google.gson.Gson;
import storage.ApplicationData;
import weather.models.ForecastResponse;
import weather.models.UVIndexResponse;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class OpenWeatherMapFacade {
    //This can in the future be swapped out with any city
    private final static String baseForecastURL = "http://api.openweathermap.org/data/2.5/forecast?lat=43.589046&lon=-79.644119&units=metric&appid=";
    private final static String baseUVIndexURL = "http://api.openweathermap.org/data/2.5/uvi?lat=43.589046&lon=-79.644119&appid=";

    //Fetches weather info from the openWeatherMap API endpoint
    public static ForecastResponse getForecastInfo() {
        String response = httpFetch(baseForecastURL + ApplicationData.openWeatherMapKey);
        Gson gson = new Gson();
        return gson.fromJson(response, ForecastResponse.class);
    }

    public static UVIndexResponse getUVIndex() {
        String response = httpFetch(baseUVIndexURL + ApplicationData.openWeatherMapKey);
        Gson gson = new Gson();
        return gson.fromJson(response, UVIndexResponse.class);
    }

    /**
     * Fetches from a url
     * @return http response
     */
    private static String httpFetch(String urlToRead) {
        try {
            StringBuilder result = new StringBuilder();
            URL url = new URL(urlToRead);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            BufferedReader rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            String line;
            while ((line = rd.readLine()) != null) {
                result.append(line);
            }
            rd.close();
            return result.toString();
        } catch (Exception ex) {
            System.out.println("WeatherAPI | Failed to fetch from http address " + urlToRead);
            return "";
        }
    }
}
