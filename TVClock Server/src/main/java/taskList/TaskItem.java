package taskList;

import java.util.Date;

public class TaskItem {
    public String text;
    /**
     * Currently not supported
     */
    public String color;
    /**
     * Date which the task starts
     */
    public Date startDate;
    /**
     * Date which the task auto deletes
     */
    public Date endDate;
}