//Renderer

//TODO!!!! SANITIZE USER INPUTS

class scheduleItem {
    periodName: string = "None"; //Default text on startup

    hour: string; // E.G 1 AM
    index: number; //index, 0 based for internal ue

    constructor(periodHour: string, periodIndex: number) {
        this.hour = periodHour;
        this.index = periodIndex;
    }
}

class periodItem {
    name: string;
    color: any; //Todo, setup color for period items

    constructor(name: string) {
        this.name = name;
    }
}

//List of all 24 scheduleItems
let scheduleItems: scheduleItem[] = [];
let periodItems: periodItem[] = [];
periodItems.push(new periodItem("None")); //Push a single default period item

//Containers for scheduleItems and periodItems
let scheduleItemContainer = $("#view-schedule-scheduleItem-container");
let periodItemContainer = $("#view-schedule-periodItem-container");

//Generate time list
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

let selectedPeriodItemIndex = -1; //-1 indicates nothing is selected

let periodConfigurationMenu = $("#period-configuration-menu");
periodConfigurationMenu.hide();

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

    //Check for duplicats
    for (let i = 0; i < periodItems.length; ++i) {
        if (periodItems[i].name == textInput) {
            errorText.html("Period already exists");
            errorText.show();
            return;
        }
    }

    errorText.hide();
    periodItems.push(new periodItem(textInput));
    inputElement.val("");

    refreshPeriodList();
});

editButton.on("click", () => {
    let inputElement = $("#new-period-text");

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
        inputElement.val(periodItems[selectedPeriodItemIndex].name);
    }
});

removeButton.on("click", () => {
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

    refreshPeriodList();
});

//Document ready
$(function() {
    refreshScheduleList();
    refreshPeriodList();
});

//

function deselectAllPeriods() {
    selectedPeriodItemIndex = -1;

    let htmlPeriodItems = $(".list-period-item");
    for (let i = 0; i < htmlPeriodItems.length; ++i) {
        htmlPeriodItems[i].classList.remove("active", "list-group-item");
        htmlPeriodItems[i].classList.add("list-group-item-darker");
    }
}

function timeTableAppend(item: scheduleItem) {
    scheduleItems.push(item);
    scheduleItemContainer.append("<li class=\"list-group-item-darker list-group-flush list-time-item\">" +
        "<div class=\"row\"> <div class=\"col-2\"> " + //My apologies for this ugly html, but I assure you it works ;)
        "<p class=\"\">" + item.hour + "</p> </div> " +
        "<div class=\"col-10\"> <p class=\"\">" + item.periodName +
        "</p> </div> </div> </li>")
}

//Refresh list
function refreshScheduleList() {
    scheduleItemContainer.html(" "); //Clear old text
    for (let i = 0; i < scheduleItems.length; ++i) {
        scheduleItemContainer.append("<li class=\"list-group-item-darker list-group-flush list-time-item\">" +
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
        htmlScheduleItems[selectedScheduleItemIndex].classList.add("active", "list-group-item");
        htmlScheduleItems[selectedScheduleItemIndex].classList.remove("list-group-item-darker");
    }
}

function refreshPeriodList() {
    periodItemContainer.html(" "); //Clear old text

    for (let i = 0; i < periodItems.length; ++i) {
        periodItemContainer.append(
            `<li class=\"list-group-item-darker list-group-flush list-period-item\">${periodItems[i].name}</li>`);
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
                htmlPeriodItems[selectedPeriodItemIndex].classList.remove("active", "list-group-item");
                htmlPeriodItems[selectedPeriodItemIndex].classList.add("list-group-item-darker");
            }

            //Allow unselecting of period items only when configurating periods
            if (!scheduleItemSelected && selectedPeriodItemIndex == i) {
                selectedPeriodItemIndex = -1;
                periodConfigurationMenu.hide();
            } else {
                selectedPeriodItemIndex = i;
                htmlPeriodItems[i].classList.add("active", "list-group-item");
                htmlPeriodItems[i].classList.remove("list-group-item-darker");

                //Allow choosing period of a scheduleItem if a scheduleItem is selected
                if (scheduleItemSelected) {
                    //Set the value of the scheduleItem to the period
                    scheduleItems[selectedScheduleItemIndex].periodName = htmlPeriodItems[selectedPeriodItemIndex].innerHTML;

                    //Refresh for text changes to the schedule list to show up
                    refreshScheduleList();

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

    //Select the previously selected task
    if (selectedPeriodItemIndex >= 0) {
        htmlPeriodItems[selectedPeriodItemIndex].classList.add("active", "list-group-item");
        htmlPeriodItems[selectedPeriodItemIndex].classList.remove("list-group-item-darker");
    }
}