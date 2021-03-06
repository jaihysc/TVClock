package tvclockserver.storage;

import tvclockserver.networking.models.DataActionItem;
import tvclockserver.scheduleList.ScheduleItemGeneric;
import tvclockserver.taskList.TaskItem;

/**
 * Stores application data which can be gotten and set
 * Examples: Tasks, Schedule items
 */
public class ApplicationData {
    public static TaskItem[] taskItems; //Cannot initialize these values as the client expects them to be undefined
    public static ScheduleItemGeneric[] scheduleItems;
    public static ScheduleItemGeneric[] periodItems;


    public static String openWeatherMapKey;
    public static String googleDocsDocumentId;
    public static String openWeatherMapLocationCity;
}

