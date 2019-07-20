package storage;

import scheduleList.ScheduleItem;
import taskList.TaskItem;

/**
 * Stores application data which can be gotten and set
 * Examples: Tasks, Schedule items
 */
public class ApplicationData {
    public static TaskItem[] taskItems;
    public static ScheduleItem[] scheduleItems;

    public static String weatherApiKey;
    public static String noticeBarDocumentId;
}

