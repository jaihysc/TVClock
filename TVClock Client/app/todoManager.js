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
var taskList = $("#active-tasks-list");
var tasks = [];
var selectedTaskIndex = -1;
var tasksIdentifier = "todo-view-tasks";
$(function () {
    var fetchedFromServerIdentifier = "todo-view-fetchedFromServer";
    var fetchedFromServer = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, fetchedFromServerIdentifier);
    electron_1.ipcRenderer.on(RequestTypes_1.NetworkOperation.Reconnect, function () {
        electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Save, { identifier: fetchedFromServerIdentifier, data: undefined });
        $(".nav-item a")[0].click();
    });
    var data = [];
    if (fetchedFromServer == undefined || !fetchedFromServer) {
        var jsonData = electron_1.ipcRenderer.sendSync(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Get, identifiers: [tasksIdentifier] });
        data = JSON.parse(jsonData.data[0]);
        electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: fetchedFromServerIdentifier, data: true });
        updateTasks(data, false);
    }
    else {
        data = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, tasksIdentifier);
        updateTasks(data, false);
    }
    electron_1.ipcRenderer.on(tasksIdentifier + "-update", function (event, data) {
        updateTasks(JSON.parse(data), false);
    });
});
var addTaskBtn = $("#add-task-btn");
var editTaskBtn = $("#edit-task-btn");
var removeTaskBtn = $("#remove-task-btn");
editTaskBtn.hide();
removeTaskBtn.hide();
var newTaskText = $("#new-task-text");
var newTaskStartDate = $("#new-task-start-date");
var newTaskEndDate = $("#new-task-end-date");
var taskErrorText = $("#new-task-text-error");
var editUpdatingTask = false;
var currentDate = new Date();
currentDate.setDate(currentDate.getDate() + 2);
newTaskStartDate.attr("placeholder", toFullDateString(currentDate));
newTaskEndDate.attr("placeholder", currentDate.toDateString());
taskErrorText.hide();
addTaskBtn.on("click", function () {
    var taskText = String(newTaskText.val());
    var startDate = String(newTaskStartDate.val());
    var endDate = String(newTaskEndDate.val());
    if (taskText == "") {
        taskErrorText.show();
        return;
    }
    taskErrorText.hide();
    if (startDate == "") {
        startDate = String(newTaskStartDate.attr("placeholder"));
    }
    if (endDate == "") {
        endDate = String(newTaskEndDate.attr("placeholder"));
    }
    var newTask = new Task(taskText, new Date(startDate), new Date(endDate));
    if (editUpdatingTask) {
        tasks[selectedTaskIndex] = newTask;
        editTaskBtn.trigger("click");
    }
    else {
        tasks.push(newTask);
    }
    wipeInputFields();
    updateTaskList(true);
});
editTaskBtn.on("click", function () {
    if (editUpdatingTask) {
        editUpdatingTask = false;
        addTaskBtn.html("Add task");
        editTaskBtn.html("Edit task");
        removeTaskBtn.show();
        wipeInputFields();
    }
    else {
        editUpdatingTask = true;
        addTaskBtn.html("Update task");
        editTaskBtn.html("Cancel");
        removeTaskBtn.hide();
        newTaskText.val(tasks[selectedTaskIndex].text);
        newTaskStartDate.val(toFullDateString(tasks[selectedTaskIndex].startDate));
        newTaskEndDate.val(toFullDateString(tasks[selectedTaskIndex].endDate));
    }
});
removeTaskBtn.on("click", function () {
    for (var i = selectedTaskIndex; i < tasks.length; ++i) {
        if (i + 1 >= tasks.length) {
            tasks.pop();
            break;
        }
        tasks[i] = tasks[i + 1];
    }
    if (tasks.length == 0) {
        selectedTaskIndex = -1;
        editTaskBtn.hide();
        removeTaskBtn.hide();
    }
    else if (selectedTaskIndex >= tasks.length) {
        selectedTaskIndex -= 1;
    }
    updateTaskList(true);
});
function updateTasks(data, sendServerPost) {
    tasks = [];
    if (data != undefined) {
        for (var i = 0; i < data.length; ++i) {
            tasks.push(new Task(data[i].text, new Date(data[i].startDate), new Date(data[i].endDate)));
        }
    }
    updateTaskList(sendServerPost);
}
function wipeInputFields() {
    newTaskText.val("");
    newTaskStartDate.val("");
    newTaskEndDate.val("");
}
function toFullDateString(date) {
    return date.toDateString() + " " + date.getHours() + ":" + date.getMinutes();
}
function updateTaskList(sendServerPost) {
    taskList.html("");
    for (var i = 0; i < tasks.length; ++i) {
        var pTag = $("<p class='list-item-description'/>")
            .text(tasks[i].startDate + " - " + tasks[i].endDate);
        $("<li class='list-group-item-darker list-group-flush task-list-item'>")
            .text(tasks[i].text)
            .append(pTag)
            .appendTo(taskList);
    }
    var taskListItems = $(".task-list-item");
    var _loop_1 = function (i) {
        taskListItems[i].addEventListener("click", function () {
            if (editUpdatingTask) {
                editUpdatingTask = false;
                addTaskBtn.html("Add period");
                editTaskBtn.html("Edit period");
                removeTaskBtn.show();
                wipeInputFields();
            }
            if (selectedTaskIndex >= 0) {
                taskListItems[selectedTaskIndex].classList.remove("active", "list-group-item");
                taskListItems[selectedTaskIndex].classList.add("list-group-item-darker");
            }
            if (selectedTaskIndex == i) {
                selectedTaskIndex = -1;
                editTaskBtn.hide();
                removeTaskBtn.hide();
            }
            else {
                selectedTaskIndex = i;
                taskListItems[i].classList.add("active", "list-group-item");
                taskListItems[i].classList.remove("list-group-item-darker");
                editTaskBtn.show();
                removeTaskBtn.show();
            }
        });
    };
    for (var i = 0; i < taskListItems.length; ++i) {
        _loop_1(i);
    }
    if (selectedTaskIndex >= 0) {
        taskListItems[selectedTaskIndex].classList.add("active", "list-group-item");
        taskListItems[selectedTaskIndex].classList.remove("list-group-item-darker");
    }
    electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: tasksIdentifier, data: tasks });
    if (sendServerPost)
        electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Post, identifiers: [tasksIdentifier], data: tasks });
}
