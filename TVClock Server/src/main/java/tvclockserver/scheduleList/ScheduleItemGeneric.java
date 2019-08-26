package tvclockserver.scheduleList;

import tvclockserver.networking.models.DataActionItem;

public class ScheduleItemGeneric extends DataActionItem {
    public String periodName;
    public String hour;
    /**
     * 6 Character hex string, without the #
     */
    public String color;

    public ScheduleItemGeneric(String periodName, String hour, String color, String hash) {
        this.periodName = periodName;
        this.hour = hour;
        this.color = color;
        this.hash = hash;
    }
}
