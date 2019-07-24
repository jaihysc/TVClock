//Renderer
//Manager for tasks view

import { ipcRenderer } from "electron";
import {RequestType, NetworkOperation, LocalStorageOperation} from "./RequestTypes";
import {IViewController} from "./viewManager";

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

export class TodoViewManager implements IViewController {
    taskList = $(`#active-tasks-list`);
    tasks: Task[] = []; //Collection of tasks
    selectedTaskIndex = -1; //Index of current selected active task

    addTaskBtn = $(`#add-task-btn`);
    editTaskBtn = $(`#edit-task-btn`);
    removeTaskBtn = $(`#remove-task-btn`);

    //Adding a task to active tasks with task manager
    newTaskText = $(`#new-task-text`);
    newTaskStartDate = $(`#new-task-start-date`);
    newTaskEndDate = $(`#new-task-end-date`);
    taskErrorText = $(`#new-task-text-error`);

    editUpdatingTask = false; //Keep track of whether the edit button is in use or not

    tasksIdentifier = "todo-view-tasks"; //Identifier for tasks in persistence storage
    fetchedFromServerIdentifier = "todo-view-fetchedFromServer";

    initialize(): void {
        this.taskList = $("#active-tasks-list");
        this.selectedTaskIndex = -1; //Index of current selected active task

        this.addTaskBtn = $("#add-task-btn");
        this.editTaskBtn = $("#edit-task-btn");
        this.removeTaskBtn = $("#remove-task-btn");

        //Adding a task to active tasks with task manager
        this.newTaskText = $("#new-task-text");
        this.newTaskStartDate = $("#new-task-start-date");
        this.newTaskEndDate = $("#new-task-end-date");
        this.taskErrorText = $("#new-task-text-error");
    }

    preload(): void {
        //Update request handler
        ipcRenderer.on(this.tasksIdentifier + "-update", (event: any, data: string) => {
            this.updateTasks(JSON.parse(data), false);
        });

        //Add button click, gather information from text fields and add to task list array
        this.addTaskBtn.on("click", () => {
            let taskText = String(this.newTaskText.val());
            let startDate = String(this.newTaskStartDate.val());
            let endDate = String(this.newTaskEndDate.val());

            //Show error text if task does not have a name
            if (taskText == "") {
                this.taskErrorText.show();
                return;
            }
            this.taskErrorText.hide();

            //If date boxes are empty, use placeholder date
            if (startDate == "") {
                startDate = String(this.newTaskStartDate.attr("placeholder"));
            }
            if (endDate == "") {
                endDate = String(this.newTaskEndDate.attr("placeholder"));
            }

            let newTask = new Task(taskText, new Date(startDate), new Date(endDate));

            //Perform separate function if currently editing task
            if (this.editUpdatingTask) {
                this.tasks[this.selectedTaskIndex] = newTask; //Overwrite when editing
                this.editTaskBtn.trigger("click"); //Exit edit mode by clicking the edit button
            } else {
                this.tasks.push(newTask); //Create new task
            }
            this.wipeInputFields();
            //Refresh task list to include changes
            this.updateTaskList(true);
        });

        //Edit and remove button functionality
        this.editTaskBtn.on("click", () => {
            //Exit updating task if edit button is pressed again
            if (this.editUpdatingTask) {
                this.editUpdatingTask = false;
                this.addTaskBtn.html("Add task");
                this.editTaskBtn.html("Edit task");
                this.removeTaskBtn.show();

                this.wipeInputFields();
            } else {
                //Rename add task button to update task
                this.editUpdatingTask = true;
                this.addTaskBtn.html("Update task");
                this.editTaskBtn.html("Cancel");
                this.removeTaskBtn.hide();

                //Load data from the selected task item into fields
                this.newTaskText.val(this.tasks[this.selectedTaskIndex].text);
                this.newTaskStartDate.val(TodoViewManager.toFullDateString(this.tasks[this.selectedTaskIndex].startDate));
                this.newTaskEndDate.val(TodoViewManager.toFullDateString(this.tasks[this.selectedTaskIndex].endDate));
            }
        });

        this.removeTaskBtn.on("click", () => {
            //Remove task by overwriting it with the tasks after it (n+1)
            for (let i = this.selectedTaskIndex; i < this.tasks.length; ++i) {
                //If at end of array, pop last one away since there is none after it
                if (i + 1 >= this.tasks.length) {
                    this.tasks.pop();
                    break;
                }

                this.tasks[i] = this.tasks[i+1];
            }

            //If there are no more tasks in the list, do not select anything
            if (this.tasks.length == 0) {
                this.selectedTaskIndex = -1;
                this.editTaskBtn.hide();
                this.removeTaskBtn.hide();
            } else if (this.selectedTaskIndex >= this.tasks.length) { //If user selected last task
                this.selectedTaskIndex -= 1;
            }

            this.updateTaskList(true);
        });
    }

    load(): void {
        //Networking retrieve stored tasks
        //Wait until the document is ready before running so the user has something to look at
        $(() => {
            //Hide edit and remove buttons by default
            this.editTaskBtn.hide();
            this.removeTaskBtn.hide();

            this.taskErrorText.hide(); //Hide error text by default

            //Set placeholder start date to current time, and end date to 2 days in the future
            let currentDate = new Date();
            currentDate.setDate(currentDate.getDate()+2); //add 2 days for the future end date

            this.newTaskStartDate.attr("placeholder", TodoViewManager.toFullDateString(currentDate));
            this.newTaskEndDate.attr("placeholder", currentDate.toDateString());

            let fetchedFromServer: boolean = ipcRenderer.sendSync(LocalStorageOperation.Fetch, this.fetchedFromServerIdentifier);

            ipcRenderer.on(NetworkOperation.Reconnect, () => {
                //Clear all stored data
                ipcRenderer.sendSync(LocalStorageOperation.Save, {identifier: this.fetchedFromServerIdentifier, data: undefined});

                //Refresh the view
                $( ".nav-item a" )[0].click();
            });

            let data: Task[] = [];
            if (fetchedFromServer == undefined || !fetchedFromServer) {
                //Send fetch request to server
                let jsonData = ipcRenderer.sendSync(NetworkOperation.Send, {requestType: RequestType.Get, identifiers: [this.tasksIdentifier]});
                data = JSON.parse(jsonData.data[0]);

                //Save that a fetch has already been performed to the server
                ipcRenderer.send(LocalStorageOperation.Save, {identifier: this.fetchedFromServerIdentifier, data: true});

                this.updateTasks(data, false);
            } else {
                //Retrieve back stored data from localstorage
                data = ipcRenderer.sendSync(LocalStorageOperation.Fetch, this.tasksIdentifier);
                this.updateTasks(data, false);
            }
        });
    }

    updateTasks(data: any[], sendServerPost: boolean) {
        this.tasks = []; //Clear tasks first
        if (data != undefined) {
            for (let i = 0; i < data.length; ++i) {
                //Reconvert date text into date
                this.tasks.push(new Task(data[i].text, new Date(data[i].startDate), new Date(data[i].endDate)));
            }
        }

        //Updates the appearance of the task list with the data from tasks
        this.updateTaskList(sendServerPost);
    }

    wipeInputFields() {
        this.newTaskText.val("");
        this.newTaskStartDate.val("");
        this.newTaskEndDate.val("");
    }

    static toFullDateString(date: Date) {
        return `${date.toDateString()} ${date.getHours()}:${date.getMinutes()}`;
    }

    //Injects html into the list for elements to appear on screen, saves task data to persistent
    updateTaskList(sendServerPost: boolean) {
        this.taskList.html(""); //Clear old contents first

        for (let i = 0; i < this.tasks.length; ++i) {
            //Inject each task into the html after sanitizing it
            let pTag = $("<p class='list-item-description'/>")
                .text(this.tasks[i].startDate + " - " + this.tasks[i].endDate);
            $("<li class='list-group-item-darker list-group-flush task-list-item'>")
                .text(this.tasks[i].text)
                .append(pTag)
                .appendTo(this.taskList);
        }

        //Create event handlers for each task so it can be set active
        let taskListItems = $(".task-list-item");
        for (let i = 0; i < taskListItems.length; ++i) {
            taskListItems[i].addEventListener("click", () => {
                //Cancel editing
                if (this.editUpdatingTask) {
                    this.editUpdatingTask = false;
                    this.addTaskBtn.html("Add period");
                    this.editTaskBtn.html("Edit period");
                    this.removeTaskBtn.show();

                    this.wipeInputFields()
                }

                //Set clicked button as active
                //The class list-group-item is added as active only shows up with list-group-item
                //Removing the custom class list-group-item-darker
                if (this.selectedTaskIndex >= 0) {
                    taskListItems[this.selectedTaskIndex].classList.remove("active", "list-group-item");
                    taskListItems[this.selectedTaskIndex].classList.add("list-group-item-darker");
                }

                //If clicking the same item, unselect it
                if (this.selectedTaskIndex == i) {
                    this.selectedTaskIndex = -1;

                    this.editTaskBtn.hide();
                    this.removeTaskBtn.hide();
                } else {
                    this.selectedTaskIndex = i;
                    taskListItems[i].classList.add("active", "list-group-item");
                    taskListItems[i].classList.remove("list-group-item-darker");

                    this.editTaskBtn.show();
                    this.removeTaskBtn.show();
                }
            })
        }

        //Preselect an item based on the selectedTaskIndex
        if (this.selectedTaskIndex >= 0) {
            taskListItems[this.selectedTaskIndex].classList.add("active", "list-group-item");
            taskListItems[this.selectedTaskIndex].classList.remove("list-group-item-darker");
        }

        //Save task data to persistent
        ipcRenderer.send(LocalStorageOperation.Save, {identifier: this.tasksIdentifier, data: this.tasks});
        //Send POST to server
        if (sendServerPost)
            ipcRenderer.send(NetworkOperation.Send, {requestType: RequestType.Post, identifiers: [this.tasksIdentifier], data: this.tasks});
    }
}