"use strict";
//Renderer
var scheduleItem = /** @class */ (function () {
    function scheduleItem(periodHour, periodIndex) {
        this.periodName = "None"; //Default text on startup
        this.hour = periodHour;
        this.index = periodIndex;
    }
    return scheduleItem;
}());
//Generate time list
//List of all 24 scheduleItems
var scheduleItems = [];
var timetable = $("#view-schedule-timetable");
//AM
for (var i = 1; i <= 12; ++i) {
    timeTableAppend(new scheduleItem(i + " AM", i - 1));
}
//PM
for (var i = 1; i <= 12; ++i) {
    timeTableAppend(new scheduleItem(i + " PM", i - 1 + 12));
}
//Schedule clickable functionality
var selectedScheduleItemIndex = -1;
//Whether or not the user has selected a scheduleItem
var scheduleItemSelected = false;
var periodItems = $(".list-period-item");
var selectedPeriodItemIndex = -1; //-1 indicates nothing is selected
var periodConfigurationMenu = $("#period-configuration-menu");
periodConfigurationMenu.hide();
var _loop_1 = function (i) {
    periodItems[i].addEventListener("click", function () {
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
        }
        else {
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
            }
            else { //Otherwise show the configuration menu for periods
                periodConfigurationMenu.show();
            }
        }
    });
};
//Period clickable functionality
for (var i = 0; i < periodItems.length; ++i) {
    _loop_1(i);
}
timeTableRefresh();
//
function deselectAllPeriods() {
    selectedPeriodItemIndex = -1;
    for (var i = 0; i < periodItems.length; ++i) {
        periodItems[i].classList.remove("active", "list-group-item");
        periodItems[i].classList.add("list-group-item-darker");
    }
}
function timeTableAppend(item) {
    scheduleItems.push(item);
    timetable.append("<li class=\"list-group-item-darker list-group-flush list-time-item\">" +
        "<div class=\"row\"> <div class=\"col-2\"> " + //My apologies for this ugly html, but I assure you it works ;)
        "<p class=\"\">" + item.hour + "</p> </div> " +
        "<div class=\"col-10\"> <p class=\"\">" + item.periodName +
        "</p> </div> </div> </li>");
}
function timeTableRefresh() {
    timetable.html(" "); //Clear old text
    for (var i = 0; i < scheduleItems.length; ++i) {
        timetable.append("<li class=\"list-group-item-darker list-group-flush list-time-item\">" +
            "<div class=\"row\"> <div class=\"col-2\"> " + //My apologies for this ugly html, but I assure you it works ;)
            "<p class=\"\">" + scheduleItems[i].hour + "</p> </div> " +
            "<div class=\"col-10\"> <p class=\"\">" + scheduleItems[i].periodName +
            "</p> </div> </div> </li>");
    }
    //Setup schedule item click handlers
    var htmlScheduleItems = $(".list-time-item");
    var _loop_2 = function (i) {
        htmlScheduleItems[i].addEventListener("click", function () {
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
            }
            else {
                selectedScheduleItemIndex = i;
                htmlScheduleItems[i].classList.add("active", "list-group-item");
                htmlScheduleItems[i].classList.remove("list-group-item-darker");
                //Select scheduleItem item associated with the schedule
                scheduleItemSelected = true;
                //Select the period item matching the schedule item
                for (var j = 0; j < periodItems.length; ++j) {
                    //Find the desired period based on provided periodName
                    if (periodItems[j].innerHTML == scheduleItems[i].periodName) {
                        //If it is found, select it if it is not already selected
                        if (j == selectedPeriodItemIndex)
                            return;
                        periodItems[j].click();
                    }
                }
            }
        });
    };
    for (var i = 0; i < htmlScheduleItems.length; ++i) {
        _loop_2(i);
    }
    //Select the previously selected task
    if (selectedScheduleItemIndex >= 0) {
        htmlScheduleItems[selectedScheduleItemIndex].classList.add("active", "list-group-item");
        htmlScheduleItems[selectedScheduleItemIndex].classList.remove("list-group-item-darker");
    }
}
