"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var invert_color_1 = __importDefault(require("invert-color"));
var RequestTypes_1 = require("./RequestTypes");
var ScheduleItemGeneric = (function () {
    function ScheduleItemGeneric(periodName, hour, color) {
        this.periodName = periodName;
        this.hour = hour;
        this.color = color;
    }
    return ScheduleItemGeneric;
}());
var scheduleItems = [];
var periodItems = [];
var defaultPeriodColor = "464646";
var scheduleItemsIdentifier = "schedule-view-scheduleItems";
var periodItemsIdentifier = "schedule-view-periodItems";
$(function () {
    var fetchFromServerIdentifier = "schedule-view-fetchedFromServer";
    var fetchedFromServer = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, fetchFromServerIdentifier);
    if (!fetchedFromServer) {
        var retrievedScheduleIData = electron_1.ipcRenderer.sendSync(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Get, identifiers: [scheduleItemsIdentifier] });
        var retrievedPeriodData = electron_1.ipcRenderer.sendSync(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Get, identifiers: [periodItemsIdentifier] });
        var scheduleData = void 0;
        var periodData = void 0;
        if (retrievedScheduleIData == undefined || retrievedScheduleIData.data == undefined || (scheduleData = JSON.parse(retrievedScheduleIData.data[0])) == undefined ||
            retrievedPeriodData == undefined || retrievedPeriodData.data == undefined || (periodData = JSON.parse(retrievedPeriodData.data[0])) == undefined) {
            timeTableAppend(new ScheduleItemGeneric("None", "12 PM", defaultPeriodColor));
            scheduleItems.push(new ScheduleItemGeneric("None", "12 PM", defaultPeriodColor));
            for (var i = 1; i <= 12; ++i) {
                var item = new ScheduleItemGeneric("None", i + " AM", defaultPeriodColor);
                timeTableAppend(item);
                scheduleItems.push(item);
            }
            for (var i = 1; i <= 11; ++i) {
                var item = new ScheduleItemGeneric("None", i + " PM", defaultPeriodColor);
                timeTableAppend(item);
                scheduleItems.push(item);
            }
            periodItems.push(new ScheduleItemGeneric("None", null, defaultPeriodColor));
            refreshScheduleList(true);
            refreshPeriodList(true);
        }
        else {
            updateScheduleItems(scheduleData, false);
            updatePeriodItems(periodData, false);
        }
        electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: fetchFromServerIdentifier, data: true });
    }
    else {
        var retrievedScheduleItems = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, scheduleItemsIdentifier);
        updateScheduleItems(retrievedScheduleItems, false);
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
var scheduleItemContainer = $("#view-schedule-scheduleItem-container");
var periodItemContainer = $("#view-schedule-periodItem-container");
var selectedScheduleItemIndex = -1;
var scheduleItemSelected = false;
var selectedPeriodItemIndex = -1;
var periodConfigurationMenu = $("#period-configuration-menu");
periodConfigurationMenu.hide();
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
    for (var i = 0; i < periodItems.length; ++i) {
        if (periodItems[i].periodName == textInput) {
            if (editingPeriod && periodItems[selectedPeriodItemIndex].periodName == textInput)
                continue;
            errorText.html("Period already exists");
            errorText.show();
            return;
        }
    }
    errorText.hide();
    var inputColorElement = $("#new-period-color");
    if (editingPeriod) {
        for (var i = 0; i < scheduleItems.length; ++i) {
            if (scheduleItems[i].periodName == periodItems[selectedPeriodItemIndex].periodName) {
                scheduleItems[i].periodName = textInput;
                scheduleItems[i].color = String(inputColorElement.val()).substring(1);
            }
        }
        periodItems[selectedPeriodItemIndex].periodName = textInput;
        periodItems[selectedPeriodItemIndex].color = String(inputColorElement.val()).substring(1);
        editButton.trigger("click");
        refreshScheduleList(true);
    }
    else {
        periodItems.push(new ScheduleItemGeneric(textInput, null, String(inputColorElement.val()).substring(1)));
    }
    inputElement.val("");
    refreshPeriodList(true);
});
editButton.on("click", function () {
    var inputElement = $("#new-period-text");
    var inputColorElement = $("#new-period-color");
    if (editingPeriod) {
        editingPeriod = false;
        addButton.html("Add period");
        editButton.html("Edit period");
        removeButton.show();
        inputElement.val("");
    }
    else {
        editingPeriod = true;
        addButton.html("Update period");
        editButton.html("Cancel");
        removeButton.hide();
        inputElement.val(periodItems[selectedPeriodItemIndex].periodName);
        inputColorElement.val("#" + periodItems[selectedPeriodItemIndex].color);
    }
});
removeButton.on("click", function () {
    for (var i = 0; i < scheduleItems.length; ++i) {
        if (scheduleItems[i].periodName == periodItems[selectedPeriodItemIndex].periodName) {
            scheduleItems[i].periodName = "None";
            scheduleItems[i].color = defaultPeriodColor;
        }
    }
    for (var i = selectedPeriodItemIndex; i < periodItems.length; ++i) {
        if (i + 1 >= periodItems.length) {
            periodItems.pop();
            break;
        }
        periodItems[i] = periodItems[i + 1];
    }
    if (periodItems.length == 0) {
        selectedPeriodItemIndex = -1;
        editButton.hide();
        removeButton.hide();
    }
    else if (selectedPeriodItemIndex >= periodItems.length) {
        selectedPeriodItemIndex -= 1;
    }
    refreshScheduleList(true);
    refreshPeriodList(true);
});
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
        .append(item.periodName);
    var newScheduleItemRow = $("<div class='row'/>")
        .append(newScheduleItemColumn1)
        .append(newScheduleItemColumn2);
    var newScheduleItem = $("<li class='list-group-item-darker list-group-flush list-time-item'/>");
    newScheduleItem.append(newScheduleItemRow);
    newScheduleItem.css("color", invert_color_1.default(item.color));
    newScheduleItem.css("background-color", "#" + item.color);
    newScheduleItem.appendTo(scheduleItemContainer);
}
function refreshScheduleList(sendServerPost) {
    scheduleItemContainer.html(" ");
    for (var i = 0; i < scheduleItems.length; ++i) {
        timeTableAppend(scheduleItems[i]);
    }
    var htmlScheduleItems = $(".list-time-item");
    var _loop_1 = function (i) {
        htmlScheduleItems[i].addEventListener("click", function () {
            periodConfigurationMenu.hide();
            if (selectedScheduleItemIndex >= 0) {
                htmlScheduleItems[selectedScheduleItemIndex].classList.remove("active-important", "list-group-item");
                htmlScheduleItems[selectedScheduleItemIndex].classList.add("list-group-item-darker");
                htmlScheduleItems[selectedScheduleItemIndex].children[0].classList.remove("white-important");
            }
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
                scheduleItemSelected = true;
                var htmlPeriodItems = $(".list-period-item");
                for (var j = 0; j < htmlPeriodItems.length; ++j) {
                    if (htmlPeriodItems[j].innerHTML == scheduleItems[i].periodName) {
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
    if (selectedScheduleItemIndex >= 0) {
        htmlScheduleItems[selectedScheduleItemIndex].classList.add("active-important", "list-group-item");
        htmlScheduleItems[selectedScheduleItemIndex].classList.remove("list-group-item-darker");
        htmlScheduleItems[selectedScheduleItemIndex].children[0].classList.add("white-important");
    }
    electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: scheduleItemsIdentifier, data: scheduleItems });
    if (sendServerPost)
        electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Post, identifiers: [scheduleItemsIdentifier], data: scheduleItems });
}
function refreshPeriodList(sendServerPost) {
    periodItemContainer.html("");
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
            if (editingPeriod) {
                editingPeriod = false;
                addButton.html("Add period");
                editButton.html("Edit period");
                removeButton.show();
                $("#new-period-text").val("");
            }
            if (selectedPeriodItemIndex >= 0) {
                htmlPeriodItems[selectedPeriodItemIndex].classList.remove("active-important", "list-group-item");
                htmlPeriodItems[selectedPeriodItemIndex].classList.add("list-group-item-darker");
            }
            if (!scheduleItemSelected && selectedPeriodItemIndex == i) {
                selectedPeriodItemIndex = -1;
                periodConfigurationMenu.hide();
            }
            else {
                selectedPeriodItemIndex = i;
                htmlPeriodItems[i].classList.add("active-important", "list-group-item");
                htmlPeriodItems[i].classList.remove("list-group-item-darker");
                if (scheduleItemSelected) {
                    scheduleItems[selectedScheduleItemIndex].periodName = periodItems[selectedPeriodItemIndex].periodName;
                    scheduleItems[selectedScheduleItemIndex].color = periodItems[selectedPeriodItemIndex].color;
                    refreshScheduleList(true);
                    periodConfigurationMenu.hide();
                }
                else {
                    periodConfigurationMenu.show();
                }
                if (selectedPeriodItemIndex == 0) {
                    periodConfigurationMenu.hide();
                }
            }
        });
    };
    for (var i = 0; i < htmlPeriodItems.length; ++i) {
        _loop_2(i);
    }
    if (selectedPeriodItemIndex >= 0) {
        htmlPeriodItems[selectedPeriodItemIndex].classList.add("active-important", "list-group-item");
        htmlPeriodItems[selectedPeriodItemIndex].classList.remove("list-group-item-darker");
    }
    if (selectedPeriodItemIndex == 0) {
        periodConfigurationMenu.hide();
    }
    electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: periodItemsIdentifier, data: periodItems });
    if (sendServerPost)
        electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Post, identifiers: [periodItemsIdentifier], data: periodItems });
}
