//Renderer
//Manager for schedule view

import { ipcRenderer } from "electron";
import invert from "invert-color";
import {RequestType, NetworkOperation, LocalStorageOperation} from "../RequestTypes";
import {IViewController} from "../viewManager";
import {StringTags, ViewCommon} from "../ViewCommon";
import {DataAction, DataActionPacket} from "../NetworkManager";
import {DataActionItem, NetworkingFunctions} from "../NetworkingFunctions";
import {DataActionFunctions} from "../DataActionFunctions";

class ScheduleItemGeneric implements DataActionItem {
    hash: string;
    periodName: string;

    hour: string | null; // E.G 1 AM
    color: string; //6 character hex string, omitting #

    constructor(periodName: string, hour: string | null, color: string, hash: string) {
        this.periodName = periodName;
        this.hour = hour;
        this.color = color;
        this.hash = hash;
    }
}

export class ScheduleViewManager implements IViewController {
    //List of all 24 scheduleItems
    scheduleItems: ScheduleItemGeneric[] = [];
    periodItems: ScheduleItemGeneric[] = [];

    defaultPeriodColor = "464646";

    scheduleItemsIdentifier = "schedule-view-scheduleItems";
    periodItemsIdentifier = "schedule-view-periodItems";

    scheduleItemContainer!: JQuery<HTMLElement>;
    periodItemContainer!: JQuery<HTMLElement>;

    selectedScheduleItemIndex = -1;
    selectedPeriodItemIndex = -1; // -1 indicates nothing is selected, between 0 and 23
    scheduleItemSelected = false;

    editingPeriod = false;

    periodConfigurationMenu!: JQuery<HTMLElement>;

    addButton!: JQuery<HTMLElement>;
    editButton!: JQuery<HTMLElement>;
    removeButton!: JQuery<HTMLElement>;
    errorText!: JQuery<HTMLElement>;

    inputText!: JQuery<HTMLElement>;
    inputColor!: JQuery<HTMLElement>;

    initialize(): void {
        this.scheduleItemContainer = $("#view-schedule-scheduleItem-container");
        this.periodItemContainer = $("#view-schedule-periodItem-container");
        this.periodConfigurationMenu = $("#period-configuration-menu");

        this.addButton = $("#schedule-period-add");
        this.editButton = $("#schedule-period-edit");
        this.removeButton = $("#schedule-period-remove");

        this.errorText = $("#new-period-text-error");

        this.inputText = $("#new-period-text");
        this.inputColor = $("#new-period-color")
    }

    preload(): void {
        //Networking updates
        ipcRenderer.on(this.scheduleItemsIdentifier + StringTags.NetworkingUpdateEvent, (event: any, dataActionPackets: DataActionPacket[]) => {
            DataActionFunctions.handleDataActionPacket(dataActionPackets, this.scheduleItems);
            this.refreshScheduleList();
        });
        ipcRenderer.on(this.periodItemsIdentifier + StringTags.NetworkingUpdateEvent, (event: any, dataActionPackets: DataActionPacket[]) => {
            DataActionFunctions.handleDataActionPacket(dataActionPackets, this.periodItems);

            // Decrement selectedPeriodItemIndex if deleted item was the last element in array
            if (this.selectedPeriodItemIndex >= this.periodItems.length)
                this.selectedPeriodItemIndex--;

            this.refreshPeriodList();
        });

        this.addButton.on("click", () => {
            let textInput = String(this.inputText .val());
            if (textInput == "") {
                this.errorText.html("Enter a period name");
                this.errorText.show();
                return;
            }

            //Check for duplicate names
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
            if (this.editingPeriod) {
                // Edit mode
                //Rename all scheduleItems with the name to the new name, change color to new color
                for (let scheduleItem of this.scheduleItems) {
                    if (scheduleItem.periodName == this.periodItems[this.selectedPeriodItemIndex].periodName) {
                        scheduleItem.periodName = textInput;
                        scheduleItem.color = String(this.inputColor.val()).substring(1); //Substring away hex # at beginning

                        // Synchronise with server
                        NetworkingFunctions.sendDataActionPacket(
                            DataAction.Edit,
                            this.scheduleItemsIdentifier,
                            scheduleItem.hash,
                            scheduleItem
                        );
                    }
                }

                // Rename PeriodItem
                this.periodItems[this.selectedPeriodItemIndex].periodName = textInput;
                this.periodItems[this.selectedPeriodItemIndex].color = String(this.inputColor.val()).substring(1);

                NetworkingFunctions.sendDataActionPacket(
                    DataAction.Edit,
                    this.periodItemsIdentifier,
                    this.periodItems[this.selectedPeriodItemIndex].hash,
                    this.periodItems[this.selectedPeriodItemIndex]
                );

                this.editButton.trigger("click");
                this.refreshScheduleList();
            } else {
                // Add mode

                let hash = NetworkingFunctions.createHash(new Date().getTime() + textInput);  // Create a new hash
                let newPeriodItem = new ScheduleItemGeneric(textInput, null, String(this.inputColor.val()).substring(1), hash);  // Cut off the # at the start of the color string
                NetworkingFunctions.sendDataActionPacket(
                    DataAction.Add,
                    this.periodItemsIdentifier,
                    hash,
                    newPeriodItem
                );

                this.periodItems.push(newPeriodItem);
            }

            this.inputText.val("");
            this.refreshPeriodList();
        });

        this.editButton.on("click", () => {
            if (this.editingPeriod)
                this.exitEditMode();
            else
                this.enterEditMode();
        });

        this.removeButton.on("click", () => {
            NetworkingFunctions.sendDataActionPacket(
                DataAction.Remove,
                this.periodItemsIdentifier,
                this.periodItems[this.selectedPeriodItemIndex].hash,
                this.periodItems[this.selectedPeriodItemIndex]
            );

            //Set scheduleItems that were using this period back to None, set color to default
            for (let scheduleItem of this.scheduleItems) {
                if (scheduleItem.periodName == this.periodItems[this.selectedPeriodItemIndex].periodName) {
                    scheduleItem.periodName = "None";
                    scheduleItem.color = this.defaultPeriodColor;

                    // Synchronize with server
                    NetworkingFunctions.sendDataActionPacket(
                        DataAction.Edit,
                        this.scheduleItemsIdentifier,
                        scheduleItem.hash,
                        scheduleItem
                    );
                }
            }
            ViewCommon.removeArrayItemAtIndex(this.periodItems, this.selectedPeriodItemIndex);

            //If there are no more tasks in the list, do not select anything
            if (this.periodItems.length == 0) {
                this.selectedPeriodItemIndex = -1;
                this.editButton.hide();
                this.removeButton.hide();
            } else if (this.selectedPeriodItemIndex >= this.periodItems.length) { //If user selected last task
                this.selectedPeriodItemIndex -= 1;
            }

            this.refreshScheduleList();
            this.refreshPeriodList();
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
                // Todo, make these 2 network requests run async
                //Fetch schedule and periodItems on startup or refresh
                let retrievedScheduleIData = ipcRenderer.sendSync(
                    NetworkOperation.Send,
                    {requestType: RequestType.Get, identifiers: [this.scheduleItemsIdentifier]});
                let retrievedPeriodData = ipcRenderer.sendSync(
                    NetworkOperation.Send,
                    {requestType: RequestType.Get, identifiers: [this.periodItemsIdentifier]});

                let scheduleData: ScheduleItemGeneric[] | undefined = undefined;
                if (retrievedScheduleIData != undefined)
                    scheduleData = JSON.parse(retrievedScheduleIData.data)[0];

                let periodData: ScheduleItemGeneric[] | undefined = undefined;
                if (retrievedPeriodData.data != undefined)
                    periodData = JSON.parse(retrievedPeriodData.data)[0];

                // Generate default schedule list if connection to server failed
                if (scheduleData == undefined || periodData == undefined) {
                    //Clear any old items in the 2 lists on reconnect
                    this.clearAllData();

                    // 12PM - or 0 in 24 hour
                    // Hash is 0 - 24, same as the array index of the schedule item, they DO NOT need to be generated,
                    // since these 24 items are constant
                    this.timeTableAppend(new ScheduleItemGeneric("None", "12 PM", this.defaultPeriodColor, "0"));
                    this.scheduleItems.push(new ScheduleItemGeneric("None", "12 PM", this.defaultPeriodColor, "0"));

                    // AM
                    for (let i = 1; i <= 12; ++i) {
                        let item = new ScheduleItemGeneric("None", i + " AM", this.defaultPeriodColor, i.toString());
                        this.timeTableAppend(item); //None is default period name
                        this.scheduleItems.push(item);
                    }
                    // PM
                    for (let i = 1; i <= 11; ++i) {
                        let item = new ScheduleItemGeneric("None", i + " PM", this.defaultPeriodColor, (12 + i).toString());
                        this.timeTableAppend(item);
                        this.scheduleItems.push(item);
                    }

                    // Use "None" as default period item,
                    // this does not have a hash since it cannot be modified
                    this.periodItems.push(new ScheduleItemGeneric("None", null, this.defaultPeriodColor, ""));

                    this.refreshScheduleList();
                    this.refreshPeriodList();
                } else {
                    // Schedule list already exists on server
                    this.updateScheduleItems(scheduleData);
                    this.updatePeriodItems(periodData);
                }

                //Save that it has fetched from server
                ipcRenderer.send(LocalStorageOperation.Save, {identifier: fetchFromServerIdentifier, data: true});
            } else {
                // Fetched from server already,
                // Retrieve from localstorage
                let retrievedScheduleItems = ipcRenderer.sendSync(LocalStorageOperation.Fetch, this.scheduleItemsIdentifier);
                this.updateScheduleItems(retrievedScheduleItems);

                let retrievedPeriodItems = ipcRenderer.sendSync(LocalStorageOperation.Fetch, this.periodItemsIdentifier);
                this.updatePeriodItems(retrievedPeriodItems);
            }
        });
    }

    private clearAllData() {
        this.scheduleItemContainer.html("");
        this.periodItemContainer.html("");
        this.scheduleItems = [];
        this.periodItems = [];
    }

    private updateScheduleItems(data: ScheduleItemGeneric[]) {
        this.scheduleItems = [];
        for (let i = 0; i < data.length; ++i)
            this.scheduleItems.push(new ScheduleItemGeneric(data[i].periodName, data[i].hour, data[i].color, data[i].hash));

        this.refreshScheduleList();
    }
    private updatePeriodItems(data: ScheduleItemGeneric[]) {
        this.periodItems = [];
        for (let i = 0; i < data.length; ++i)
            this.periodItems.push(new ScheduleItemGeneric(data[i].periodName, null, data[i].color, data[i].hash));

        this.refreshPeriodList()
    }

    private deselectAllPeriods() {
        this.selectedPeriodItemIndex = -1;

        let htmlPeriodItems = $(".list-period-item");
        for (let i = 0; i < htmlPeriodItems.length; ++i)
            ViewCommon.deselectListItem(htmlPeriodItems, i);
    }

    private timeTableAppend(item: ScheduleItemGeneric) {
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
    private refreshScheduleList() {
        this.scheduleItemContainer.html(" "); //Clear old text
        for (let i = 0; i < this.scheduleItems.length; ++i)
            this.timeTableAppend(this.scheduleItems[i]);

        //Setup schedule item click handlers
        let htmlScheduleItems = $(".list-time-item");
        for (let i = 0; i < htmlScheduleItems.length; ++i) {
            htmlScheduleItems[i].addEventListener("click", () => {
                this.periodConfigurationMenu.hide();

                if (this.selectedScheduleItemIndex >= 0)
                    ViewCommon.deselectListItem(htmlScheduleItems, this.selectedScheduleItemIndex);

                //If clicking the same item, unselect it
                if (this.selectedScheduleItemIndex == i) {
                    this.selectedScheduleItemIndex = -1;
                    this.scheduleItemSelected = false;

                    this.deselectAllPeriods();
                } else {
                    this.selectedScheduleItemIndex = i;
                    ViewCommon.selectListItem(htmlScheduleItems, i);
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
        if (this.selectedScheduleItemIndex >= 0)
            ViewCommon.selectListItem(htmlScheduleItems, this.selectedScheduleItemIndex);

        //Save scheduleItems
        ipcRenderer.send(LocalStorageOperation.Save, {identifier: this.scheduleItemsIdentifier, data: this.scheduleItems});
    }

    private refreshPeriodList() {
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
                this.exitEditMode(); //Stop editing after clicking on another item

                //Set clicked button as active
                if (this.selectedPeriodItemIndex >= 0)
                    ViewCommon.deselectListItem(htmlPeriodItems, this.selectedPeriodItemIndex);

                // Allow unselecting of period items only when configuring periods
                if (!this.scheduleItemSelected && this.selectedPeriodItemIndex == i) {
                    this.selectedPeriodItemIndex = -1;
                    this.periodConfigurationMenu.hide();
                } else {
                    this.selectedPeriodItemIndex = i;
                    ViewCommon.selectListItem(htmlPeriodItems, this.selectedPeriodItemIndex);

                    //Allow choosing period of a scheduleItem if a scheduleItem is selected
                    if (this.scheduleItemSelected) {
                        //Set the value of the scheduleItem to the period
                        this.scheduleItems[this.selectedScheduleItemIndex].periodName = this.periodItems[this.selectedPeriodItemIndex].periodName;
                        this.scheduleItems[this.selectedScheduleItemIndex].color = this.periodItems[this.selectedPeriodItemIndex].color;

                        // Send edits to the period of a scheduleItem
                        NetworkingFunctions.sendDataActionPacket(
                            DataAction.Edit,
                            this.scheduleItemsIdentifier,
                            this.scheduleItems[this.selectedScheduleItemIndex].hash,
                            this.scheduleItems[this.selectedScheduleItemIndex]
                        );

                        //Refresh for text changes to the schedule list to show up
                        this.periodConfigurationMenu.hide();
                        this.refreshScheduleList();
                    } else { //Otherwise show the configuration menu for periods
                        this.periodConfigurationMenu.show();
                    }

                    //Do not show configuration menu for default period
                    if (this.selectedPeriodItemIndex == 0)
                        this.periodConfigurationMenu.hide();
                }
            })
        }

        //Select the previously selected period
        if (this.selectedPeriodItemIndex >= 0)
            ViewCommon.selectListItem(htmlPeriodItems, this.selectedPeriodItemIndex);
        //Do not show default period configuration, "None"
        if (this.selectedPeriodItemIndex == 0)
            this.periodConfigurationMenu.hide();

        //Save periodItems
        ipcRenderer.send(LocalStorageOperation.Save, {identifier: this.periodItemsIdentifier, data: this.periodItems});
    }

    private exitEditMode() {
        if (!this.editingPeriod)
            return;
        this.editingPeriod = false;
        this.addButton.html("Add period");
        this.editButton.html("Edit period");
        this.removeButton.show();

        this.inputText .val("");
    }
    private enterEditMode() {
        if (this.editingPeriod)
            return;
        //Rename add task button to update task
        this.editingPeriod = true;
        this.addButton.html("Update period");
        this.editButton.html("Cancel");
        this.removeButton.hide();

        //Load data from the selected task item into fields
        this.inputText.val(this.periodItems[this.selectedPeriodItemIndex].periodName);
        this.inputColor.val("#" + this.periodItems[this.selectedPeriodItemIndex].color);
    }
}