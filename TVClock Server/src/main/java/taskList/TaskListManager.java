package taskList;

import networking.ConnectionManager;
import networking.PacketHandler;
import networking.models.Packet;
import networking.models.RequestType;
import storage.ApplicationData;
import storage.ApplicationDataIdentifiers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 *Formats and handles the appearance of the tasklist
 */
public class TaskListManager {

    public static List<TaskItem> taskListItems = new ArrayList<>();

    /**
     * Wraps long text by inserting line breaks
     * @param text text to wrap
     * @param wrapCharacter the character to wrap the text on
     * @return wrapped text
     */
    public static String wrapText(String text, int wrapCharacter) {
        int substringBeginIndex = 0;
        int offset = 0; //How far to skip the line count, if another line was broken into the next line
        StringBuilder returnText = new StringBuilder();
        for (int j = wrapCharacter; j < text.length(); j+=wrapCharacter) {
            int i = j - offset;
            boolean brokeAtSpace = false;

            //Traverse backwards and look for a space to break the line if i is not a space
            if (text.charAt(i) != ' ') {
                for (int k = i; k >= substringBeginIndex; --k) {
                    if (text.charAt(k) == ' ') { //Found space to break line
                        brokeAtSpace = true;
                        returnText.append(text.substring(substringBeginIndex, k));
                        returnText.append('\n');
                        String substringText = text.substring(k+1, i);
                        returnText.append(substringText);
                        offset += substringText.length();
                        break;
                    }
                }
            }

            if (!brokeAtSpace) {
                returnText.append(text.substring(substringBeginIndex, i));
                returnText.append('\n');

                //Skip any leading whitespace
                while (text.charAt(i) == ' ') {
                    i++;
                    if (offset > 0)
                        offset--;
                }
            }

            substringBeginIndex = i;
        }

        //Append on any remaining text
        returnText.append(text.substring(substringBeginIndex));

        return returnText.toString();
    }

    /**
     * Trims expired tasks from taskItems
     */
    public static void trimOldTasks() {
        TaskItem[] taskItems = ApplicationData.taskItems;
        if (taskItems == null)
            return;
        boolean tasksTrimmed = false; //Avoids unnecessary networking Update requests when nothing was trimmed

        //Filter out taskItems whose endDate is passed
        List<TaskItem> taskItemsNew = new ArrayList<>();
        for (var taskItem : taskItems) {
            if (taskItem.endDate.after(new Date())) {
                taskItemsNew.add(taskItem);
            } else {
                tasksTrimmed = true;
            }
        }

        ApplicationData.taskItems = taskItemsNew.toArray(new TaskItem[0]);

        //Add trimmed task items to taskListItems
        List<TaskItem> taskListSync = Collections.synchronizedList(TaskListManager.taskListItems);
        synchronized (taskListSync) {
            taskListSync.clear();
            Collections.addAll(taskListSync, ApplicationData.taskItems);
        }

        if (tasksTrimmed) {
            PacketHandler.sendItemUpdateRequest(ApplicationDataIdentifiers.taskItems);
        }
    }

    /**
     * Checks  start and end dates are in range of the current date (Start - End)
     * @param startDate start date
     * @param endDate end date
     * @return whether or not the 2 dates are current
     */
    public static boolean isDateCurrent(Date startDate, Date endDate) {
        Date currentDate = new Date();
        return startDate.before(currentDate) && endDate.after(currentDate);
    }
}
