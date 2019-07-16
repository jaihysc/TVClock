"use strict";
//Renderer
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var taskList = $("#active-tasks-list");
var tasks = []; //Collection of tasks
var selectedTaskIndex = -1; //Index of current selected active task
//An active task in the task list
var task = /** @class */ (function () {
    function task(text, startDate, endDate) {
        this.text = "";
        this.startDate = new Date();
        this.endDate = new Date();
        this.text = text;
        this.startDate = startDate;
        this.endDate = endDate;
    }
    return task;
}());
//Retrieve tasks
//TODO Send sync request to server
//Networking sync active tasks
var fetchedFromServer = false; //Only fetch once, and await syncs afterwards
if (fetchedFromServer) {
    electron_1.ipcRenderer.send("data-retrieve", "todo-view-tasks");
    electron_1.ipcRenderer.once("data-retrieve-response", function (event, data) {
        tasks = data;
    });
}
//Updates the appearance of the task list with the data from tasks
updateTaskList();
function updateTaskList() {
    taskList.html(""); //Clear old contents first
    for (var i = 0; i < tasks.length; ++i) {
        //Inject each task into the html
        taskList.append(" <li class=\"list-group-item-darker list-group-flush task-list-item\">" + tasks[i].text +
            "<p class=\"list-item-description\">" + tasks[i].startDate + " - " + tasks[i].endDate +
            "</p></li>");
    }
    //Create event handlers for each task so it can be set active
    var taskListItems = $(".task-list-item");
    var _loop_1 = function (i) {
        taskListItems[i].addEventListener("click", function () {
            //Set clicked button as active
            //The class list-group-item is added as active only shows up with list-group-item
            //Removing the custom class list-group-item-darker
            if (selectedTaskIndex >= 0) {
                taskListItems[selectedTaskIndex].classList.remove("active", "list-group-item");
                taskListItems[selectedTaskIndex].classList.add("list-group-item-darker");
            }
            selectedTaskIndex = i;
            taskListItems[i].classList.add("active", "list-group-item");
            taskListItems[i].classList.remove("list-group-item-darker");
        });
    };
    for (var i = 0; i < taskListItems.length; ++i) {
        _loop_1(i);
    }
    //Preselect an item based on the selectedTaskIndex
    if (selectedTaskIndex >= 0) {
        taskListItems[selectedTaskIndex].click();
    }
}
//Adding a task to active tasks with task manager
var addTaskBtn = $("#add-task-btn");
var editTaskBtn = $("#edit-task-btn");
var removeTaskBtn = $("#remove-task-btn");
var newTaskText = $("#new-task-text");
var newTaskStartDate = $("#new-task-start-date");
var newTaskEndDate = $("#new-task-end-date");
//Set placeholder start date to current time, and end date to 2 days in the future
var currentDate = new Date();
var currentDateString = currentDate.toDateString() + " " + currentDate.getHours() + ":" + currentDate.getMinutes();
currentDate.setDate(currentDate.getDate() + 2); //add 2 days for the future end date
newTaskStartDate.attr("placeholder", currentDateString);
newTaskEndDate.attr("placeholder", currentDate.toDateString());
//Add button click, gather information from text fields and add to task list array
addTaskBtn.on("click", function () {
    //Todo add, if date boxes empty, use placeholder date
    tasks.push(new task(String(newTaskText.val()), new Date(String(newTaskStartDate.val())), new Date(String(newTaskEndDate.val()))));
    //Clear input boxes
    newTaskText.val("");
    newTaskStartDate.val("");
    newTaskEndDate.val("");
    //Refresh task list to include changes
    updateTaskList();
});
//Handle visibility of edit and remove buttons
