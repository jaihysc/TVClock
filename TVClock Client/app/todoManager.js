"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var RequestTypes_1 = require("./RequestTypes");
var Task = (function () {
    function Task(text, startDate, endDate) {
        this.text = "";
        this.startDate = new Date();
        this.endDate = new Date();
        this.text = text;
        this.startDate = startDate;
        this.endDate = endDate;
    }
    return Task;
}());
var TodoViewManager = (function () {
    function TodoViewManager() {
        this.taskList = $("#active-tasks-list");
        this.tasks = [];
        this.selectedTaskIndex = -1;
        this.addTaskBtn = $("#add-task-btn");
        this.editTaskBtn = $("#edit-task-btn");
        this.removeTaskBtn = $("#remove-task-btn");
        this.newTaskText = $("#new-task-text");
        this.newTaskStartDate = $("#new-task-start-date");
        this.newTaskEndDate = $("#new-task-end-date");
        this.taskErrorText = $("#new-task-text-error");
        this.editUpdatingTask = false;
        this.tasksIdentifier = "todo-view-tasks";
        this.fetchedFromServerIdentifier = "todo-view-fetchedFromServer";
    }
    TodoViewManager.prototype.initialize = function () {
        this.taskList = $("#active-tasks-list");
        this.selectedTaskIndex = -1;
        this.addTaskBtn = $("#add-task-btn");
        this.editTaskBtn = $("#edit-task-btn");
        this.removeTaskBtn = $("#remove-task-btn");
        this.newTaskText = $("#new-task-text");
        this.newTaskStartDate = $("#new-task-start-date");
        this.newTaskEndDate = $("#new-task-end-date");
        this.taskErrorText = $("#new-task-text-error");
    };
    TodoViewManager.prototype.preload = function () {
        var _this = this;
        electron_1.ipcRenderer.on(this.tasksIdentifier + "-update", function (event, data) {
            _this.updateTasks(JSON.parse(data), false);
        });
        this.addTaskBtn.on("click", function () {
            var taskText = String(_this.newTaskText.val());
            var startDate = String(_this.newTaskStartDate.val());
            var endDate = String(_this.newTaskEndDate.val());
            if (taskText == "") {
                _this.taskErrorText.show();
                return;
            }
            _this.taskErrorText.hide();
            if (startDate == "") {
                startDate = String(_this.newTaskStartDate.attr("placeholder"));
            }
            if (endDate == "") {
                endDate = String(_this.newTaskEndDate.attr("placeholder"));
            }
            var newTask = new Task(taskText, new Date(startDate), new Date(endDate));
            if (_this.editUpdatingTask) {
                _this.tasks[_this.selectedTaskIndex] = newTask;
                _this.editTaskBtn.trigger("click");
            }
            else {
                _this.tasks.push(newTask);
            }
            _this.wipeInputFields();
            _this.updateTaskList(true);
        });
        this.editTaskBtn.on("click", function () {
            if (_this.editUpdatingTask) {
                _this.editUpdatingTask = false;
                _this.addTaskBtn.html("Add task");
                _this.editTaskBtn.html("Edit task");
                _this.removeTaskBtn.show();
                _this.wipeInputFields();
            }
            else {
                _this.editUpdatingTask = true;
                _this.addTaskBtn.html("Update task");
                _this.editTaskBtn.html("Cancel");
                _this.removeTaskBtn.hide();
                _this.newTaskText.val(_this.tasks[_this.selectedTaskIndex].text);
                _this.newTaskStartDate.val(TodoViewManager.toFullDateString(_this.tasks[_this.selectedTaskIndex].startDate));
                _this.newTaskEndDate.val(TodoViewManager.toFullDateString(_this.tasks[_this.selectedTaskIndex].endDate));
            }
        });
        this.removeTaskBtn.on("click", function () {
            for (var i = _this.selectedTaskIndex; i < _this.tasks.length; ++i) {
                if (i + 1 >= _this.tasks.length) {
                    _this.tasks.pop();
                    break;
                }
                _this.tasks[i] = _this.tasks[i + 1];
            }
            if (_this.tasks.length == 0) {
                _this.selectedTaskIndex = -1;
                _this.editTaskBtn.hide();
                _this.removeTaskBtn.hide();
            }
            else if (_this.selectedTaskIndex >= _this.tasks.length) {
                _this.selectedTaskIndex -= 1;
            }
            _this.updateTaskList(true);
        });
    };
    TodoViewManager.prototype.load = function () {
        var _this = this;
        $(function () {
            _this.editTaskBtn.hide();
            _this.removeTaskBtn.hide();
            _this.taskErrorText.hide();
            var currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + 2);
            _this.newTaskStartDate.attr("placeholder", TodoViewManager.toFullDateString(currentDate));
            _this.newTaskEndDate.attr("placeholder", currentDate.toDateString());
            var fetchedFromServer = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, _this.fetchedFromServerIdentifier);
            electron_1.ipcRenderer.on(RequestTypes_1.NetworkOperation.Reconnect, function () {
                electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Save, { identifier: _this.fetchedFromServerIdentifier, data: undefined });
                $(".nav-item a")[0].click();
            });
            var data = [];
            if (fetchedFromServer == undefined || !fetchedFromServer) {
                var jsonData = electron_1.ipcRenderer.sendSync(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Get, identifiers: [_this.tasksIdentifier] });
                data = JSON.parse(jsonData.data[0]);
                electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: _this.fetchedFromServerIdentifier, data: true });
                _this.updateTasks(data, false);
            }
            else {
                data = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, _this.tasksIdentifier);
                _this.updateTasks(data, false);
            }
        });
    };
    TodoViewManager.prototype.updateTasks = function (data, sendServerPost) {
        this.tasks = [];
        if (data != undefined) {
            for (var i = 0; i < data.length; ++i) {
                this.tasks.push(new Task(data[i].text, new Date(data[i].startDate), new Date(data[i].endDate)));
            }
        }
        this.updateTaskList(sendServerPost);
    };
    TodoViewManager.prototype.wipeInputFields = function () {
        this.newTaskText.val("");
        this.newTaskStartDate.val("");
        this.newTaskEndDate.val("");
    };
    TodoViewManager.toFullDateString = function (date) {
        return date.toDateString() + " " + date.getHours() + ":" + date.getMinutes();
    };
    TodoViewManager.prototype.updateTaskList = function (sendServerPost) {
        var _this = this;
        this.taskList.html("");
        for (var i = 0; i < this.tasks.length; ++i) {
            var pTag = $("<p class='list-item-description'/>")
                .text(this.tasks[i].startDate + " - " + this.tasks[i].endDate);
            $("<li class='list-group-item-darker list-group-flush task-list-item'>")
                .text(this.tasks[i].text)
                .append(pTag)
                .appendTo(this.taskList);
        }
        var taskListItems = $(".task-list-item");
        var _loop_1 = function (i) {
            taskListItems[i].addEventListener("click", function () {
                if (_this.editUpdatingTask) {
                    _this.editUpdatingTask = false;
                    _this.addTaskBtn.html("Add period");
                    _this.editTaskBtn.html("Edit period");
                    _this.removeTaskBtn.show();
                    _this.wipeInputFields();
                }
                if (_this.selectedTaskIndex >= 0) {
                    taskListItems[_this.selectedTaskIndex].classList.remove("active", "list-group-item");
                    taskListItems[_this.selectedTaskIndex].classList.add("list-group-item-darker");
                }
                if (_this.selectedTaskIndex == i) {
                    _this.selectedTaskIndex = -1;
                    _this.editTaskBtn.hide();
                    _this.removeTaskBtn.hide();
                }
                else {
                    _this.selectedTaskIndex = i;
                    taskListItems[i].classList.add("active", "list-group-item");
                    taskListItems[i].classList.remove("list-group-item-darker");
                    _this.editTaskBtn.show();
                    _this.removeTaskBtn.show();
                }
            });
        };
        for (var i = 0; i < taskListItems.length; ++i) {
            _loop_1(i);
        }
        if (this.selectedTaskIndex >= 0) {
            taskListItems[this.selectedTaskIndex].classList.add("active", "list-group-item");
            taskListItems[this.selectedTaskIndex].classList.remove("list-group-item-darker");
        }
        electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: this.tasksIdentifier, data: this.tasks });
        if (sendServerPost)
            electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Post, identifiers: [this.tasksIdentifier], data: this.tasks });
    };
    return TodoViewManager;
}());
exports.TodoViewManager = TodoViewManager;
