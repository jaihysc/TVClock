//Renderer


class period {
    periodType: string = "None"; //Default text on startup

    periodHour: string; // E.G 1 AM
    periodIndex: number; //index, 0 based for internal ue

    constructor(periodHour: string, periodIndex: number) {
        this.periodHour = periodHour;
        this.periodIndex = periodIndex;
    }
}

//Generate time list
let timetable = $("#view-schedule-timetable");
//AM
for (let i = 1; i <= 12; ++i) {
    timeTableAppend(new period(i + " AM", i - 1));
}
//PM
for (let i = 1; i <= 12; ++i) {
    timeTableAppend(new period(i + " PM", i - 1 + 12));
}

//Schedule clickable functionality
let scheduleItems = $(".list-time-item");
let selectedScheduleItemIndex = -1;
for (let i = 0; i < scheduleItems.length; ++i) {
    scheduleItems[i].addEventListener("click", () => {
        //Set clicked button as active
        //The class list-group-item is added as active only shows up with list-group-item
        //Removing the custom class list-group-item-darker
        if (selectedScheduleItemIndex >= 0) {
            scheduleItems[selectedScheduleItemIndex].classList.remove("active", "list-group-item");
            scheduleItems[selectedScheduleItemIndex].classList.add("list-group-item-darker");
        }

        //If clicking the same item, unselect it
        if (selectedScheduleItemIndex == i) {
            selectedScheduleItemIndex = -1;
        } else {
            selectedScheduleItemIndex = i;
            scheduleItems[i].classList.add("active", "list-group-item");
            scheduleItems[i].classList.remove("list-group-item-darker");
        }
    })
}

//Period clickable functionality
let periodItems = $(".list-period-item");
let selectedPeriodItemIndex = -1;
for (let i = 0; i < periodItems.length; ++i) {
    periodItems[i].addEventListener("click", () => {
        //Set clicked button as active
        //The class list-group-item is added as active only shows up with list-group-item
        //Removing the custom class list-group-item-darker
        if (selectedPeriodItemIndex >= 0) {
            periodItems[selectedPeriodItemIndex].classList.remove("active", "list-group-item");
            periodItems[selectedPeriodItemIndex].classList.add("list-group-item-darker");
        }

        if (selectedPeriodItemIndex == i) {
            selectedPeriodItemIndex = -1;
        } else {
            selectedPeriodItemIndex = i;
            periodItems[i].classList.add("active", "list-group-item");
            periodItems[i].classList.remove("list-group-item-darker");
        }
    })
}

function timeTableAppend(period: period) {
    timetable.append("<li class=\"list-group-item-darker list-group-flush list-time-item\">" +
        "<div class=\"row\"> <div class=\"col-2\"> " + //My apologies for this ugly html, but I assure you it works ;)
        "<p class=\"\">" + period.periodHour + "</p> </div> " +
        "<div class=\"col-10\"> <p class=\"\">" + period.periodType +
        "</p> </div> </div> </li>")
}