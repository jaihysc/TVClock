package taskList;

import java.util.ArrayList;
import java.util.List;

/**
 *Formats and handles the appearance of the tasklist
 */
public class TaskListManager {

    public static List<String> taskListItems = new ArrayList<>();

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
}
