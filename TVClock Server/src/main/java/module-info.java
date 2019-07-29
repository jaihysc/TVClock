module tvclockserver {
    requires javafx.controls;
    requires javafx.fxml;
    requires google.api.services.docs.v1.rev20190128;
    requires google.http.client.jackson2;
    requires com.google.api.client;
    requires google.api.client;
    requires google.oauth.client;
    requires google.oauth.client.jetty;
    requires google.oauth.client.java6;
    requires gson;
    requires java.sql;

    exports tvclockserver;

    exports tvclockserver.layout to javafx.fxml;
    opens tvclockserver.layout to javafx.fxml;

    exports tvclockserver.networking.models to gson;
    exports tvclockserver.taskList to gson;
    exports tvclockserver.scheduleList to gson;

    exports tvclockserver.weather.models to gson;
    opens tvclockserver.weather.models to gson;
}