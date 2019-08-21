package tvclockserver.scheduleList;

import tvclockserver.networking.models.DataActionItem;

public class ScheduleItemGeneric extends DataActionItem {
    public String periodName;
    public String hour;
    /**
     * 6 Character hex string, without the #
     */
    public String color;
}
