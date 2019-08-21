//Renderer
//Manager for tasks view

import {ipcRenderer} from "electron";
import {LocalStorageOperation, NetworkOperation, RequestType} from "./RequestTypes";
import {IViewController} from "./viewManager";
import {StringTags, ViewCommon} from "./ViewCommon";
import {DataActionItem, NetworkingFunctions} from "./NetworkingFunctions";
import {DataAction} from "./NetworkManager";

//A task in the task list
class Task implements DataActionItem{
    text = "";
    startDate = new Date();
    endDate = new Date();
    priority: number;
    hash: string;

    constructor(text: string, startDate: Date, endDate: Date, priority: number, hash: string) {
        this.text = text;
        this.startDate = startDate;
        this.endDate = endDate;
        this.priority = priority;
        this.hash = hash;
    }
}

export class TodoViewManager implements IViewController {
    taskListTasks: Task[] = []; //Collection of tasks
    selectedTaskIndex = -1; //Index of current selected active task
    inEditMode = false; //Keep track of whether the edit button is in use or not

    taskListHtml!: JQuery<HTMLElement>;

    addButton!: JQuery<HTMLElement>;
    editButton!: JQuery<HTMLElement>;
    removeButton!: JQuery<HTMLElement>;

    newTaskText!: JQuery<HTMLElement>;
    newTaskStartDate!: JQuery<HTMLElement>;
    newTaskEndDate!: JQuery<HTMLElement>;
    newTaskPriority!: JQuery<HTMLElement>;
    taskErrorText!: JQuery<HTMLElement>;


    tasksIdentifier = "todo-view-tasks"; //Identifier for tasks in persistence storage
    serverFetchIdentifier = "todo-view-fetchedFromServer";

    initialize(): void {
        this.taskListHtml = $("#active-tasks-list");

        this.addButton = $("#add-task-btn");
        this.editButton = $("#edit-task-btn");
        this.removeButton = $("#remove-task-btn");

        this.newTaskText = $("#new-task-text");
        this.newTaskStartDate = $("#new-task-start-date");
        this.newTaskEndDate = $("#new-task-end-date");
        this.newTaskPriority = $("#new-task-priority");
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
        ipcRenderer.on(this.tasksIdentifier + StringTags.NetworkingUpdateEvent, (event: any, data: any[]) => {
            this.updateTasks(data);
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

            this.updatePlaceholderDates();
            let startDate = String(this.newTaskStartDate.val());
            let endDate = String(this.newTaskEndDate.val());

            let priority = Number(this.newTaskPriority.val());
            if (!priority)
                priority = Number(this.newTaskPriority.attr("placeholder"));  // Default priority to placeholder if user does not specify

            let newTask = this.validateNewTask(taskText, {start: startDate, end: endDate}, priority);
            if (newTask == undefined)
                return;

            //Instead of adding a new task, overwrite if the user is in edit mode
            if (this.inEditMode) {
                // Edit mode

                this.taskListTasks[this.selectedTaskIndex] = newTask; //Overwrite old task
                // Override task on server
                NetworkingFunctions.sendDataActionPacket(
                    DataAction.Edit,
                    newTask.hash,
                    [this.tasksIdentifier],
                    newTask
                );
                this.editButton.trigger("click"); //Exit edit mode by clicking the edit button
            } else {
                // Add mode

                this.taskListTasks.push(newTask);
                // Add newly created task to server
                NetworkingFunctions.sendDataActionPacket(
                    DataAction.Add,
                    newTask.hash,
                    [this.tasksIdentifier],
                    newTask
                );
            }

            this.wipeInputFields();
            //Refresh task list to include changes
            this.updateTaskList();
        });

        //Edit and remove button functionality
        this.editButton.on("click", () => {
            if (this.inEditMode)
                this.exitEditMode();
            else
                this.enterEditMode();
        });

        this.removeButton.on("click", () => {
            let task = this.taskListTasks[this.selectedTaskIndex];
            NetworkingFunctions.sendDataActionPacket(
                DataAction.Remove,
                task.hash,
                [this.tasksIdentifier],
                task
            );

            ViewCommon.removeArrayItemAtIndex(this.taskListTasks, this.selectedTaskIndex);

            //If there are no more tasks in the list, do not select anything
            if (this.taskListTasks.length == 0) {
                this.selectedTaskIndex = -1;
                this.hideModifierButtons();
            } else if (this.selectedTaskIndex >= this.taskListTasks.length) {
                //Select the second last task if deleting the last task in the array
                this.selectedTaskIndex -= 1;
            }

            this.updateTaskList();
        });
    }

    load(): void {
        $(() => {
            //Hide edit and remove buttons + error text by default
            this.hideModifierButtons();
            this.taskErrorText.hide();

            this.updatePlaceholderDates();

            //Fetch from the server or use local data depending on whether it has already fetched from the server or not
            if (ipcRenderer.sendSync(LocalStorageOperation.Fetch, this.serverFetchIdentifier) == undefined) {
                //Send fetch request to server
                let jsonData = ipcRenderer.sendSync(NetworkOperation.Send, {requestType: RequestType.Get, identifiers: [this.tasksIdentifier]});
                this.updateTasks(JSON.parse(jsonData.data)[0]);

                //Save that a fetch has already been performed to the server
                ipcRenderer.send(LocalStorageOperation.Save, {identifier: this.serverFetchIdentifier, data: true});
            } else {
                //Retrieve back stored data from localstorage
                this.updateTasks(ipcRenderer.sendSync(LocalStorageOperation.Fetch, this.tasksIdentifier));
            }
        });
    }

    private updateTasks(data: Task[]) {
        this.taskListTasks = []; //Clear tasks first
        if (data != undefined) {
            for (let i = 0; i < data.length; ++i) {
                if (data[i] == undefined)
                    continue;
                //Reconvert date text into date
                this.taskListTasks.push(new Task(data[i].text, new Date(data[i].startDate), new Date(data[i].endDate), data[i].priority, data[i].hash));
            }
        }
        //Updates the appearance of the task list with the new data
        this.updateTaskList();
    }

    private wipeInputFields() {
        this.newTaskText.val("");
        this.newTaskStartDate.val("");
        this.newTaskEndDate.val("");
        // this.newTaskPriority.val();  // Don't wipe priority
    }

    private static toFullDateString(date: Date) {
        return `${date.toDateString()} ${date.getHours()}:${date.getMinutes()}`;
    }

    //Injects html into the list for elements to appear on screen, saves task data to persistent
    private updateTaskList() {
        this.taskListHtml.html(""); //Clear old contents

        // Sorting tasks by priority ------------------------------------------------
        // Group by priority, then sort by task end date
        let taskPriorityGroups: Task[][] = [];  // Priority corresponds to array index
        for (let task of this.taskListTasks) {
            // Initialize array if empty
            if (!taskPriorityGroups[task.priority]) {
                taskPriorityGroups[task.priority] = [];
            }
            taskPriorityGroups[task.priority].push(task);
        }
        // Sort by task end date in each priority array entry
        for (let taskPriorityGroup of taskPriorityGroups) {
            if (taskPriorityGroup == undefined)
                continue;

            let length = taskPriorityGroup.length;
            // Bubble sort for simplicity and the low number of items which will need to be sorted
            for (let i = 0; i < length-1; i++)
                for (let j = 0; j < length-i-1; j++)
                    if (taskPriorityGroup[j].endDate > taskPriorityGroup[j+1].endDate) {
                        let temp = taskPriorityGroup[j + 1];
                        taskPriorityGroup[j + 1] = taskPriorityGroup[j];
                        taskPriorityGroup[j] = temp;
                    }
        }
        // Higher priorities show up first
        taskPriorityGroups.reverse();

        // Add back to this.taskListTasks
        this.taskListTasks = [];
            for (let taskPriorityGroup of taskPriorityGroups) {
                if (taskPriorityGroup == undefined)
                    continue;

                for (let task of taskPriorityGroup) {
                    this.taskListTasks.push(task);
            }
        }
        console.log(this.taskListTasks);

        // ------------------------------------------------
        // Inject each task into the html after sanitizing it
        for (let taskPriorityGroup of taskPriorityGroups) {
            if (taskPriorityGroup == undefined)
                continue;

            for (let task of taskPriorityGroup) {
                let taskPriority = $("<span class='font-weight-bold lead'/>")
                    .text(task.priority + "  ");
                let taskName = $("<span/>")
                    .text(task.text);
                let div = $("<div/>")
                    .append(taskPriority)
                    .append(taskName);

                let startEndDate = $("<p class='list-item-description'/>")
                    .text(task.startDate + " - " + task.endDate);

                $("<li class='list-group-item-darker list-group-flush task-list-item'>")
                    .append(div)
                    .append(startEndDate)
                    .appendTo(this.taskListHtml);
            }
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

        // Todo, this function here can no longer sent a POST to servers, call the function in NetworkingFunctions
        // for add, edit, remove
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
        let task = this.taskListTasks[this.selectedTaskIndex];
        this.newTaskText.val(task.text);
        this.newTaskStartDate.val(TodoViewManager.toFullDateString(task.startDate));
        this.newTaskEndDate.val(TodoViewManager.toFullDateString(task.endDate));
        this.newTaskPriority.val(task.priority);
    }

    private updatePlaceholderDates() {
        //Set placeholder start date to current time, and end date to 2 days in the future
        let currentDate = new Date();
        this.newTaskStartDate.attr("placeholder", TodoViewManager.toFullDateString(currentDate));

        currentDate.setDate(currentDate.getDate()+2); //add 2 days for the future end date
        this.newTaskEndDate.attr("placeholder", TodoViewManager.toFullDateString(currentDate));
    }

    // Ensures that the task matches input requirements, dates are current, priority is greater than 0
    // Hash will be auto generated if hash property is undefined
    private validateNewTask(taskText: string, dates: {start: String; end: String}, priority: number) {
        if (dates.start == "")
            dates.start = String(this.newTaskStartDate.attr("placeholder"));
        if (dates.end == "")
            dates.end = String(this.newTaskEndDate.attr("placeholder"));

        let startDate = new Date(String(dates.start));
        let endDate = new Date(String(dates.end));

        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate()-1); //Allow a margin 1 day back

        // Validate priority number
        if (priority < 0) {
            this.taskErrorText.show();
            this.taskErrorText.text("Priority must be greater than or equal to 0");
            return;
        } else if (priority > 100000) {
            this.taskErrorText.show();
            this.taskErrorText.text("Priority must less than 100 000");
            return;
        }

        //Make sure startDay is current and endDate is after startDate
        if (startDate >= currentDate && startDate < endDate) {
            //Creates a new task object with the user provided info

            // Hash is unique identifier made from UNIX timestamp + taskText
            let hash: string;
            if (this.inEditMode)  // Do not generate a new hash if in edit move
                hash = this.taskListTasks[this.selectedTaskIndex].hash;
            else
                hash = NetworkingFunctions.createHash(new Date().getTime() + taskText);
            return new Task(taskText, new Date(startDate), new Date(endDate), priority, hash);
        }
    }
}