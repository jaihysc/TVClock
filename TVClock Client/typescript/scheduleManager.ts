//Renderer
//Manager for schedule view

import { ipcRenderer } from "electron";
import invert, { RGB, RgbArray, HexColor, BlackWhite } from "invert-color";
import {RequestType, NetworkOperation, LocalStorageOperation} from "./RequestTypes";

class ScheduleItemGeneric {
    periodName: string;

    hour: string | null; // E.G 1 AM
    color: string; //6 character hex string

    constructor(periodName: string, hour: string | null, color: string) {
        this.periodName = periodName;
        this.hour = hour;
        this.color = color;
    }
}

//--------------------------
//Setup
//List of all 24 scheduleItems
let scheduleItems: ScheduleItemGeneric[] = [];
let periodItems: ScheduleItemGeneric[] = [];

const defaultPeriodColor = "464646";

const scheduleItemsIdentifier = "schedule-view-scheduleItems";
const periodItemsIdentifier = "schedule-view-periodItems";

//-----------------------------
//Networking and data
//Await document ready before performing startup actions
$(function() {
    const fetchFromServerIdentifier = "schedule-view-fetchedFromServer";

    let fetchedFromServer: boolean = ipcRenderer.sendSync(LocalStorageOperation.Fetch, fetchFromServerIdentifier);
    if (!fetchedFromServer) {
        let retrievedScheduleIData = ipcRenderer.sendSync(NetworkOperation.Send,
            {requestType: RequestType.Get, identifiers: [scheduleItemsIdentifier]});
        let retrievedPeriodData = ipcRenderer.sendSync(NetworkOperation.Send,
            {requestType: RequestType.Get, identifiers: [periodItemsIdentifier]});

        let scheduleData: any;
        let periodData: any;

        //Generate default schedule list if not defined by the server
        if (retrievedScheduleIData == undefined || retrievedScheduleIData.data == undefined || (scheduleData = JSON.parse(retrievedScheduleIData.data[0])) == undefined ||
        retrievedPeriodData == undefined || retrievedPeriodData.data == undefined || (periodData = JSON.parse(retrievedPeriodData.data[0])) == undefined ) {
            //12PM - or 0 in 24 hour
            timeTableAppend(new ScheduleItemGeneric("None", "12 PM", defaultPeriodColor));
            scheduleItems.push(new ScheduleItemGeneric("None", "12 PM", defaultPeriodColor));

            //AM
            for (let i = 1; i <= 12; ++i) {
                let item = new ScheduleItemGeneric("None", i + " AM", defaultPeriodColor);
                timeTableAppend(item); //None is default period name
                scheduleItems.push(item);
            }
            //PM
            for (let i = 1; i <= 11; ++i) {
                let item = new ScheduleItemGeneric("None", i + " PM", defaultPeriodColor);
                timeTableAppend(item);
                scheduleItems.push(item);
            }

            //Push a single default period item
            periodItems.push(new ScheduleItemGeneric("None", null, defaultPeriodColor));

            refreshScheduleList(true);
            refreshPeriodList(true);
        } else {
            //Schedule list already exists on server
            updateScheduleItems(scheduleData, false);
            updatePeriodItems(periodData, false);
        }

        //Save that it has fetched from server
        ipcRenderer.send(LocalStorageOperation.Save, {identifier: fetchFromServerIdentifier, data: true});
    } else {
        //Retrieved from localstorage
        //Retrieve ScheduleItems
        let retrievedScheduleItems = ipcRenderer.sendSync(LocalStorageOperation.Fetch, scheduleItemsIdentifier);
        updateScheduleItems(retrievedScheduleItems, false);

        //Retrieve PeriodItems
        let retrievedPeriodItems = ipcRenderer.sendSync(LocalStorageOperation.Fetch, periodItemsIdentifier);

        updatePeriodItems(retrievedPeriodItems, false);
    }

    ipcRenderer.on(scheduleItemsIdentifier + "-update", (event: any, data: string) => {
        updateScheduleItems(JSON.parse(data), false);
    });
    ipcRenderer.on(periodItemsIdentifier + "-update", (event: any, data: string) => {
        updatePeriodItems(JSON.parse(data), false);
    });
});

//Containers for scheduleItems and periodItems
let scheduleItemContainer = $("#view-schedule-scheduleItem-container");
let periodItemContainer = $("#view-schedule-periodItem-container");


//-----------------------------
//Schedule clickable functionality
let selectedScheduleItemIndex = -1;

//Whether or not the user has selected a scheduleItem
let scheduleItemSelected = false;

let selectedPeriodItemIndex = -1; //-1 indicates nothing is selected

let periodConfigurationMenu = $("#period-configuration-menu");
periodConfigurationMenu.hide();

//-----------------------------
//Handlers for add, edit and remove buttons
let addButton = $("#schedule-period-add");
let editButton = $("#schedule-period-edit");
let removeButton = $("#schedule-period-remove");

let editingPeriod = false;
let errorText = $("#new-period-text-error");
errorText.hide();

addButton.on("click", () => {
    let inputElement = $("#new-period-text");
    let textInput = String(inputElement.val());
    if (textInput == "") {
        errorText.html("Enter a period name");
        errorText.show();
        return;
    }

    //Check for duplicates
    for (let i = 0; i < periodItems.length; ++i) {
        if (periodItems[i].periodName == textInput) {
            if (editingPeriod && periodItems[selectedPeriodItemIndex].periodName == textInput) //Do not count itself as duplicate when editing
                continue;

            errorText.html("Period already exists");
            errorText.show();
            return;
        }
    }

    errorText.hide();

    let inputColorElement = $("#new-period-color");

    if (editingPeriod) {
        //Rename all scheduleItems with the name to the new name, change color to new color
        for (let i = 0; i < scheduleItems.length; ++i) {
            if (scheduleItems[i].periodName == periodItems[selectedPeriodItemIndex].periodName) {
                scheduleItems[i].periodName = textInput;
                scheduleItems[i].color = String(inputColorElement.val()).substring(1); //Substring away hex # at beginning
            }
        }

        periodItems[selectedPeriodItemIndex].periodName = textInput;
        periodItems[selectedPeriodItemIndex].color = String(inputColorElement.val()).substring(1);

        editButton.trigger("click");
        refreshScheduleList(true);
    } else {
        periodItems.push(new ScheduleItemGeneric(textInput, null, String(inputColorElement.val()).substring(1))); //Cut off the # at the start of the color string
    }

    inputElement.val("");

    refreshPeriodList(true);
});

editButton.on("click", () => {
    let inputElement = $("#new-period-text");
    let inputColorElement = $("#new-period-color");
    //Exit updating if edit button is repressed
    if (editingPeriod) {
        editingPeriod = false;
        addButton.html("Add period");
        editButton.html("Edit period");
        removeButton.show();

        inputElement.val("");
    } else {
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

removeButton.on("click", () => {
    //Set scheduleItems that were using this period back to None, set color to default
    for (let i = 0; i < scheduleItems.length; ++i) {
        if (scheduleItems[i].periodName == periodItems[selectedPeriodItemIndex].periodName) {
            scheduleItems[i].periodName = "None";
            scheduleItems[i].color = defaultPeriodColor;
        }
    }

    //Remove task by overwriting it with the tasks after it (n+1)
    for (let i = selectedPeriodItemIndex; i < periodItems.length; ++i) {
        //If at end of array, pop last one away since there is none after it
        if (i + 1 >= periodItems.length) {
            periodItems.pop();
            break;
        }

        periodItems[i] = periodItems[i+1];
    }

    //If there are no more tasks in the list, do not select anything
    if (periodItems.length == 0) {
        selectedPeriodItemIndex = -1;
        editButton.hide();
        removeButton.hide();
    } else if (selectedPeriodItemIndex >= periodItems.length) { //If user selected last task
        selectedPeriodItemIndex -= 1;
    }

    refreshScheduleList(true);
    refreshPeriodList(true);
});

//-----------------------------
//Functions
function updateScheduleItems(data: any[], sendServerPost: boolean) {
    scheduleItems = [];
    if (data == undefined)
        return;

    for (let i = 0; i < data.length; ++i) {
        scheduleItems.push(new ScheduleItemGeneric(data[i].periodName, data[i].hour, data[i].color))
    }

    refreshScheduleList(sendServerPost);
}
function updatePeriodItems(data: ScheduleItemGeneric[], sendServerPost: boolean) {
    //Clear existing values
    periodItems = [];

    for (let i = 0; i < data.length; ++i) {
        periodItems.push(new ScheduleItemGeneric(data[i].periodName, null, data[i].color))
    }

    refreshPeriodList(sendServerPost)
}

function deselectAllPeriods() {
    selectedPeriodItemIndex = -1;

    let htmlPeriodItems = $(".list-period-item");
    for (let i = 0; i < htmlPeriodItems.length; ++i) {
        htmlPeriodItems[i].classList.remove("active-important", "list-group-item");
        htmlPeriodItems[i].classList.add("list-group-item-darker");
    }
}

function timeTableAppend(item: ScheduleItemGeneric) {
    if (item.hour == null)
        item.hour = "";

    let newScheduleItemColumn1 = $("<div class='col-3'/>")
        .text(item.hour);
    let newScheduleItemColumn2 = $("<div class='col-9'/>")
        .append(item.periodName); //Period name in scheduleItems will not need to be escaped as they are escaped earlier (hopefully)

    let newScheduleItemRow = $("<div class='row'/>")
        .append(newScheduleItemColumn1)
        .append(newScheduleItemColumn2);

    let newScheduleItem = $("<li class='list-group-item-darker list-group-flush list-time-item'/>");
    newScheduleItem.append(newScheduleItemRow);

    newScheduleItem.css("color", invert(item.color)); //Invert foreground color to stand out
    newScheduleItem.css("background-color", "#" + item.color); //Set color
    newScheduleItem.appendTo(scheduleItemContainer);
}

//Refresh list
function refreshScheduleList(sendServerPost: boolean) {
    scheduleItemContainer.html(" "); //Clear old text
    for (let i = 0; i < scheduleItems.length; ++i) {
        timeTableAppend(scheduleItems[i]);
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
                htmlScheduleItems[selectedScheduleItemIndex].classList.remove("active-important", "list-group-item");
                htmlScheduleItems[selectedScheduleItemIndex].classList.add("list-group-item-darker");
                htmlScheduleItems[selectedScheduleItemIndex].children[0].classList.remove("white-important");
            }

            //If clicking the same item, unselect it
            if (selectedScheduleItemIndex == i) {
                selectedScheduleItemIndex = -1;

                scheduleItemSelected = false;

                deselectAllPeriods();
            } else {
                selectedScheduleItemIndex = i;

                htmlScheduleItems[i].classList.add("active-important", "list-group-item");
                htmlScheduleItems[i].classList.remove("list-group-item-darker");
                htmlScheduleItems[i].children[0].classList.add("white-important");

                //Select scheduleItem item associated with the schedule
                scheduleItemSelected = true;

                let htmlPeriodItems = $(".list-period-item");

                //Select the period item matching the schedule item
                for (let j = 0; j < htmlPeriodItems.length; ++j) {
                    //Find the desired period based on provided periodName
                    if (htmlPeriodItems[j].innerHTML == scheduleItems[i].periodName) {
                        //If it is found, select it if it is not already selected
                        if (j == selectedPeriodItemIndex)
                            return;

                        htmlPeriodItems[j].click();
                    }
                }
            }
        })
    }

    //Select the previously selected task
    if (selectedScheduleItemIndex >= 0) {
        htmlScheduleItems[selectedScheduleItemIndex].classList.add("active-important", "list-group-item");
        htmlScheduleItems[selectedScheduleItemIndex].classList.remove("list-group-item-darker");
        htmlScheduleItems[selectedScheduleItemIndex].children[0].classList.add("white-important");
    }

    //Save scheduleItems
    ipcRenderer.send(LocalStorageOperation.Save, {identifier: scheduleItemsIdentifier, data: scheduleItems});
    //send POST to server
    if (sendServerPost)
        ipcRenderer.send(NetworkOperation.Send, {requestType: RequestType.Post, identifiers: [scheduleItemsIdentifier], data: scheduleItems});
}

function refreshPeriodList(sendServerPost: boolean) {
    periodItemContainer.html(""); //Clear old text

    for (let i = 0; i < periodItems.length; ++i) {
        $("<li class='list-group-item-darker list-group-flush list-period-item'/>")
            .css("background-color", "#" + periodItems[i].color)
            .css("color", invert(periodItems[i].color))
            .text(periodItems[i].periodName)
            .appendTo(periodItemContainer);
    }

    let htmlPeriodItems = $(".list-period-item");

    //Period clickable functionality
    for (let i = 0; i < htmlPeriodItems.length; ++i) {
        htmlPeriodItems[i].addEventListener("click", () => {
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
            } else {
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
                } else { //Otherwise show the configuration menu for periods
                    periodConfigurationMenu.show();
                }

                //Do not show default period configuration menu
                if (selectedPeriodItemIndex == 0) {
                    periodConfigurationMenu.hide();
                }
            }
        })
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
    ipcRenderer.send(LocalStorageOperation.Save, {identifier: periodItemsIdentifier, data: periodItems});

    if (sendServerPost)
        ipcRenderer.send(NetworkOperation.Send, {requestType: RequestType.Post, identifiers: [periodItemsIdentifier], data: periodItems});

}