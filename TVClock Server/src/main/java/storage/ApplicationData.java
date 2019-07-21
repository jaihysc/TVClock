package storage;

import scheduleList.ScheduleItemGeneric;
import taskList.TaskItem;

/**
 * Stores application data which can be gotten and set
 * Examples: Tasks, Schedule items
 */
public class ApplicationData {
    public static TaskItem[] taskItems;
    public static ScheduleItemGeneric[] scheduleItems;
    public static ScheduleItemGeneric[] periodItems;


    public static String weatherApiKey;
    public static String noticeBarDocumentId;
}

