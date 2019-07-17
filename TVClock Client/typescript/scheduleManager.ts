//Renderer

class scheduleItem {
    periodName: string = "None"; //Default text on startup

    hour: string; // E.G 1 AM
    index: number; //index, 0 based for internal ue

    constructor(periodHour: string, periodIndex: number) {
        this.hour = periodHour;
        this.index = periodIndex;
    }
}

//Generate time list
//List of all 24 scheduleItems
let scheduleItems: scheduleItem[] = [];
let timetable = $("#view-schedule-timetable");
//AM
for (let i = 1; i <= 12; ++i) {
    timeTableAppend(new scheduleItem(i + " AM", i - 1));
}
//PM
for (let i = 1; i <= 12; ++i) {
    timeTableAppend(new scheduleItem(i + " PM", i - 1 + 12));
}

//Schedule clickable functionality
let selectedScheduleItemIndex = -1;

//Whether or not the user has selected a scheduleItem
let scheduleItemSelected = false;

let periodItems = $(".list-period-item");
let selectedPeriodItemIndex = -1; //-1 indicates nothing is selected

let periodConfigurationMenu = $("#period-configuration-menu");
periodConfigurationMenu.hide();
//Period clickable functionality
for (let i = 0; i < periodItems.length; ++i) {
    periodItems[i].addEventListener("click", () => {
        //Set clicked button as active
        //The class list-group-item is added as active only shows up with list-group-item
        //Removing the custom class list-group-item-darker
        if (selectedPeriodItemIndex >= 0) {
            periodItems[selectedPeriodItemIndex].classList.remove("active", "list-group-item");
            periodItems[selectedPeriodItemIndex].classList.add("list-group-item-darker");
        }

        //Allow unselecting of period items only when configurating periods
        if (!scheduleItemSelected && selectedPeriodItemIndex == i) {
            selectedPeriodItemIndex = -1;
            periodConfigurationMenu.hide();
        } else {
            selectedPeriodItemIndex = i;
            periodItems[i].classList.add("active", "list-group-item");
            periodItems[i].classList.remove("list-group-item-darker");

            //Allow choosing period of a scheduleItem if a scheduleItem is selected
            if (scheduleItemSelected) {
                //Set the value of the scheduleItem to the period
                scheduleItems[selectedScheduleItemIndex].periodName = periodItems[selectedPeriodItemIndex].innerHTML;

                //Refresh for text changes to the schedule list to show up
                timeTableRefresh();

                periodConfigurationMenu.hide();
            } else { //Otherwise show the configuration menu for periods
                periodConfigurationMenu.show();
            }
        }
    })
}

timeTableRefresh();

//

function deselectAllPeriods() {
    selectedPeriodItemIndex = -1;
    for (let i = 0; i < periodItems.length; ++i) {
        periodItems[i].classList.remove("active", "list-group-item");
        periodItems[i].classList.add("list-group-item-darker");
    }
}

function timeTableAppend(item: scheduleItem) {
    scheduleItems.push(item);
    timetable.append("<li class=\"list-group-item-darker list-group-flush list-time-item\">" +
        "<div class=\"row\"> <div class=\"col-2\"> " + //My apologies for this ugly html, but I assure you it works ;)
        "<p class=\"\">" + item.hour + "</p> </div> " +
        "<div class=\"col-10\"> <p class=\"\">" + item.periodName +
        "</p> </div> </div> </li>")
}

function timeTableRefresh() {
    timetable.html(" "); //Clear old text
    for (let i = 0; i < scheduleItems.length; ++i) {
        timetable.append("<li class=\"list-group-item-darker list-group-flush list-time-item\">" +
            "<div class=\"row\"> <div class=\"col-2\"> " + //My apologies for this ugly html, but I assure you it works ;)
            "<p class=\"\">" + scheduleItems[i].hour + "</p> </div> " +
            "<div class=\"col-10\"> <p class=\"\">" + scheduleItems[i].periodName +
            "</p> </div> </div> </li>")
    }

    //Setup schedule item click handlers
    let htmlScheduleItems = $(".list-time-item");
    for (let i = 0; i < htmlScheduleItems.length; ++i) {
        htmlScheduleItems[i].addEventListener("click", () => {
            //Hide period config menu
            periodConfigurationMenu.hide();

            //Set clicked button as active
            //The class list-group-item is added as active only shows up with list-group-item
            //Removing the custom class list-group-item-darker
            if (selectedScheduleItemIndex >= 0) {
                htmlScheduleItems[selectedScheduleItemIndex].classList.remove("active", "list-group-item");
                htmlScheduleItems[selectedScheduleItemIndex].classList.add("list-group-item-darker");
            }

            //If clicking the same item, unselect it
            if (selectedScheduleItemIndex == i) {
                selectedScheduleItemIndex = -1;

                scheduleItemSelected = false;

                deselectAllPeriods();
            } else {
                selectedScheduleItemIndex = i;
                htmlScheduleItems[i].classList.add("active", "list-group-item");
                htmlScheduleItems[i].classList.remove("list-group-item-darker");

                //Select scheduleItem item associated with the schedule
                scheduleItemSelected = true;

                //Select the period item matching the schedule item
                for (let j = 0; j < periodItems.length; ++j) {
                    //Find the desired period based on provided periodName
                    if (periodItems[j].innerHTML == scheduleItems[i].periodName) {
                        //If it is found, select it if it is not already selected
                        if (j == selectedPeriodItemIndex)
                            return;

                        periodItems[j].click();
                    }
                }
            }
        })
    }

    //Select the previously selected task
    if (selectedScheduleItemIndex >= 0) {
        htmlScheduleItems[selectedScheduleItemIndex].classList.add("active", "list-group-item");
        htmlScheduleItems[selectedScheduleItemIndex].classList.remove("list-group-item-darker");
    }
}