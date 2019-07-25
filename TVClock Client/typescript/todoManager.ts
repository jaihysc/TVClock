//Renderer
//Manager for tasks view

import { ipcRenderer } from "electron";
import {RequestType, NetworkOperation, LocalStorageOperation} from "./RequestTypes";
import {IViewController} from "./viewManager";
import {StringTags, ViewCommon} from "./ViewCommon";

//A task in the task list
class Task {
    text = "";
    startDate = new Date();
    endDate = new Date();

    constructor(text: string, startDate: Date, endDate: Date) {
        this.text = text;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}

export class TodoViewManager implements IViewController {
    taskListTasks: Task[] = []; //Collection of tasks
    selectedTaskIndex = -1; //Index of current selected active task
    inEditMode = false; //Keep track of whether the edit button is in use or not

    taskList = $(`#active-tasks-list`);

    addButton = $(`#add-task-btn`);
    editButton = $(`#edit-task-btn`);
    removeButton = $(`#remove-task-btn`);

    newTaskText = $(`#new-task-text`);
    newTaskStartDate = $(`#new-task-start-date`);
    newTaskEndDate = $(`#new-task-end-date`);
    taskErrorText = $(`#new-task-text-error`);


    tasksIdentifier = "todo-view-tasks"; //Identifier for tasks in persistence storage
    serverFetchIdentifier = "todo-view-fetchedFromServer";

    initialize(): void {
        this.taskList = $("#active-tasks-list");

        this.addButton = $("#add-task-btn");
        this.editButton = $("#edit-task-btn");
        this.removeButton = $("#remove-task-btn");

        this.newTaskText = $("#new-task-text");
        this.newTaskStartDate = $("#new-task-start-date");
        this.newTaskEndDate = $("#new-task-end-date");
        this.taskErrorText = $("#new-task-text-error");
    }

    preload(): void {
        //When the user hits the refresh button
        ipcRenderer.on(NetworkOperation.Reconnect, () => {
            //Refetch from server by setting the serverFetchIdentifier to undefined
            ipcRenderer.sendSync(LocalStorageOperation.Save, {identifier: this.serverFetchIdentifier, data: undefined});

            //Refresh the view
            $( ".nav-item a" )[0].click();
        });

        //Networking Update request handler
        ipcRenderer.on(this.tasksIdentifier + StringTags.NetworkingUpdateEvent, (event: any, data: string) => {
            this.updateTasks(JSON.parse(data), false);
        });

        //Adds a new task to the task list
        this.addButton.on("click", () => {
            let taskText = String(this.newTaskText.val());

            //Show error text if task does not have a name
            if (taskText == "") {
                this.taskErrorText.show();
                return;
            }
            this.taskErrorText.hide();

            //If date boxes are empty, use placeholder date
            let startDate = String(this.newTaskStartDate.val());
            if (startDate == "")
                startDate = String(this.newTaskStartDate.attr("placeholder"));

            let endDate = String(this.newTaskEndDate.val());
            if (endDate == "")
                endDate = String(this.newTaskEndDate.attr("placeholder"));

            //Creates a new task object with the user provided info
            let newTask = new Task(taskText, new Date(startDate), new Date(endDate));

            //Instead of adding a new task, overwrite if the user is in edit mode
            if (this.inEditMode) {
                this.taskListTasks[this.selectedTaskIndex] = newTask; //Overwrite when editing
                this.editButton.trigger("click"); //Exit edit mode by clicking the edit button
            } else {
                this.taskListTasks.push(newTask);
            }
            this.wipeInputFields();
            //Refresh task list to include changes
            this.updateTaskList(true);
        });

        //Edit and remove button functionality
        this.editButton.on("click", () => {
            if (this.inEditMode)
                this.exitEditMode();
            else
                this.enterEditMode();
        });

        this.removeButton.on("click", () => {
            ViewCommon.removeArrayItemAtIndex(this.taskListTasks, this.selectedTaskIndex);

            //If there are no more tasks in the list, do not select anything
            if (this.taskListTasks.length == 0) {
                this.selectedTaskIndex = -1;
                this.hideModifierButtons();
            } else if (this.selectedTaskIndex >= this.taskListTasks.length) {
                //Select the second last task if deleting the last task in the array
                this.selectedTaskIndex -= 1;
            }

            this.updateTaskList(true);
        });
    }

    load(): void {
        $(() => {
            //Hide edit and remove buttons + error text by default
            this.hideModifierButtons();
            this.taskErrorText.hide();

            //Set placeholder start date to current time, and end date to 2 days in the future
            let currentDate = new Date();
            this.newTaskStartDate.attr("placeholder", TodoViewManager.toFullDateString(currentDate));

            currentDate.setDate(currentDate.getDate()+2); //add 2 days for the future end date
            this.newTaskEndDate.attr("placeholder", currentDate.toDateString());

            //Fetch from the server or use local data depending on whether it has already fetched from the server or not
            if (ipcRenderer.sendSync(LocalStorageOperation.Fetch, this.serverFetchIdentifier) == undefined) {
                //Send fetch request to server
                let jsonData = ipcRenderer.sendSync(NetworkOperation.Send, {requestType: RequestType.Get, identifiers: [this.tasksIdentifier]});
                this.updateTasks(JSON.parse(jsonData.data[0]), false);

                //Save that a fetch has already been performed to the server
                ipcRenderer.send(LocalStorageOperation.Save, {identifier: this.serverFetchIdentifier, data: true});
            } else {
                //Retrieve back stored data from localstorage
                this.updateTasks(ipcRenderer.sendSync(LocalStorageOperation.Fetch, this.tasksIdentifier), false);
            }
        });
    }

    private updateTasks(data: any[], sendServerPost: boolean) {
        this.taskListTasks = []; //Clear tasks first
        if (data != undefined) {
            for (let i = 0; i < data.length; ++i) {
                //Reconvert date text into date
                this.taskListTasks.push(new Task(data[i].text, new Date(data[i].startDate), new Date(data[i].endDate)));
            }
        }
        //Updates the appearance of the task list with the new data
        this.updateTaskList(sendServerPost);
    }

    private wipeInputFields() {
        this.newTaskText.val("");
        this.newTaskStartDate.val("");
        this.newTaskEndDate.val("");
    }

    private static toFullDateString(date: Date) {
        return `${date.toDateString()} ${date.getHours()}:${date.getMinutes()}`;
    }

    //Injects html into the list for elements to appear on screen, saves task data to persistent
    private updateTaskList(sendServerPost: boolean) {
        this.taskList.html(""); //Clear old contents

        //Inject each task into the html after sanitizing it
        for (let i = 0; i < this.taskListTasks.length; ++i) {
            let pTag = $("<p class='list-item-description'/>")
                .text(this.taskListTasks[i].startDate + " - " + this.taskListTasks[i].endDate);

            $("<li class='list-group-item-darker list-group-flush task-list-item'>")
                .text(this.taskListTasks[i].text)
                .append(pTag)
                .appendTo(this.taskList);
        }

        //Create event handlers for each task so it can be set active
        let taskListTasksHtml = $(".task-list-item");
        for (let i = 0; i < taskListTasksHtml.length; ++i) {
            taskListTasksHtml[i].addEventListener("click", () => {
                this.exitEditMode();
                //Deselect last clicked task
                if (this.selectedTaskIndex >= 0)
                    ViewCommon.deselectListItem(taskListTasksHtml, this.selectedTaskIndex);

                //If clicking the same item, hide edit buttons, selectedTaskIndex is -1 as nothing is selected
                if (this.selectedTaskIndex == i) {
                    this.selectedTaskIndex = -1;
                    this.hideModifierButtons();
                } else {
                    //Not clicking same item, select the item and show buttons
                    this.selectedTaskIndex = i;
                    ViewCommon.selectListItem(taskListTasksHtml, i);
                    this.showModifierButtons();
                }
            })
        }
        //Preselect selectedTaskIndex
        if (this.selectedTaskIndex >= 0)
            ViewCommon.selectListItem(taskListTasksHtml, this.selectedTaskIndex);

        //Save task data to local storage
        ipcRenderer.send(LocalStorageOperation.Save, {identifier: this.tasksIdentifier, data: this.taskListTasks});
        //Send POST to server
        if (sendServerPost)
            ipcRenderer.send(NetworkOperation.Send, {requestType: RequestType.Post, identifiers: [this.tasksIdentifier], data: this.taskListTasks});
    }

    //Shows/Hides the edit + remove buttons
    private showModifierButtons() {
        this.editButton.show();
        this.removeButton.show();
    }
    private hideModifierButtons() {
        this.editButton.hide();
        this.removeButton.hide();
    }

    //Toggles the edit modes
    private exitEditMode() {
        if (!this.inEditMode)
            return;
        this.inEditMode = false;
        this.addButton.html("Add task");
        this.editButton.html("Edit task");
        this.removeButton.show();

        this.wipeInputFields();
    }
    private enterEditMode() {
        if (this.inEditMode)
            return;
        //Rename add task button to update task
        this.inEditMode = true;
        this.addButton.html("Update task");
        this.editButton.html("Cancel");
        this.removeButton.hide();

        //Load data from the selected task item into fields
        this.newTaskText.val(this.taskListTasks[this.selectedTaskIndex].text);
        this.newTaskStartDate.val(TodoViewManager.toFullDateString(this.taskListTasks[this.selectedTaskIndex].startDate));
        this.newTaskEndDate.val(TodoViewManager.toFullDateString(this.taskListTasks[this.selectedTaskIndex].endDate));
    }
}