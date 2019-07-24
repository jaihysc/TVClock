//Renderer
//Manager for schedule view

import { ipcRenderer } from "electron";
import invert from "invert-color";
import {RequestType, NetworkOperation, LocalStorageOperation} from "./RequestTypes";
import {IViewController} from "./viewManager";

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

export class ScheduleViewManager implements IViewController {
    //List of all 24 scheduleItems
    scheduleItems: ScheduleItemGeneric[] = [];
    periodItems: ScheduleItemGeneric[] = [];

    defaultPeriodColor = "464646";

    scheduleItemsIdentifier = "schedule-view-scheduleItems";
    periodItemsIdentifier = "schedule-view-periodItems";

    //Containers for scheduleItems and periodItems
    scheduleItemContainer = $(`#view-schedule-scheduleItem-container`);
    periodItemContainer = $(`#view-schedule-periodItem-container`);

    //Schedule clickable functionality
    selectedScheduleItemIndex = -1;

    //Whether or not the user has selected a scheduleItem
    scheduleItemSelected = false;

    selectedPeriodItemIndex = -1; //-1 indicates nothing is selected

    periodConfigurationMenu = $(`#period-configuration-menu`);

    //add, edit and remove buttons
    addButton = $(`#schedule-period-add`);
    editButton = $(`#schedule-period-edit`);
    removeButton = $(`#schedule-period-remove`);

    editingPeriod = false;
    errorText = $(`#new-period-text-error`);

    initialize(): void {
        this.scheduleItemContainer = $("#view-schedule-scheduleItem-container");
        this.periodItemContainer = $("#view-schedule-periodItem-container");
        this.periodConfigurationMenu = $("#period-configuration-menu");

        //add, edit and remove buttons
        this.addButton = $("#schedule-period-add");
        this.editButton = $("#schedule-period-edit");
        this.removeButton = $("#schedule-period-remove");

        this.errorText = $("#new-period-text-error");
    }

    preload(): void {
        this.addButton.on("click", () => {
            let inputElement = $("#new-period-text");
            let textInput = String(inputElement.val());
            if (textInput == "") {
                this.errorText.html("Enter a period name");
                this.errorText.show();
                return;
            }

            //Check for duplicates
            for (let i = 0; i < this.periodItems.length; ++i) {
                if (this.periodItems[i].periodName == textInput) {
                    if (this.editingPeriod && this.periodItems[this.selectedPeriodItemIndex].periodName == textInput) //Do not count itself as duplicate when editing
                        continue;

                    this.errorText.html("Period already exists");
                    this.errorText.show();
                    return;
                }
            }

            this.errorText.hide();

            let inputColorElement = $("#new-period-color");

            if (this.editingPeriod) {
                //Rename all scheduleItems with the name to the new name, change color to new color
                for (let i = 0; i < this.scheduleItems.length; ++i) {
                    if (this.scheduleItems[i].periodName == this.periodItems[this.selectedPeriodItemIndex].periodName) {
                        this.scheduleItems[i].periodName = textInput;
                        this.scheduleItems[i].color = String(inputColorElement.val()).substring(1); //Substring away hex # at beginning
                    }
                }

                this.periodItems[this.selectedPeriodItemIndex].periodName = textInput;
                this.periodItems[this.selectedPeriodItemIndex].color = String(inputColorElement.val()).substring(1);

                this.editButton.trigger("click");
                this.refreshScheduleList(true);
            } else {
                this.periodItems.push(new ScheduleItemGeneric(textInput, null, String(inputColorElement.val()).substring(1))); //Cut off the # at the start of the color string
            }

            inputElement.val("");

            this.refreshPeriodList(true);
        });

        this.editButton.on("click", () => {
            let inputElement = $("#new-period-text");
            let inputColorElement = $("#new-period-color");
            //Exit updating if edit button is repressed
            if (this.editingPeriod) {
                this.editingPeriod = false;
                this.addButton.html("Add period");
                this.editButton.html("Edit period");
                this.removeButton.show();

                inputElement.val("");
            } else {
                //Rename add task button to update task
                this.editingPeriod = true;
                this.addButton.html("Update period");
                this.editButton.html("Cancel");
                this.removeButton.hide();

                //Load data from the selected task item into fields
                inputElement.val(this.periodItems[this.selectedPeriodItemIndex].periodName);
                inputColorElement.val("#" + this.periodItems[this.selectedPeriodItemIndex].color);
            }
        });

        this.removeButton.on("click", () => {
            //Set this.scheduleItems that were using this period back to None, set color to default
            for (let i = 0; i < this.scheduleItems.length; ++i) {
                if (this.scheduleItems[i].periodName == this.periodItems[this.selectedPeriodItemIndex].periodName) {
                    this.scheduleItems[i].periodName = "None";
                    this.scheduleItems[i].color = this.defaultPeriodColor;
                }
            }

            //Remove task by overwriting it with the tasks after it (n+1)
            for (let i = this.selectedPeriodItemIndex; i < this.periodItems.length; ++i) {
                //If at end of array, pop last one away since there is none after it
                if (i + 1 >= this.periodItems.length) {
                    this.periodItems.pop();
                    break;
                }

                this.periodItems[i] = this.periodItems[i+1];
            }

            //If there are no more tasks in the list, do not select anything
            if (this.periodItems.length == 0) {
                this.selectedPeriodItemIndex = -1;
                this.editButton.hide();
                this.removeButton.hide();
            } else if (this.selectedPeriodItemIndex >= this.periodItems.length) { //If user selected last task
                this.selectedPeriodItemIndex -= 1;
            }

            this.refreshScheduleList(true);
            this.refreshPeriodList(true);
        });
    }

    load(): void {
        $(() => {
            this.errorText.hide();
            this.periodConfigurationMenu.hide();

            const fetchFromServerIdentifier = "schedule-view-fetchedFromServer";

            ipcRenderer.on(NetworkOperation.Reconnect, () => {
                //Clear all stored data
                ipcRenderer.sendSync(LocalStorageOperation.Save, {identifier: fetchFromServerIdentifier, data: undefined});

                //Refresh the view
                $( ".nav-item a" )[1].click();
            });

            let fetchedFromServer: boolean = ipcRenderer.sendSync(LocalStorageOperation.Fetch, fetchFromServerIdentifier);
            if (!fetchedFromServer) {
                let retrievedScheduleIData = ipcRenderer.sendSync(NetworkOperation.Send,
                    {requestType: RequestType.Get, identifiers: [this.scheduleItemsIdentifier]});

                let retrievedPeriodData = ipcRenderer.sendSync(NetworkOperation.Send,
                    {requestType: RequestType.Get, identifiers: [this.periodItemsIdentifier]});

                let scheduleData: any;
                let periodData: any;

                //Generate default schedule list if not defined by the server
                if (retrievedScheduleIData == undefined || retrievedScheduleIData.data == undefined || (scheduleData = JSON.parse(retrievedScheduleIData.data[0])) == undefined ||
                    retrievedPeriodData == undefined || retrievedPeriodData.data == undefined || (periodData = JSON.parse(retrievedPeriodData.data[0])) == undefined ) {
                    //12PM - or 0 in 24 hour
                    this.timeTableAppend(new ScheduleItemGeneric("None", "12 PM", this.defaultPeriodColor));
                    this.scheduleItems.push(new ScheduleItemGeneric("None", "12 PM", this.defaultPeriodColor));

                    //AM
                    for (let i = 1; i <= 12; ++i) {
                        let item = new ScheduleItemGeneric("None", i + " AM", this.defaultPeriodColor);
                        this.timeTableAppend(item); //None is default period name
                        this.scheduleItems.push(item);
                    }
                    //PM
                    for (let i = 1; i <= 11; ++i) {
                        let item = new ScheduleItemGeneric("None", i + " PM", this.defaultPeriodColor);
                        this.timeTableAppend(item);
                        this.scheduleItems.push(item);
                    }

                    //Push a single default period item
                    this.periodItems.push(new ScheduleItemGeneric("None", null, this.defaultPeriodColor));

                    this.refreshScheduleList(true);
                    this.refreshPeriodList(true);
                } else {
                    //Schedule list already exists on server
                    this.updateScheduleItems(scheduleData, false);
                    this.updatePeriodItems(periodData, false);
                }

                //Save that it has fetched from server
                ipcRenderer.send(LocalStorageOperation.Save, {identifier: fetchFromServerIdentifier, data: true});
            } else {
                //Retrieved from localstorage
                //Retrieve ScheduleItems
                let retrievedScheduleItems = ipcRenderer.sendSync(LocalStorageOperation.Fetch, this.scheduleItemsIdentifier);
                this.updateScheduleItems(retrievedScheduleItems, false);

                //Retrieve this.periodItems
                let retrievedPeriodItems = ipcRenderer.sendSync(LocalStorageOperation.Fetch, this.periodItemsIdentifier);

                this.updatePeriodItems(retrievedPeriodItems, false);
            }

            ipcRenderer.on(this.scheduleItemsIdentifier + "-update", (event: any, data: string) => {
                this.updateScheduleItems(JSON.parse(data), false);
            });
            ipcRenderer.on(this.periodItemsIdentifier + "-update", (event: any, data: string) => {
                this.updatePeriodItems(JSON.parse(data), false);
            });
        });
    }

    updateScheduleItems(data: any[], sendServerPost: boolean) {
        this.scheduleItems = [];
        if (data == undefined)
            return;

        for (let i = 0; i < data.length; ++i) {
            this.scheduleItems.push(new ScheduleItemGeneric(data[i].periodName, data[i].hour, data[i].color))
        }

        this.refreshScheduleList(sendServerPost);
    }
    updatePeriodItems(data: ScheduleItemGeneric[], sendServerPost: boolean) {
        //Clear existing values
        this.periodItems = [];

        for (let i = 0; i < data.length; ++i) {
            this.periodItems.push(new ScheduleItemGeneric(data[i].periodName, null, data[i].color))
        }

        this.refreshPeriodList(sendServerPost)
    }

    deselectAllPeriods() {
        this.selectedPeriodItemIndex = -1;

        let htmlPeriodItems = $(".list-period-item");
        for (let i = 0; i < htmlPeriodItems.length; ++i) {
            htmlPeriodItems[i].classList.remove("active-important", "list-group-item");
            htmlPeriodItems[i].classList.add("list-group-item-darker");
        }
    }

    timeTableAppend(item: ScheduleItemGeneric) {
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
        newScheduleItem.appendTo(this.scheduleItemContainer);
    }

    //Refresh list
    refreshScheduleList(sendServerPost: boolean) {
        this.scheduleItemContainer.html(" "); //Clear old text
        for (let i = 0; i < this.scheduleItems.length; ++i) {
            this.timeTableAppend(this.scheduleItems[i]);
        }

        //Setup schedule item click handlers
        let htmlScheduleItems = $(".list-time-item");
        for (let i = 0; i < htmlScheduleItems.length; ++i) {
            htmlScheduleItems[i].addEventListener("click", () => {
                //Hide period config menu
                this.periodConfigurationMenu.hide();

                //Set clicked button as active
                //The class list-group-item is added as active only shows up with list-group-item
                //Removing the custom class list-group-item-darker
                if (this.selectedScheduleItemIndex >= 0) {
                    htmlScheduleItems[this.selectedScheduleItemIndex].classList.remove("active-important", "list-group-item");
                    htmlScheduleItems[this.selectedScheduleItemIndex].classList.add("list-group-item-darker");
                    htmlScheduleItems[this.selectedScheduleItemIndex].children[0].classList.remove("white-important");
                }

                //If clicking the same item, unselect it
                if (this.selectedScheduleItemIndex == i) {
                    this.selectedScheduleItemIndex = -1;

                    this.scheduleItemSelected = false;

                    this.deselectAllPeriods();
                } else {
                    this.selectedScheduleItemIndex = i;

                    htmlScheduleItems[i].classList.add("active-important", "list-group-item");
                    htmlScheduleItems[i].classList.remove("list-group-item-darker");
                    htmlScheduleItems[i].children[0].classList.add("white-important");

                    //Select scheduleItem item associated with the schedule
                    this.scheduleItemSelected = true;

                    let htmlPeriodItems = $(".list-period-item");

                    //Select the period item matching the schedule item
                    for (let j = 0; j < htmlPeriodItems.length; ++j) {
                        //Find the desired period based on provided periodName
                        if (htmlPeriodItems[j].innerHTML == this.scheduleItems[i].periodName) {
                            //If it is found, select it if it is not already selected
                            if (j == this.selectedPeriodItemIndex)
                                return;

                            htmlPeriodItems[j].click();
                        }
                    }
                }
            })
        }

        //Select the previously selected task
        if (this.selectedScheduleItemIndex >= 0) {
            htmlScheduleItems[this.selectedScheduleItemIndex].classList.add("active-important", "list-group-item");
            htmlScheduleItems[this.selectedScheduleItemIndex].classList.remove("list-group-item-darker");
            htmlScheduleItems[this.selectedScheduleItemIndex].children[0].classList.add("white-important");
        }

        //Save scheduleItems
        ipcRenderer.send(LocalStorageOperation.Save, {identifier: this.scheduleItemsIdentifier, data: this.scheduleItems});
        //send POST to server
        if (sendServerPost)
            ipcRenderer.send(NetworkOperation.Send, {requestType: RequestType.Post, identifiers: [this.scheduleItemsIdentifier], data: this.scheduleItems});
    }

    refreshPeriodList(sendServerPost: boolean) {
        this.periodItemContainer.html(""); //Clear old text

        for (let i = 0; i < this.periodItems.length; ++i) {
            $("<li class='list-group-item-darker list-group-flush list-period-item'/>")
                .css("background-color", "#" + this.periodItems[i].color)
                .css("color", invert(this.periodItems[i].color))
                .text(this.periodItems[i].periodName)
                .appendTo(this.periodItemContainer);
        }

        let htmlPeriodItems = $(".list-period-item");

        //Period clickable functionality
        for (let i = 0; i < htmlPeriodItems.length; ++i) {
            htmlPeriodItems[i].addEventListener("click", () => {
                //Cancel editing
                if (this.editingPeriod) {
                    this.editingPeriod = false;
                    this.addButton.html("Add period");
                    this.editButton.html("Edit period");
                    this.removeButton.show();

                    $("#new-period-text").val("");
                }

                //Set clicked button as active
                //The class list-group-item is added as active only shows up with list-group-item
                //Removing the custom class list-group-item-darker
                if (this.selectedPeriodItemIndex >= 0) {
                    htmlPeriodItems[this.selectedPeriodItemIndex].classList.remove("active-important", "list-group-item");
                    htmlPeriodItems[this.selectedPeriodItemIndex].classList.add("list-group-item-darker");
                }

                //Allow unselecting of period items only when configurating periods
                if (!this.scheduleItemSelected && this.selectedPeriodItemIndex == i) {
                    this.selectedPeriodItemIndex = -1;
                    this.periodConfigurationMenu.hide();
                } else {
                    this.selectedPeriodItemIndex = i;
                    htmlPeriodItems[i].classList.add("active-important", "list-group-item");
                    htmlPeriodItems[i].classList.remove("list-group-item-darker");

                    //Allow choosing period of a scheduleItem if a scheduleItem is selected
                    if (this.scheduleItemSelected) {
                        //Set the value of the scheduleItem to the period
                        this.scheduleItems[this.selectedScheduleItemIndex].periodName = this.periodItems[this.selectedPeriodItemIndex].periodName;
                        this.scheduleItems[this.selectedScheduleItemIndex].color = this.periodItems[this.selectedPeriodItemIndex].color;

                        //Refresh for text changes to the schedule list to show up
                        this.refreshScheduleList(true);

                        this.periodConfigurationMenu.hide();
                    } else { //Otherwise show the configuration menu for periods
                        this.periodConfigurationMenu.show();
                    }

                    //Do not show default period configuration menu
                    if (this.selectedPeriodItemIndex == 0) {
                        this.periodConfigurationMenu.hide();
                    }
                }
            })
        }

        //Select the previously selected period
        if (this.selectedPeriodItemIndex >= 0) {
            htmlPeriodItems[this.selectedPeriodItemIndex].classList.add("active-important", "list-group-item");
            htmlPeriodItems[this.selectedPeriodItemIndex].classList.remove("list-group-item-darker");
        }
        //Do not show default period configuration menu on refresh
        if (this.selectedPeriodItemIndex == 0) {
            this.periodConfigurationMenu.hide();
        }

        //Save periodItems
        ipcRenderer.send(LocalStorageOperation.Save, {identifier: this.periodItemsIdentifier, data: this.periodItems});

        if (sendServerPost)
            ipcRenderer.send(NetworkOperation.Send, {requestType: RequestType.Post, identifiers: [this.periodItemsIdentifier], data: this.periodItems});

    }
}
