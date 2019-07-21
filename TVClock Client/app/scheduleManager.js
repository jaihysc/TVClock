"use strict";
//Renderer
//Manager for schedule view
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var invert_color_1 = __importDefault(require("invert-color"));
var RequestTypes_1 = require("./RequestTypes");
var ScheduleItemGeneric = /** @class */ (function () {
    function ScheduleItemGeneric(periodName, hour, color) {
        this.periodName = periodName;
        this.hour = hour;
        this.color = color;
    }
    return ScheduleItemGeneric;
}());
//--------------------------
//Setup
//List of all 24 scheduleItems
var scheduleItems = [];
var periodItems = [];
var defaultPeriodColor = "464646";
var scheduleItemsIdentifier = "schedule-view-scheduleItems";
var periodItemsIdentifier = "schedule-view-periodItems";
//-----------------------------
//Networking and data
//Await document ready before performing startup actions
$(function () {
    var fetchFromServerIdentifier = "schedule-view-fetchedFromServer";
    var fetchedFromServer = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, fetchFromServerIdentifier);
    if (!fetchedFromServer) {
        var retrievedScheduleIData = electron_1.ipcRenderer.sendSync(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Get, identifiers: [scheduleItemsIdentifier] });
        var retrievedPeriodData = electron_1.ipcRenderer.sendSync(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Get, identifiers: [periodItemsIdentifier] });
        var scheduleData = void 0;
        var periodData = void 0;
        //Generate default schedule list if not defined by the server
        if (retrievedScheduleIData == undefined || retrievedScheduleIData.data == undefined || (scheduleData = JSON.parse(retrievedScheduleIData.data[0])) == undefined ||
            retrievedPeriodData == undefined || retrievedPeriodData.data == undefined || (periodData = JSON.parse(retrievedPeriodData.data[0])) == undefined) {
            //AM
            for (var i = 1; i <= 12; ++i) {
                var item = new ScheduleItemGeneric("None", i + " AM", defaultPeriodColor);
                timeTableAppend(item); //None is default period name
                scheduleItems.push(item);
            }
            //PM
            for (var i = 1; i <= 12; ++i) {
                var item = new ScheduleItemGeneric("None", i + " PM", defaultPeriodColor);
                timeTableAppend(item);
                scheduleItems.push(item);
            }
            //Push a single default period item
            periodItems.push(new ScheduleItemGeneric("None", null, defaultPeriodColor));
            refreshScheduleList(true);
            refreshPeriodList(true);
        }
        else {
            //Schedule list already exists on server
            updateScheduleItems(scheduleData, false);
            updatePeriodItems(periodData, false);
        }
        //Save that it has fetched from server
        electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: fetchFromServerIdentifier, data: true });
    }
    else {
        //Retrieved from localstorage
        //Retrieve ScheduleItems
        var retrievedScheduleItems = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, scheduleItemsIdentifier);
        updateScheduleItems(retrievedScheduleItems, false);
        //Retrieve PeriodItems
        var retrievedPeriodItems = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, periodItemsIdentifier);
        updatePeriodItems(retrievedPeriodItems, false);
    }
    electron_1.ipcRenderer.on(scheduleItemsIdentifier + "-update", function (event, data) {
        updateScheduleItems(JSON.parse(data), false);
    });
    electron_1.ipcRenderer.on(periodItemsIdentifier + "-update", function (event, data) {
        updatePeriodItems(JSON.parse(data), false);
    });
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
        if (periodItems[i].periodName == textInput) {
            if (editingPeriod && periodItems[selectedPeriodItemIndex].periodName == textInput) //Do not count itself as duplicate when editing
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
            if (scheduleItems[i].periodName == periodItems[selectedPeriodItemIndex].periodName) {
                scheduleItems[i].periodName = textInput;
                scheduleItems[i].color = String(inputColorElement.val()).substring(1); //Substring away hex # at beginning
            }
        }
        periodItems[selectedPeriodItemIndex].periodName = textInput;
        periodItems[selectedPeriodItemIndex].color = String(inputColorElement.val()).substring(1);
        editButton.trigger("click");
        refreshScheduleList(true);
    }
    else {
        periodItems.push(new ScheduleItemGeneric(textInput, null, String(inputColorElement.val()).substring(1))); //Cut off the # at the start of the color string
    }
    inputElement.val("");
    refreshPeriodList(true);
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
        inputElement.val(periodItems[selectedPeriodItemIndex].periodName);
        inputColorElement.val("#" + periodItems[selectedPeriodItemIndex].color);
    }
});
removeButton.on("click", function () {
    //Set scheduleItems that were using this period back to None, set color to default
    for (var i = 0; i < scheduleItems.length; ++i) {
        if (scheduleItems[i].periodName == periodItems[selectedPeriodItemIndex].periodName) {
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
    refreshScheduleList(true);
    refreshPeriodList(true);
});
//-----------------------------
//Functions
function updateScheduleItems(data, sendServerPost) {
    scheduleItems = [];
    if (data == undefined)
        return;
    for (var i = 0; i < data.length; ++i) {
        scheduleItems.push(new ScheduleItemGeneric(data[i].periodName, data[i].hour, data[i].color));
    }
    refreshScheduleList(sendServerPost);
}
function updatePeriodItems(data, sendServerPost) {
    //Clear existing values
    periodItems = [];
    for (var i = 0; i < data.length; ++i) {
        periodItems.push(new ScheduleItemGeneric(data[i].periodName, null, data[i].color));
    }
    refreshPeriodList(sendServerPost);
}
function deselectAllPeriods() {
    selectedPeriodItemIndex = -1;
    var htmlPeriodItems = $(".list-period-item");
    for (var i = 0; i < htmlPeriodItems.length; ++i) {
        htmlPeriodItems[i].classList.remove("active-important", "list-group-item");
        htmlPeriodItems[i].classList.add("list-group-item-darker");
    }
}
function timeTableAppend(item) {
    if (item.hour == null)
        item.hour = "";
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
function refreshScheduleList(sendServerPost) {
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
                htmlScheduleItems[selectedScheduleItemIndex].children[0].classList.remove("white-important");
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
                htmlScheduleItems[i].children[0].classList.add("white-important");
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
        htmlScheduleItems[selectedScheduleItemIndex].children[0].classList.add("white-important");
    }
    //Save scheduleItems
    electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: scheduleItemsIdentifier, data: scheduleItems });
    //send POST to server
    if (sendServerPost)
        electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Post, identifiers: [scheduleItemsIdentifier], data: scheduleItems });
}
function refreshPeriodList(sendServerPost) {
    periodItemContainer.html(""); //Clear old text
    for (var i = 0; i < periodItems.length; ++i) {
        $("<li class='list-group-item-darker list-group-flush list-period-item'/>")
            .css("background-color", "#" + periodItems[i].color)
            .css("color", invert_color_1.default(periodItems[i].color))
            .text(periodItems[i].periodName)
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
                    scheduleItems[selectedScheduleItemIndex].periodName = periodItems[selectedPeriodItemIndex].periodName;
                    scheduleItems[selectedScheduleItemIndex].color = periodItems[selectedPeriodItemIndex].color;
                    //Refresh for text changes to the schedule list to show up
                    refreshScheduleList(true);
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
    //Select the previously selected period
    if (selectedPeriodItemIndex >= 0) {
        htmlPeriodItems[selectedPeriodItemIndex].classList.add("active-important", "list-group-item");
        htmlPeriodItems[selectedPeriodItemIndex].classList.remove("list-group-item-darker");
    }
    //Do not show default period configuration menu on refresh
    if (selectedPeriodItemIndex == 0) {
        periodConfigurationMenu.hide();
    }
    //Save periodItems
    electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: periodItemsIdentifier, data: periodItems });
    if (sendServerPost)
        electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Post, identifiers: [periodItemsIdentifier], data: periodItems });
}
