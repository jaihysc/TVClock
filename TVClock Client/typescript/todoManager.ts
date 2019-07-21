//Renderer
//Manager for tasks view

import { ipcRenderer } from "electron";
import { RequestType, NetworkOperation, LocalStorageOperation } from "./RequestTypes";

//An active task in the task list
class Task {
    constructor(text: string, startDate: Date, endDate: Date) {
        this.text = text;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    text = "";
    startDate = new Date();
    endDate = new Date();
}

let taskList = $("#active-tasks-list");
let tasks: Task[] = []; //Collection of tasks
let selectedTaskIndex = -1; //Index of current selected active task

//-----------------------------
//Setup
const tasksIdentifier = "todo-view-tasks"; //Identifier for tasks in persistence storage
//-----------------------------
//Networking retrieve stored tasks
//Wait until the document is ready before running dso the user has something to look at
$(function() {
    let fetchedFromServer: boolean = ipcRenderer.sendSync(LocalStorageOperation.Fetch, "todo-view-fetchedFromServer");

    let data: Task[] = [];
    if (fetchedFromServer == undefined) {
        ipcRenderer.once("main-ready", () => { //main-ready is emitted after a connection is established with the server
            //If undefined, it means no fetch has been sent to the server
            if (fetchedFromServer == undefined) {
                //Send fetch request to server
                let jsonData = ipcRenderer.sendSync(NetworkOperation.Send, {requestType: RequestType.Get, identifiers: [tasksIdentifier]});
                data = JSON.parse(jsonData.data[0]);

                //Save that a fetch has already been performed to the server
                ipcRenderer.send(LocalStorageOperation.Save, {identifier: "todo-view-fetchedFromServer", data: true});

                updateTasks(data, false);
            }
        });
    } else {
        //Retrieve back stored data from localstorage
        data = ipcRenderer.sendSync(LocalStorageOperation.Fetch, tasksIdentifier);
        updateTasks(data, false);
    }

    //Set up update request handler
    ipcRenderer.on(tasksIdentifier + "-update", (event: any, data: string) => {
        updateTasks(JSON.parse(data), false);
    });
});

//-----------------------------
//UI logic

//Task manager buttons
let addTaskBtn = $("#add-task-btn");
let editTaskBtn = $("#edit-task-btn");
let removeTaskBtn = $("#remove-task-btn");

//Hide edit and remove buttons by default
editTaskBtn.hide();
removeTaskBtn.hide();

//Adding a task to active tasks with task manager
let newTaskText = $("#new-task-text");
let newTaskStartDate = $("#new-task-start-date");
let newTaskEndDate = $("#new-task-end-date");

let taskErrorText = $("#new-task-text-error");
let editUpdatingTask = false; //Keep track of whether the edit button is in use or not

//Set placeholder start date to current time, and end date to 2 days in the future
let currentDate = new Date();
currentDate.setDate(currentDate.getDate()+2); //add 2 days for the future end date

newTaskStartDate.attr("placeholder", toFullDateString(currentDate));
newTaskEndDate.attr("placeholder", currentDate.toDateString());

taskErrorText.hide(); //Hide error text by default

//-----------------------------
//Add button click, gather information from text fields and add to task list array
addTaskBtn.on("click", () => {
    let taskText = String(newTaskText.val());
    let startDate = String(newTaskStartDate.val());
    let endDate = String(newTaskEndDate.val());

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

    let newTask = new Task(taskText, new Date(startDate), new Date(endDate));

    //Perform separate function if currently editing task
    if (editUpdatingTask) {
        tasks[selectedTaskIndex] = newTask; //Overwrite when editing
        editTaskBtn.trigger("click"); //Exit edit mode by clicking the edit button
    } else {
        tasks.push(newTask); //Create new task
    }
    wipeInputFields();
    //Refresh task list to include changes
    updateTaskList(true);
});

//Edit and remove button functionality
editTaskBtn.on("click", () => {
    //Exit updating task if edit button is pressed again
    if (editUpdatingTask) {
        editUpdatingTask = false;
        addTaskBtn.html("Add task");
        editTaskBtn.html("Edit task");
        removeTaskBtn.show();

        wipeInputFields();
    } else {
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

removeTaskBtn.on("click", () => {
    //Remove task by overwriting it with the tasks after it (n+1)
    for (let i = selectedTaskIndex; i < tasks.length; ++i) {
        //If at end of array, pop last one away since there is none after it
        if (i + 1 >= tasks.length) {
            tasks.pop();
            break;
        }

        tasks[i] = tasks[i+1];
    }

    //If there are no more tasks in the list, do not select anything
    if (tasks.length == 0) {
        selectedTaskIndex = -1;
        editTaskBtn.hide();
        removeTaskBtn.hide();
    } else if (selectedTaskIndex >= tasks.length) { //If user selected last task
        selectedTaskIndex -= 1;
    }

    updateTaskList(true);
});

//-----------------------------
//Functions
function updateTasks(data: any[], sendServerPost: boolean) {
    tasks = []; //Clear tasks first
    if (data != undefined) {
        for (let i = 0; i < data.length; ++i) {
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

function toFullDateString(date: Date) {
    return `${date.toDateString()} ${date.getHours()}:${date.getMinutes()}`;
}

//Injects html into the list for elements to appear on screen, saves task data to persistent
function updateTaskList(sendServerPost: boolean) {
    taskList.html(""); //Clear old contents first

    for (let i = 0; i < tasks.length; ++i) {
        //Inject each task into the html after sanitizing it
        let pTag = $("<p class='list-item-description'/>")
            .text(tasks[i].startDate + " - " + tasks[i].endDate);
        $("<li class='list-group-item-darker list-group-flush task-list-item'>")
            .text(tasks[i].text)
            .append(pTag)
            .appendTo(taskList);
    }

    //Create event handlers for each task so it can be set active
    let taskListItems = $(".task-list-item");
    for (let i = 0; i < taskListItems.length; ++i) {
        taskListItems[i].addEventListener("click", () => {
            //Cancel editing
            if (editUpdatingTask) {
                editUpdatingTask = false;
                addTaskBtn.html("Add period");
                editTaskBtn.html("Edit period");
                removeTaskBtn.show();

                wipeInputFields()
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
            } else {
                selectedTaskIndex = i;
                taskListItems[i].classList.add("active", "list-group-item");
                taskListItems[i].classList.remove("list-group-item-darker");

                editTaskBtn.show();
                removeTaskBtn.show();
            }
        })
    }

    //Preselect an item based on the selectedTaskIndex
    if (selectedTaskIndex >= 0) {
        taskListItems[selectedTaskIndex].classList.add("active", "list-group-item");
        taskListItems[selectedTaskIndex].classList.remove("list-group-item-darker");
    }

    //Save task data to persistent
    ipcRenderer.send(LocalStorageOperation.Save, {identifier: tasksIdentifier, data: tasks});
    //Send POST to server
    if (sendServerPost)
        ipcRenderer.send(NetworkOperation.Send, {requestType: RequestType.Post, identifiers: [tasksIdentifier], data: tasks});
}