"use strict";
//Renderer
//Manager for tasks view
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var RequestTypes_1 = require("./RequestTypes");
//An active task in the task list
var Task = /** @class */ (function () {
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
var tasks = []; //Collection of tasks
var selectedTaskIndex = -1; //Index of current selected active task
//-----------------------------
//Setup
var tasksIdentifier = "todo-view-tasks"; //Identifier for tasks in persistence storage
//-----------------------------
//Networking retrieve stored tasks
//Wait until the document is ready before running dso the user has something to look at
$(function () {
    var fetchedFromServer = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, "todo-view-fetchedFromServer");
    var data = [];
    if (fetchedFromServer == undefined) {
        electron_1.ipcRenderer.once("main-ready", function () {
            //If undefined, it means no fetch has been sent to the server
            if (fetchedFromServer == undefined) {
                //Send fetch request to server
                var jsonData = electron_1.ipcRenderer.sendSync(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Get, identifiers: [tasksIdentifier] });
                data = JSON.parse(jsonData.data[0]);
                //Save that a fetch has already been performed to the server
                electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: "todo-view-fetchedFromServer", data: true });
                updateTasks(data, false);
            }
        });
    }
    else {
        //Retrieve back stored data from localstorage
        data = electron_1.ipcRenderer.sendSync(RequestTypes_1.LocalStorageOperation.Fetch, tasksIdentifier);
        updateTasks(data, false);
    }
    //Set up update request handler
    electron_1.ipcRenderer.on(tasksIdentifier + "-update", function (event, data) {
        updateTasks(JSON.parse(data), false);
    });
});
//-----------------------------
//UI logic
//Task manager buttons
var addTaskBtn = $("#add-task-btn");
var editTaskBtn = $("#edit-task-btn");
var removeTaskBtn = $("#remove-task-btn");
//Hide edit and remove buttons by default
editTaskBtn.hide();
removeTaskBtn.hide();
//Adding a task to active tasks with task manager
var newTaskText = $("#new-task-text");
var newTaskStartDate = $("#new-task-start-date");
var newTaskEndDate = $("#new-task-end-date");
var taskErrorText = $("#new-task-text-error");
var editUpdatingTask = false; //Keep track of whether the edit button is in use or not
//Set placeholder start date to current time, and end date to 2 days in the future
var currentDate = new Date();
currentDate.setDate(currentDate.getDate() + 2); //add 2 days for the future end date
newTaskStartDate.attr("placeholder", toFullDateString(currentDate));
newTaskEndDate.attr("placeholder", currentDate.toDateString());
taskErrorText.hide(); //Hide error text by default
//-----------------------------
//Add button click, gather information from text fields and add to task list array
addTaskBtn.on("click", function () {
    var taskText = String(newTaskText.val());
    var startDate = String(newTaskStartDate.val());
    var endDate = String(newTaskEndDate.val());
    //Show error text if task does not have a name
    if (taskText == "") {
        taskErrorText.show();
        return;
    }
    taskErrorText.hide();
    //If date boxes are empty, use placeholder date
    if (startDate == "") {
        startDate = String(newTaskStartDate.attr("placeholder"));
    }
    if (endDate == "") {
        endDate = String(newTaskEndDate.attr("placeholder"));
    }
    var newTask = new Task(taskText, new Date(startDate), new Date(endDate));
    //Perform separate function if currently editing task
    if (editUpdatingTask) {
        tasks[selectedTaskIndex] = newTask; //Overwrite when editing
        editTaskBtn.trigger("click"); //Exit edit mode by clicking the edit button
    }
    else {
        tasks.push(newTask); //Create new task
    }
    wipeInputFields();
    //Refresh task list to include changes
    updateTaskList(true);
});
//Edit and remove button functionality
editTaskBtn.on("click", function () {
    //Exit updating task if edit button is pressed again
    if (editUpdatingTask) {
        editUpdatingTask = false;
        addTaskBtn.html("Add task");
        editTaskBtn.html("Edit task");
        removeTaskBtn.show();
        wipeInputFields();
    }
    else {
        //Rename add task button to update task
        editUpdatingTask = true;
        addTaskBtn.html("Update task");
        editTaskBtn.html("Cancel");
        removeTaskBtn.hide();
        //Load data from the selected task item into fields
        newTaskText.val(tasks[selectedTaskIndex].text);
        newTaskStartDate.val(toFullDateString(tasks[selectedTaskIndex].startDate));
        newTaskEndDate.val(toFullDateString(tasks[selectedTaskIndex].endDate));
    }
});
removeTaskBtn.on("click", function () {
    //Remove task by overwriting it with the tasks after it (n+1)
    for (var i = selectedTaskIndex; i < tasks.length; ++i) {
        //If at end of array, pop last one away since there is none after it
        if (i + 1 >= tasks.length) {
            tasks.pop();
            break;
        }
        tasks[i] = tasks[i + 1];
    }
    //If there are no more tasks in the list, do not select anything
    if (tasks.length == 0) {
        selectedTaskIndex = -1;
        editTaskBtn.hide();
        removeTaskBtn.hide();
    }
    else if (selectedTaskIndex >= tasks.length) { //If user selected last task
        selectedTaskIndex -= 1;
    }
    updateTaskList(true);
});
//-----------------------------
//Functions
function updateTasks(data, sendServerPost) {
    tasks = []; //Clear tasks first
    if (data != undefined) {
        for (var i = 0; i < data.length; ++i) {
            //Reconvert date text into date
            tasks.push(new Task(data[i].text, new Date(data[i].startDate), new Date(data[i].endDate)));
        }
    }
    //Updates the appearance of the task list with the data from tasks
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
//Injects html into the list for elements to appear on screen, saves task data to persistent
function updateTaskList(sendServerPost) {
    taskList.html(""); //Clear old contents first
    for (var i = 0; i < tasks.length; ++i) {
        //Inject each task into the html after sanitizing it
        var pTag = $("<p class='list-item-description'/>")
            .text(tasks[i].startDate + " - " + tasks[i].endDate);
        $("<li class='list-group-item-darker list-group-flush task-list-item'>")
            .text(tasks[i].text)
            .append(pTag)
            .appendTo(taskList);
    }
    //Create event handlers for each task so it can be set active
    var taskListItems = $(".task-list-item");
    var _loop_1 = function (i) {
        taskListItems[i].addEventListener("click", function () {
            //Cancel editing
            if (editUpdatingTask) {
                editUpdatingTask = false;
                addTaskBtn.html("Add period");
                editTaskBtn.html("Edit period");
                removeTaskBtn.show();
                wipeInputFields();
            }
            //Set clicked button as active
            //The class list-group-item is added as active only shows up with list-group-item
            //Removing the custom class list-group-item-darker
            if (selectedTaskIndex >= 0) {
                taskListItems[selectedTaskIndex].classList.remove("active", "list-group-item");
                taskListItems[selectedTaskIndex].classList.add("list-group-item-darker");
            }
            //If clicking the same item, unselect it
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
    //Preselect an item based on the selectedTaskIndex
    if (selectedTaskIndex >= 0) {
        taskListItems[selectedTaskIndex].classList.add("active", "list-group-item");
        taskListItems[selectedTaskIndex].classList.remove("list-group-item-darker");
    }
    //Save task data to persistent
    electron_1.ipcRenderer.send(RequestTypes_1.LocalStorageOperation.Save, { identifier: tasksIdentifier, data: tasks });
    //Send POST to server
    if (sendServerPost)
        electron_1.ipcRenderer.send(RequestTypes_1.NetworkOperation.Send, { requestType: RequestTypes_1.RequestType.Post, identifiers: [tasksIdentifier], data: tasks });
}
