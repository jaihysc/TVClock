//Renderer
//Manager for schedule view

import {ipcRenderer} from "electron";
import invert from "invert-color";
import {NetworkOperation, RequestType} from "../RequestTypes";
import {IViewController, ViewManager} from "../viewManager";
import {StringTags, ViewCommon} from "../ViewCommon";
import {DataAction} from "../NetworkManager";
import {DataActionItem, NetworkingFunctions} from "../NetworkingFunctions";
import {DataActionFunctions} from "../DataActionFunctions";
import {Identifiers} from "../Identifiers";

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
    viewIndex = 1;

    //List of all 24 scheduleItems
    scheduleItems: ScheduleItemGeneric[] = [];
    periodItems: ScheduleItemGeneric[] = [];

    defaultPeriodColor = "464646";

    selectedScheduleItemIndex = -1;
    selectedPeriodItemIndex = -1; // -1 indicates nothing is selected, between 0 and 23
    scheduleItemSelected = false;
    editingPeriod = false;

    scheduleItemContainer!: JQuery<HTMLElement>;
    periodItemContainer!: JQuery<HTMLElement>;

    periodConfigurationMenu!: JQuery<HTMLElement>;

    addButton!: JQuery<HTMLElement>;
    editButton!: JQuery<HTMLElement>;
    removeButton!: JQuery<HTMLElement>;
    errorText!: JQuery<HTMLElement>;

    inputText!: JQuery<HTMLElement>;
    inputColor!: JQuery<HTMLElement>;

    initialize(): void {
        ipcRenderer.on(NetworkOperation.Reconnect, () => {
            this.selectedPeriodItemIndex = -1;
            //Refresh the view
            if (ViewManager.currentViewIndex == this.viewIndex)
                $( ".nav-item a" )[this.viewIndex].click();
        });

        //Networking updates
        ipcRenderer.on(Identifiers.scheduleItemsIdentifier + StringTags.NetworkingUpdateEvent, (event: any, dataActionPackets: any[]) => {
            DataActionFunctions.handleDataActionPacket(dataActionPackets, this.scheduleItems);

            if (ViewManager.currentViewIndex == this.viewIndex)
                this.refreshScheduleList();
        });
        ipcRenderer.on(Identifiers.periodItemsIdentifier + StringTags.NetworkingUpdateEvent, (event: any, dataActionPackets: any[]) => {
            DataActionFunctions.handleDataActionPacket(dataActionPackets, this.periodItems);

            // Decrement selectedPeriodItemIndex if deleted item was the last element in array
            if (this.selectedPeriodItemIndex >= this.periodItems.length)
                this.selectedPeriodItemIndex = this.periodItems.length - 1;

            if (ViewManager.currentViewIndex == this.viewIndex)
                this.refreshPeriodList();
        });
    }

    fetchDataFromServer(): void {
        //Fetch schedule and periodItems on startup or refresh
        let retrievedScheduleData: string[]  = ipcRenderer.sendSync(NetworkOperation.Send, {requestType: RequestType.Get, identifiers: [Identifiers.scheduleItemsIdentifier]});
        let retrievedPeriodData: string[]  = ipcRenderer.sendSync(NetworkOperation.Send, {requestType: RequestType.Get, identifiers: [Identifiers.periodItemsIdentifier]});

        // Response should be the first element within the response data array
        let retrievedScheduleItems: ScheduleItemGeneric[] = JSON.parse(retrievedScheduleData[0]);
        let retrievedPeriodItems: ScheduleItemGeneric[] = JSON.parse(retrievedPeriodData[0]);

        // Process received data
        // retrievedScheduleItems should never be null
        this.scheduleItems = [];
        for (let scheduleItem of retrievedScheduleItems)
            this.scheduleItems.push(new ScheduleItemGeneric(scheduleItem.periodName, scheduleItem.hour, scheduleItem.color, scheduleItem.hash));

        if (retrievedPeriodItems != undefined) {
            this.periodItems = [];
            for (let periodItem of retrievedPeriodItems)
                this.periodItems.push(new ScheduleItemGeneric(periodItem.periodName, null, periodItem.color, periodItem.hash));
        }
    }

    preload(): void {
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

    loadEvent(): void {
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
                            Identifiers.scheduleItemsIdentifier,
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
                    Identifiers.periodItemsIdentifier,
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
                    Identifiers.periodItemsIdentifier,
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
                Identifiers.periodItemsIdentifier,
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
                        Identifiers.scheduleItemsIdentifier,
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

            this.refreshScheduleList();
            this.refreshPeriodList();
        });
    }

    //Refresh list
    private refreshScheduleList(): void {
        this.scheduleItemContainer.html(" "); //Clear old text
        for (let i = 0; i < this.scheduleItems.length; ++i) {
            let item = this.scheduleItems[i];
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

        //Setup schedule item click handlers
        let htmlScheduleItems = $(".list-time-item");
        for (let i = 0; i < htmlScheduleItems.length; ++i) {
            htmlScheduleItems[i].addEventListener("click", () => {
                this.selectScheduleItem(i);
            })
        }
        //Select the previously selected task
        if (this.selectedScheduleItemIndex >= 0)
            ViewCommon.selectListItem(htmlScheduleItems, this.selectedScheduleItemIndex);
    }
    private refreshPeriodList(): void {
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
                this.selectPeriodItem(i, true);
            })
        }

        //Select the previously selected period
        if (this.selectedPeriodItemIndex >= 0)
            ViewCommon.selectListItem(htmlPeriodItems, this.selectedPeriodItemIndex);
        //Do not show configuration for default period, "None"
        if (this.selectedPeriodItemIndex == 0)
            this.periodConfigurationMenu.hide();
    }

    // List click methods
    private selectScheduleItem(index: number) {
        this.periodConfigurationMenu.hide();

        let htmlScheduleItems = $(".list-time-item");
        if (this.selectedScheduleItemIndex >= 0)
            ViewCommon.deselectListItem(htmlScheduleItems, this.selectedScheduleItemIndex);

        //If clicking the same item, unselect it
        if (this.selectedScheduleItemIndex == index) {
            this.selectedScheduleItemIndex = -1;
            this.selectedPeriodItemIndex = -1;

            this.scheduleItemSelected = false;

            let htmlPeriodItems = $(".list-period-item");
            for (let i = 0; i < htmlPeriodItems.length; ++i)
                ViewCommon.deselectListItem(htmlPeriodItems, i);

        } else {
            this.selectedScheduleItemIndex = index;
            ViewCommon.selectListItem(htmlScheduleItems, index);
            //Select scheduleItem item associated with the schedule
            this.scheduleItemSelected = true;
            let htmlPeriodItems = $(".list-period-item");

            //Select the period item matching the schedule item
            for (let j = 0; j < htmlPeriodItems.length; ++j) {
                //Find the desired period based on provided periodName
                if (htmlPeriodItems[j].innerHTML == this.scheduleItems[index].periodName) {
                    //If it is found, select it if it is not already selected
                    if (j == this.selectedPeriodItemIndex)
                        return;

                    this.selectPeriodItem(j, false);
                }
            }
        }
    }
    private selectPeriodItem(index: number, sendNetworkingEdit: boolean) {
        this.exitEditMode(); //Stop editing after clicking on another item

        // Deselect previous PeriodItem
        let htmlPeriodItems = $(".list-period-item");
        if (this.selectedPeriodItemIndex >= 0)
            ViewCommon.deselectListItem(htmlPeriodItems, this.selectedPeriodItemIndex);

        // Allow unselecting of period items only when configuring periods
        if (!this.scheduleItemSelected && this.selectedPeriodItemIndex == index) {
            this.selectedPeriodItemIndex = -1;
            this.periodConfigurationMenu.hide();
        } else {
            this.selectedPeriodItemIndex = index;
            ViewCommon.selectListItem(htmlPeriodItems, this.selectedPeriodItemIndex);

            //Allow choosing period of a scheduleItem if a scheduleItem is selected
            if (this.scheduleItemSelected) {
                //Set the value of the scheduleItem to the period
                this.scheduleItems[this.selectedScheduleItemIndex].periodName = this.periodItems[this.selectedPeriodItemIndex].periodName;
                this.scheduleItems[this.selectedScheduleItemIndex].color = this.periodItems[this.selectedPeriodItemIndex].color;

                // Send edits to the period of a scheduleItem
                if (sendNetworkingEdit)
                    NetworkingFunctions.sendDataActionPacket(
                        DataAction.Edit,
                        Identifiers.scheduleItemsIdentifier,
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
    }


    private exitEditMode(): void {
        if (!this.editingPeriod)
            return;
        this.editingPeriod = false;
        this.addButton.html("Add period");
        this.editButton.html("Edit period");
        this.removeButton.show();

        this.inputText .val("");
    }
    private enterEditMode(): void {
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