package networking.models;

import taskList.TaskItem;

import java.util.Date;
import java.util.List;

public class Packet {
    public Date timestamp; //Send timestamp
    public RequestType requestType;

    public TaskList taskList;
    public Schedule schedule;
    public Settings settings;
}

class TaskList {
    List<TaskItem> taskItems;
}

class Schedule {
    //Todo schedule
}

class Settings {
    public String weatherApiKey;
    public String noticeBarDocumentId;
}
