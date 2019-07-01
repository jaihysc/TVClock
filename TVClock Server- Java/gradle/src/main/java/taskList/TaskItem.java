package taskList;

import java.util.Date;

public class TaskItem {
    public String taskName;
    public TaskItemSeverity taskItemSeverity;
    public Date createDate; //Date which it was created on a client
    public Date expiraryDate; //Date where the task item auto deletes
}