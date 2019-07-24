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
var ScheduleViewManager = (function () {
    function ScheduleViewManager() {
        this.scheduleItems = [];
        this.periodItems = [];
        this.defaultPeriodColor = "464646";
        this.scheduleItemsIdentifier = "schedule-view-scheduleItems";
        this.periodItemsIdentifier = "schedule-view-periodItems";
        this.scheduleItemContainer = $("#view-schedule-scheduleItem-container");
        this.periodItemContainer = $("#view-schedule-periodItem-container");
        this.selectedScheduleItemIndex = -1;
        this.scheduleItemSelected = false;
        this.selectedPeriodItemIndex = -1;
        this.periodConfigurationMenu = $("#period-configuration-menu");
        this.addButton = $("#schedule-period-add");
        this.editButton = $("#schedule-period-edit");
        this.removeButton = $("#schedule-period-remove");
        this.editingPeriod = false;
        this.errorText = $("#new-period-text-error");
    }
    ScheduleViewManager.prototype.initialize = function () {
        this.scheduleItemContainer = $("#view-schedule-scheduleItem-container");
        this.periodItemContainer = $("#view-schedule-periodItem-container");
        this.periodConfigurationMenu = $("#period-configuration-menu");
        this.addButton = $("#schedule-period-add");
        this.editButton = $("#schedule-period-edit");
        this.removeButton = $("#schedule-period-remove");
        this.errorText = $("#new-period-text-error");
    };
    ScheduleViewManager.prototype.preload = function () {
        var _this = this;
        this.addButton.on("click", function () {
            var inputElement = $("#new-period-text");
            var textInput = String(inputElement.val());
            if (textInput == "") {
                _this.errorText.html("Enter a period name");
                _this.errorText.show();
                return;
            }
            for (var i = 0; i < _this.periodItems.length; ++i) {
                if (_this.periodItems[i].periodName == textInput) {
                    if (_this.editingPeriod && _this.periodItems[_this.selectedPeriodItemIndex].periodName == textInput)
                        continue;
                    _this.errorText.html("Period already exists");
                    _this.errorText.show();
                    return;
                }
            }
            _this.errorText.hide();
            var inputColorElement = $("#new-period-color");
            if (_this.editingPeriod) {
                for (var i = 0; i < _this.scheduleItems.length; ++i) {
                    if (_this.scheduleItems[i].periodName == _this.periodItems[_this.selectedPeriodItemIndex].periodName) {
                        _this.scheduleItems[i].periodName = textInput;
                        _this.scheduleItems[i].color = String(inputColorElement.val()).substring(1);
                    }
                }
                _this.periodItems[_this.selectedPeriodItemIndex].periodName = textInput;
                _this.periodItems[_this.selectedPeriodItemIndex].color = String(inputColorElement.val()).substring(1);
                _this.editButton.trigger("click");
                _this.refreshScheduleList(true);
            }
            else {
                _this.periodItems.push(new ScheduleItemGeneric(textInput, null, String(inputColorElement.val()).substring(1)));
            }
            inputElement.val("");
            _this.refreshPeriodList(true);
        });
        this.editButton.on("click", function () {
            var inputElement = $("#new-period-text");
            var inputColorElement = $("#new-period-color");
            if (_this.editingPeriod) {
                _this.editingPeriod = false;
                _this.addButton.html("Add period");
                _this.editButton.html("Edit period");
                _this.removeButton.show();
                inputElement.val("");
            }
            else {
                _this.editingPeriod = true;
                _this.addButton.html("Update period");
                _this.editButton.html("Cancel");
                _this.removeButton.hide();
                inputElement.val(_this.periodItems[_this.selectedPeriodItemIndex].periodName);
                inputColorElement.val("#" + _this.periodItems[_this.selectedPeriodItemIndex].color);
            }
        });
        this.removeButton.on("click", function () {
            for (var i = 0; i < _this.scheduleItems.length; ++i) {
                if (_this.scheduleItems[i].periodName == _this.periodItems[_this.selectedPeriodItemIndex].periodName) {
                    _this.scheduleItems[i].periodName = "None";
                    _this.scheduleItems[i].color = _this.defaultPeriodColor;
                }
            }
            for (var i = _this.selectedPeriodItemIndex; i < _this.periodItems.length; ++i) {
                if (i + 1 >= _this.periodItems.length) {
                    _this.periodItems.pop();
                    break;
                }
                _this.periodItems[i] = _this.periodItems[i + 1];
            }
            if (_this.periodItems.length == 0) {
                _this.selectedPeriodItemIndex = -1;
                _this.editButton.hide();
                _this.removeButton.hide();
            }
            else if (_this.selectedPeriodItemIndex >= _this.periodItems.length) {
                _this.selectedPeriodItemIndex -= 1;
            }
            _this.refreshScheduleList(true);
            _this.refreshPeriodList(true);
        });
    };
    ScheduleViewManager.prototype.load = function () {
        var _this = this;
        $(function () {
            _this.errorText.hide();
            _this.periodConfigurationMenu.hide();
            var fetchFromServerIdentifier = "schedule-view-fetchedFromServer";
            electron_1.ipcRenderer.on(RequestTypes_1.NetworkOperation.Reconnect, function () {
                electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Save, { identifier: fetchFromServerIdentifier, data: undefined });
                $(".nav-item a")[1].click();
            });
            var fetchedFromServer = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, fetchFromServerIdentifier);
            if (!fetchedFromServer) {
                var retrievedScheduleIData = electron_1.ipcRenderer.sendSync(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Get, identifiers: [_this.scheduleItemsIdentifier] });
                var retrievedPeriodData = electron_1.ipcRenderer.sendSync(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Get, identifiers: [_this.periodItemsIdentifier] });
                var scheduleData = void 0;
                var periodData = void 0;
                if (retrievedScheduleIData == undefined || retrievedScheduleIData.data == undefined || (scheduleData = JSON.parse(retrievedScheduleIData.data[0])) == undefined ||
                    retrievedPeriodData == undefined || retrievedPeriodData.data == undefined || (periodData = JSON.parse(retrievedPeriodData.data[0])) == undefined) {
                    _this.timeTableAppend(new ScheduleItemGeneric("None", "12 PM", _this.defaultPeriodColor));
                    _this.scheduleItems.push(new ScheduleItemGeneric("None", "12 PM", _this.defaultPeriodColor));
                    for (var i = 1; i <= 12; ++i) {
                        var item = new ScheduleItemGeneric("None", i + " AM", _this.defaultPeriodColor);
                        _this.timeTableAppend(item);
                        _this.scheduleItems.push(item);
                    }
                    for (var i = 1; i <= 11; ++i) {
                        var item = new ScheduleItemGeneric("None", i + " PM", _this.defaultPeriodColor);
                        _this.timeTableAppend(item);
                        _this.scheduleItems.push(item);
                    }
                    _this.periodItems.push(new ScheduleItemGeneric("None", null, _this.defaultPeriodColor));
                    _this.refreshScheduleList(true);
                    _this.refreshPeriodList(true);
                }
                else {
                    _this.updateScheduleItems(scheduleData, false);
                    _this.updatePeriodItems(periodData, false);
                }
                electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: fetchFromServerIdentifier, data: true });
            }
            else {
                var retrievedScheduleItems = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, _this.scheduleItemsIdentifier);
                _this.updateScheduleItems(retrievedScheduleItems, false);
                var retrievedPeriodItems = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, _this.periodItemsIdentifier);
                _this.updatePeriodItems(retrievedPeriodItems, false);
            }
            electron_1.ipcRenderer.on(_this.scheduleItemsIdentifier + "-update", function (event, data) {
                _this.updateScheduleItems(JSON.parse(data), false);
            });
            electron_1.ipcRenderer.on(_this.periodItemsIdentifier + "-update", function (event, data) {
                _this.updatePeriodItems(JSON.parse(data), false);
            });
        });
    };
    ScheduleViewManager.prototype.updateScheduleItems = function (data, sendServerPost) {
        this.scheduleItems = [];
        if (data == undefined)
            return;
        for (var i = 0; i < data.length; ++i) {
            this.scheduleItems.push(new ScheduleItemGeneric(data[i].periodName, data[i].hour, data[i].color));
        }
        this.refreshScheduleList(sendServerPost);
    };
    ScheduleViewManager.prototype.updatePeriodItems = function (data, sendServerPost) {
        this.periodItems = [];
        for (var i = 0; i < data.length; ++i) {
            this.periodItems.push(new ScheduleItemGeneric(data[i].periodName, null, data[i].color));
        }
        this.refreshPeriodList(sendServerPost);
    };
    ScheduleViewManager.prototype.deselectAllPeriods = function () {
        this.selectedPeriodItemIndex = -1;
        var htmlPeriodItems = $(".list-period-item");
        for (var i = 0; i < htmlPeriodItems.length; ++i) {
            htmlPeriodItems[i].classList.remove("active-important", "list-group-item");
            htmlPeriodItems[i].classList.add("list-group-item-darker");
        }
    };
    ScheduleViewManager.prototype.timeTableAppend = function (item) {
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
        newScheduleItem.appendTo(this.scheduleItemContainer);
    };
    ScheduleViewManager.prototype.refreshScheduleList = function (sendServerPost) {
        var _this = this;
        this.scheduleItemContainer.html(" ");
        for (var i = 0; i < this.scheduleItems.length; ++i) {
            this.timeTableAppend(this.scheduleItems[i]);
        }
        var htmlScheduleItems = $(".list-time-item");
        var _loop_1 = function (i) {
            htmlScheduleItems[i].addEventListener("click", function () {
                _this.periodConfigurationMenu.hide();
                if (_this.selectedScheduleItemIndex >= 0) {
                    htmlScheduleItems[_this.selectedScheduleItemIndex].classList.remove("active-important", "list-group-item");
                    htmlScheduleItems[_this.selectedScheduleItemIndex].classList.add("list-group-item-darker");
                    htmlScheduleItems[_this.selectedScheduleItemIndex].children[0].classList.remove("white-important");
                }
                if (_this.selectedScheduleItemIndex == i) {
                    _this.selectedScheduleItemIndex = -1;
                    _this.scheduleItemSelected = false;
                    _this.deselectAllPeriods();
                }
                else {
                    _this.selectedScheduleItemIndex = i;
                    htmlScheduleItems[i].classList.add("active-important", "list-group-item");
                    htmlScheduleItems[i].classList.remove("list-group-item-darker");
                    htmlScheduleItems[i].children[0].classList.add("white-important");
                    _this.scheduleItemSelected = true;
                    var htmlPeriodItems = $(".list-period-item");
                    for (var j = 0; j < htmlPeriodItems.length; ++j) {
                        if (htmlPeriodItems[j].innerHTML == _this.scheduleItems[i].periodName) {
                            if (j == _this.selectedPeriodItemIndex)
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
        if (this.selectedScheduleItemIndex >= 0) {
            htmlScheduleItems[this.selectedScheduleItemIndex].classList.add("active-important", "list-group-item");
            htmlScheduleItems[this.selectedScheduleItemIndex].classList.remove("list-group-item-darker");
            htmlScheduleItems[this.selectedScheduleItemIndex].children[0].classList.add("white-important");
        }
        electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: this.scheduleItemsIdentifier, data: this.scheduleItems });
        if (sendServerPost)
            electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Post, identifiers: [this.scheduleItemsIdentifier], data: this.scheduleItems });
    };
    ScheduleViewManager.prototype.refreshPeriodList = function (sendServerPost) {
        var _this = this;
        this.periodItemContainer.html("");
        for (var i = 0; i < this.periodItems.length; ++i) {
            $("<li class='list-group-item-darker list-group-flush list-period-item'/>")
                .css("background-color", "#" + this.periodItems[i].color)
                .css("color", invert_color_1.default(this.periodItems[i].color))
                .text(this.periodItems[i].periodName)
                .appendTo(this.periodItemContainer);
        }
        var htmlPeriodItems = $(".list-period-item");
        var _loop_2 = function (i) {
            htmlPeriodItems[i].addEventListener("click", function () {
                if (_this.editingPeriod) {
                    _this.editingPeriod = false;
                    _this.addButton.html("Add period");
                    _this.editButton.html("Edit period");
                    _this.removeButton.show();
                    $("#new-period-text").val("");
                }
                if (_this.selectedPeriodItemIndex >= 0) {
                    htmlPeriodItems[_this.selectedPeriodItemIndex].classList.remove("active-important", "list-group-item");
                    htmlPeriodItems[_this.selectedPeriodItemIndex].classList.add("list-group-item-darker");
                }
                if (!_this.scheduleItemSelected && _this.selectedPeriodItemIndex == i) {
                    _this.selectedPeriodItemIndex = -1;
                    _this.periodConfigurationMenu.hide();
                }
                else {
                    _this.selectedPeriodItemIndex = i;
                    htmlPeriodItems[i].classList.add("active-important", "list-group-item");
                    htmlPeriodItems[i].classList.remove("list-group-item-darker");
                    if (_this.scheduleItemSelected) {
                        _this.scheduleItems[_this.selectedScheduleItemIndex].periodName = _this.periodItems[_this.selectedPeriodItemIndex].periodName;
                        _this.scheduleItems[_this.selectedScheduleItemIndex].color = _this.periodItems[_this.selectedPeriodItemIndex].color;
                        _this.refreshScheduleList(true);
                        _this.periodConfigurationMenu.hide();
                    }
                    else {
                        _this.periodConfigurationMenu.show();
                    }
                    if (_this.selectedPeriodItemIndex == 0) {
                        _this.periodConfigurationMenu.hide();
                    }
                }
            });
        };
        for (var i = 0; i < htmlPeriodItems.length; ++i) {
            _loop_2(i);
        }
        if (this.selectedPeriodItemIndex >= 0) {
            htmlPeriodItems[this.selectedPeriodItemIndex].classList.add("active-important", "list-group-item");
            htmlPeriodItems[this.selectedPeriodItemIndex].classList.remove("list-group-item-darker");
        }
        if (this.selectedPeriodItemIndex == 0) {
            this.periodConfigurationMenu.hide();
        }
        electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: this.periodItemsIdentifier, data: this.periodItems });
        if (sendServerPost)
            electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Post, identifiers: [this.periodItemsIdentifier], data: this.periodItems });
    };
    return ScheduleViewManager;
}());
exports.ScheduleViewManager = ScheduleViewManager;
