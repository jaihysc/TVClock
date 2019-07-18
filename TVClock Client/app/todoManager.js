"use strict";
//Renderer
//Manager for todo view
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
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
//Networking retrieve stored tasks
var tasksIdentifier = "todo-view-tasks"; //Identifier for tasks in persistence storage
electron_1.ipcRenderer.send("data-retrieve", "todo-view-fetchedFromServer");
electron_1.ipcRenderer.once("data-retrieve-response", function (event, fetchedFromServer) {
    if (fetchedFromServer == undefined) {
        //If undefined, it means no fetch has been sent
        //TODO Send fetch request to server
        console.log("server fetch request");
        //Save that a fetch has already been performed to the server
        electron_1.ipcRenderer.send("data-save", { identifier: "todo-view-fetchedFromServer", data: true });
        $(function () {
            //Updates the appearance of the task list with the data from tasks
            updateTaskList();
        });
    }
    else {
        //Retrieve back stored data
        electron_1.ipcRenderer.send("data-retrieve", tasksIdentifier);
        electron_1.ipcRenderer.once("data-retrieve-response", function (event, data) {
            if (data == undefined)
                return;
            for (var i = 0; i < data.length; ++i) {
                //Reconvert date text into date
                tasks.push(new Task(data[i].text, new Date(data[i].startDate), new Date(data[i].endDate)));
            }
            //-----------------------------
            //Wait until the document is ready before running default actions
            $(function () {
                //Updates the appearance of the task list with the data from tasks
                updateTaskList();
            });
        });
    }
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
    updateTaskList();
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
    updateTaskList();
});
//-----------------------------
//Functions
function wipeInputFields() {
    newTaskText.val("");
    newTaskStartDate.val("");
    newTaskEndDate.val("");
}
function toFullDateString(date) {
    return date.toDateString() + " " + date.getHours() + ":" + date.getMinutes();
}
//Injects html into the list for elements to appear on screen, saves task data to persistent
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
    electron_1.ipcRenderer.send("data-save", { identifier: tasksIdentifier, data: tasks });
}
