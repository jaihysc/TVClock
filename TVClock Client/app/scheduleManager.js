"use strict";
//Renderer
//Manager for schedule view
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var invert_color_1 = __importDefault(require("invert-color"));
var ScheduleItem = /** @class */ (function () {
    function ScheduleItem(periodName, hour, color) {
        this.periodName = periodName;
        this.hour = hour;
        this.color = color;
    }
    return ScheduleItem;
}());
var PeriodItem = /** @class */ (function () {
    function PeriodItem(name, color) {
        this.name = name;
        this.color = color;
    }
    return PeriodItem;
}());
//List of all 24 scheduleItems
var scheduleItems = [];
var periodItems = [];
var defaultPeriodColor = "464646";
periodItems.push(new PeriodItem("None", defaultPeriodColor)); //Push a single default period item
//-----------------------------
//Networking and data
var scheduleItemsIdentifier = "schedule-view-scheduleItems";
var periodItemsIdentifier = "schedule-view-periodItems";
var fetchFromServerIdentifier = "schedule-view-fetchedFromServer";
electron_1.ipcRenderer.send("data-retrieve", fetchFromServerIdentifier);
electron_1.ipcRenderer.once("data-retrieve-response", function (event, fetchedFromServer) {
    if (!fetchedFromServer) {
        //Todo, fetch from server
        console.log("server fetch");
        //Generate default schedule list
        //AM
        for (var i = 1; i <= 12; ++i) {
            var item = new ScheduleItem("None", i + " AM", defaultPeriodColor);
            timeTableAppend(item); //None is default period name
            scheduleItems.push(item);
        }
        //PM
        for (var i = 1; i <= 12; ++i) {
            var item = new ScheduleItem("None", i + " PM", defaultPeriodColor);
            timeTableAppend(item);
            scheduleItems.push(item);
        }
        //Save that it has fetched from server
        electron_1.ipcRenderer.send("data-save", { identifier: fetchFromServerIdentifier, data: true });
        //-----------------------------
        //Await document ready before performing startup actions
        $(function () {
            refreshScheduleList();
            refreshPeriodList();
        });
    }
    else {
        electron_1.ipcRenderer.send("data-retrieve", scheduleItemsIdentifier);
        electron_1.ipcRenderer.once("data-retrieve-response", function (event, data) {
            for (var i = 0; i < data.length; ++i) {
                scheduleItems.push(new ScheduleItem(data[i].periodName, data[i].hour, data[i].color));
            }
            electron_1.ipcRenderer.send("data-retrieve", periodItemsIdentifier);
            electron_1.ipcRenderer.once("data-retrieve-response", function (event, data) {
                //Clear existing values
                periodItems = [];
                for (var i = 0; i < data.length; ++i) {
                    periodItems.push(new PeriodItem(data[i].name, data[i].color));
                }
                //-----------------------------
                //Await document ready before performing startup actions
                $(function () {
                    refreshScheduleList();
                    refreshPeriodList();
                });
            });
        });
    }
});
//Containers for scheduleItems and periodItems
var scheduleItemContainer = $("#view-schedule-scheduleItem-container");
var periodItemContainer = $("#view-schedule-periodItem-container");
//-----------------------------
//Schedule clickable functionality
var selectedScheduleItemIndex = -1;
//Whether or not the user has selected a scheduleItem
var scheduleItemSelected = false;
var selectedPeriodItemIndex = -1; //-1 indicates nothing is selected
var periodConfigurationMenu = $("#period-configuration-menu");
periodConfigurationMenu.hide();
//-----------------------------
//Handlers for add, edit and remove buttons
var addButton = $("#schedule-period-add");
var editButton = $("#schedule-period-edit");
var removeButton = $("#schedule-period-remove");
var editingPeriod = false;
var errorText = $("#new-period-text-error");
errorText.hide();
addButton.on("click", function () {
    var inputElement = $("#new-period-text");
    var textInput = String(inputElement.val());
    if (textInput == "") {
        errorText.html("Enter a period name");
        errorText.show();
        return;
    }
    //Check for duplicates
    for (var i = 0; i < periodItems.length; ++i) {
        if (periodItems[i].name == textInput) {
            if (editingPeriod && periodItems[selectedPeriodItemIndex].name == textInput) //Do not count itself as duplicate when editing
                continue;
            errorText.html("Period already exists");
            errorText.show();
            return;
        }
    }
    errorText.hide();
    var inputColorElement = $("#new-period-color");
    if (editingPeriod) {
        //Rename all scheduleItems with the name to the new name, change color to new color
        for (var i = 0; i < scheduleItems.length; ++i) {
            if (scheduleItems[i].periodName == periodItems[selectedPeriodItemIndex].name) {
                scheduleItems[i].periodName = textInput;
                scheduleItems[i].color = String(inputColorElement.val()).substring(1); //Substring away hex # at beginning
            }
        }
        periodItems[selectedPeriodItemIndex].name = textInput;
        periodItems[selectedPeriodItemIndex].color = String(inputColorElement.val()).substring(1);
        editButton.trigger("click");
        refreshScheduleList();
    }
    else {
        periodItems.push(new PeriodItem(textInput, String(inputColorElement.val()).substring(1))); //Cut off the # at the start of the color string
    }
    inputElement.val("");
    refreshPeriodList();
});
editButton.on("click", function () {
    var inputElement = $("#new-period-text");
    var inputColorElement = $("#new-period-color");
    //Exit updating if edit button is repressed
    if (editingPeriod) {
        editingPeriod = false;
        addButton.html("Add period");
        editButton.html("Edit period");
        removeButton.show();
        inputElement.val("");
    }
    else {
        //Rename add task button to update task
        editingPeriod = true;
        addButton.html("Update period");
        editButton.html("Cancel");
        removeButton.hide();
        //Load data from the selected task item into fields
        inputElement.val(periodItems[selectedPeriodItemIndex].name);
        inputColorElement.val("#" + periodItems[selectedPeriodItemIndex].color);
    }
});
removeButton.on("click", function () {
    //Set scheduleItems that were using this period back to None, set color to default
    for (var i = 0; i < scheduleItems.length; ++i) {
        if (scheduleItems[i].periodName == periodItems[selectedPeriodItemIndex].name) {
            scheduleItems[i].periodName = "None";
            scheduleItems[i].color = defaultPeriodColor;
        }
    }
    //Remove task by overwriting it with the tasks after it (n+1)
    for (var i = selectedPeriodItemIndex; i < periodItems.length; ++i) {
        //If at end of array, pop last one away since there is none after it
        if (i + 1 >= periodItems.length) {
            periodItems.pop();
            break;
        }
        periodItems[i] = periodItems[i + 1];
    }
    //If there are no more tasks in the list, do not select anything
    if (periodItems.length == 0) {
        selectedPeriodItemIndex = -1;
        editButton.hide();
        removeButton.hide();
    }
    else if (selectedPeriodItemIndex >= periodItems.length) { //If user selected last task
        selectedPeriodItemIndex -= 1;
    }
    refreshScheduleList();
    refreshPeriodList();
});
//-----------------------------
//Functions
function deselectAllPeriods() {
    selectedPeriodItemIndex = -1;
    var htmlPeriodItems = $(".list-period-item");
    for (var i = 0; i < htmlPeriodItems.length; ++i) {
        htmlPeriodItems[i].classList.remove("active-important", "list-group-item");
        htmlPeriodItems[i].classList.add("list-group-item-darker");
    }
}
function timeTableAppend(item) {
    var newScheduleItemColumn1 = $("<div class='col-3'/>")
        .text(item.hour);
    var newScheduleItemColumn2 = $("<div class='col-9'/>")
        .append(item.periodName); //Period name in scheduleItems will not need to be escaped as they are escaped earlier (hopefully)
    var newScheduleItemRow = $("<div class='row'/>")
        .append(newScheduleItemColumn1)
        .append(newScheduleItemColumn2);
    var newScheduleItem = $("<li class='list-group-item-darker list-group-flush list-time-item'/>");
    newScheduleItem.append(newScheduleItemRow);
    newScheduleItem.css("color", invert_color_1.default(item.color)); //Invert foreground color to stand out
    newScheduleItem.css("background-color", "#" + item.color); //Set color
    newScheduleItem.appendTo(scheduleItemContainer);
}
//Refresh list
function refreshScheduleList() {
    scheduleItemContainer.html(" "); //Clear old text
    for (var i = 0; i < scheduleItems.length; ++i) {
        timeTableAppend(scheduleItems[i]);
    }
    //Setup schedule item click handlers
    var htmlScheduleItems = $(".list-time-item");
    var _loop_1 = function (i) {
        htmlScheduleItems[i].addEventListener("click", function () {
            //Hide period config menu
            periodConfigurationMenu.hide();
            //Set clicked button as active
            //The class list-group-item is added as active only shows up with list-group-item
            //Removing the custom class list-group-item-darker
            if (selectedScheduleItemIndex >= 0) {
                htmlScheduleItems[selectedScheduleItemIndex].classList.remove("active-important", "list-group-item");
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
                htmlScheduleItems[i].classList.add("active-important", "list-group-item");
                htmlScheduleItems[i].classList.remove("list-group-item-darker");
                //Select scheduleItem item associated with the schedule
                scheduleItemSelected = true;
                var htmlPeriodItems = $(".list-period-item");
                //Select the period item matching the schedule item
                for (var j = 0; j < htmlPeriodItems.length; ++j) {
                    //Find the desired period based on provided periodName
                    if (htmlPeriodItems[j].innerHTML == scheduleItems[i].periodName) {
                        //If it is found, select it if it is not already selected
                        if (j == selectedPeriodItemIndex)
                            return;
                        htmlPeriodItems[j].click();
                    }
                }
            }
        });
    };
    for (var i = 0; i < htmlScheduleItems.length; ++i) {
        _loop_1(i);
    }
    //Select the previously selected task
    if (selectedScheduleItemIndex >= 0) {
        htmlScheduleItems[selectedScheduleItemIndex].classList.add("active-important", "list-group-item");
        htmlScheduleItems[selectedScheduleItemIndex].classList.remove("list-group-item-darker");
    }
    //Save scheduleItems
    electron_1.ipcRenderer.send("data-save", { identifier: scheduleItemsIdentifier, data: scheduleItems });
}
function refreshPeriodList() {
    periodItemContainer.html(" "); //Clear old text
    for (var i = 0; i < periodItems.length; ++i) {
        $("<li class='list-group-item-darker list-group-flush list-period-item'/>")
            .css("background-color", "#" + periodItems[i].color)
            .css("color", invert_color_1.default(periodItems[i].color))
            .text(periodItems[i].name)
            .appendTo(periodItemContainer);
    }
    var htmlPeriodItems = $(".list-period-item");
    var _loop_2 = function (i) {
        htmlPeriodItems[i].addEventListener("click", function () {
            //Cancel editing
            if (editingPeriod) {
                editingPeriod = false;
                addButton.html("Add period");
                editButton.html("Edit period");
                removeButton.show();
                $("#new-period-text").val("");
            }
            //Set clicked button as active
            //The class list-group-item is added as active only shows up with list-group-item
            //Removing the custom class list-group-item-darker
            if (selectedPeriodItemIndex >= 0) {
                htmlPeriodItems[selectedPeriodItemIndex].classList.remove("active-important", "list-group-item");
                htmlPeriodItems[selectedPeriodItemIndex].classList.add("list-group-item-darker");
            }
            //Allow unselecting of period items only when configurating periods
            if (!scheduleItemSelected && selectedPeriodItemIndex == i) {
                selectedPeriodItemIndex = -1;
                periodConfigurationMenu.hide();
            }
            else {
                selectedPeriodItemIndex = i;
                htmlPeriodItems[i].classList.add("active-important", "list-group-item");
                htmlPeriodItems[i].classList.remove("list-group-item-darker");
                //Allow choosing period of a scheduleItem if a scheduleItem is selected
                if (scheduleItemSelected) {
                    //Set the value of the scheduleItem to the period
                    scheduleItems[selectedScheduleItemIndex].periodName = periodItems[selectedPeriodItemIndex].name;
                    scheduleItems[selectedScheduleItemIndex].color = periodItems[selectedPeriodItemIndex].color;
                    //Refresh for text changes to the schedule list to show up
                    refreshScheduleList();
                    periodConfigurationMenu.hide();
                }
                else { //Otherwise show the configuration menu for periods
                    periodConfigurationMenu.show();
                }
                //Do not show default period configuration menu
                if (selectedPeriodItemIndex == 0) {
                    periodConfigurationMenu.hide();
                }
            }
        });
    };
    //Period clickable functionality
    for (var i = 0; i < htmlPeriodItems.length; ++i) {
        _loop_2(i);
    }
    //Save periodItems
    electron_1.ipcRenderer.send("data-save", { identifier: periodItemsIdentifier, data: periodItems });
    //Select the previously selected task
    if (selectedPeriodItemIndex >= 0) {
        htmlPeriodItems[selectedPeriodItemIndex].classList.add("active-important", "list-group-item");
        htmlPeriodItems[selectedPeriodItemIndex].classList.remove("list-group-item-darker");
    }
    //Do not show default period configuration menu on refresh
    if (selectedPeriodItemIndex == 0) {
        periodConfigurationMenu.hide();
    }
}
