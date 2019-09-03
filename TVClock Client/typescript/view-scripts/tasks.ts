//Renderer
//Manager for tasks view

import {ipcRenderer} from "electron";
import {NetworkOperation, RequestType} from "../RequestTypes";
import {IViewController, ViewManager} from "../viewManager";
import {StringTags, ViewCommon} from "../ViewCommon";
import {DataActionItem, NetworkingFunctions} from "../NetworkingFunctions";
import {DataAction} from "../NetworkManager";
import {DataActionFunctions} from "../DataActionFunctions";
import {Identifiers} from "../Identifiers";

//A task in the task list
class Task implements DataActionItem {
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
    viewIndex = 0;

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

    initialize(): void {
        //When the user hits the refresh button
        ipcRenderer.on(NetworkOperation.Reconnect, () => {
            // Reinitialize the view
            this.selectedTaskIndex = -1;

            // Reload the view
            if (ViewManager.currentViewIndex == this.viewIndex)
                $( ".nav-item a" )[this.viewIndex].click();
        });

        //Networking Update request handler
        ipcRenderer.on(Identifiers.tasksIdentifier + StringTags.NetworkingUpdateEvent, (event: any, dataActionPackets: any[]) => {
            let tasks: Task[]  = DataActionFunctions.handleDataActionPacket(dataActionPackets, this.taskListTasks) as Task[];
            for (let task of tasks) {
                task.startDate = new Date(task.startDate);
                task.endDate = new Date(task.endDate);
            }

            // Decrement selectedTaskIndex if deleted item was the last element in array
            if (this.selectedTaskIndex >= this.taskListTasks.length)
                this.selectedTaskIndex = this.taskListTasks.length - 1;

            if (ViewManager.currentViewIndex == this.viewIndex)
                this.updateTaskList();
        });
    }

    fetchDataFromServer(): void {
        // Fetch and store data from server to localstorage
        let returnJsonArray: string[] = ipcRenderer.sendSync(NetworkOperation.Send, {requestType: RequestType.Get, identifiers: [Identifiers.tasksIdentifier]});

        // Response should be the first element within the response data array
        let retrievedTasks = JSON.parse(returnJsonArray[0]);
        if (retrievedTasks == undefined)
            return;

        this.taskListTasks = []; //Clear tasks first
        for (let task of retrievedTasks) {
            //Reconvert date text into date
            this.taskListTasks.push(new Task(task.text, new Date(task.startDate), new Date(task.endDate), task.priority, task.hash));
        }
    }

    preload(): void {
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

    loadEvent(): void {
        //Adds a new task to the task list
        this.addButton.on("click", () => {
            this.taskErrorText.hide();

            let newTask = this.validateNewTask();
            if (newTask == undefined)
                return;

            //Instead of adding a new task, overwrite if the user is in edit mode
            if (this.inEditMode) {
                // Edit mode

                this.taskListTasks[this.selectedTaskIndex] = newTask; //Overwrite old task
                // Override task on server
                NetworkingFunctions.sendDataActionPacket(
                    DataAction.Edit,
                    Identifiers.tasksIdentifier,
                    newTask.hash,
                    newTask
                );
                this.editButton.trigger("click"); //Exit edit mode by clicking the edit button
            } else {
                // Add mode

                this.taskListTasks.push(newTask);
                // Add newly created task to server
                NetworkingFunctions.sendDataActionPacket(
                    DataAction.Add,
                    Identifiers.tasksIdentifier,
                    newTask.hash,
                    newTask
                );
            }
            this.resetInputFields();

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
                Identifiers.tasksIdentifier,
                task.hash,
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

        // Handles keypress events, checks if it is the enter key, if so, it counts as a addButton click
        document.onkeyup = (event: any) => {
            if (event.keyCode === 13)  // Enter key
                this.addButton.trigger("click");
        }
    }

    load(): void {
        $(() => {
            //Hide edit and remove buttons + error text by default
            this.hideModifierButtons();
            this.taskErrorText.hide();

            // Sets placeholder dates + Datetime pickers
            // @ts-ignore
            this.newTaskStartDate.datetimepicker({format: "ddd MMM D YYYY h:mm A"});
            // @ts-ignore
            this.newTaskEndDate.datetimepicker({format: "ddd MMM D YYYY h:mm A"});
            this.resetInputFields();

            // Update task list appearance with new data
            this.updateTaskList();
        });
    }

    // Ensures that the task matches input requirements, dates are current, priority is greater than 0
    // Hash will be auto generated if hash property is undefined
    private validateNewTask(): Task | undefined {
        let taskText = String(this.newTaskText.val());

        let startDate = new Date(String(this.newTaskStartDate.val()));
        let endDate = new Date(String(this.newTaskEndDate.val()));

        let priority = Number(this.newTaskPriority.val());
        if (!priority)
            priority = Number(this.newTaskPriority.attr("placeholder"));  // Default priority to placeholder if user does not specify

        //Show error text if task is blank or only whitespace
        if (!taskText.replace(/\s/g, "").length) {
            this.showErrorMessage("Enter a task name");
            this.resetInputFields();
            return;
        } else {
            // Trim any newline characters if taskText is not only whitespace
            taskText = taskText.replace(/\r?\n|\r/, "")
        }

        let currentDate = new Date();
        currentDate.setDate(currentDate.getDate()-1); // Allow a margin 1 day back

        // Validate priority number
        if (priority < 0) {
            this.showErrorMessage("Priority must be greater than or equal to 0");
            return;
        } else if (priority > 100000) {
            this.showErrorMessage("Priority must be less than 100 000");
            return;
        }

        //Make sure startDay is current and endDate is after startDate
        if (startDate < currentDate) {
            this.showErrorMessage("Start date cannot be in the past");
            return;
        } else if (startDate > endDate) {
            this.showErrorMessage("End date must be after start date");
            return;
        } else {
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

    //Injects html into the list for elements to appear on screen, saves task data to persistent
    private updateTaskList(): void {
        this.taskListHtml.html(""); //Clear old contents

        // Copy of server's task sorting
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
                    // @ts-ignore - moment is moment.js, imported by index.html
                    .text(moment(task.startDate).format("dddd MMMM D YYYY h:mm A") + " - " + moment(task.endDate).format("dddd MMMM D YYYY h:mm A"));

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
    }


    //Shows/Hides the edit + remove buttons
    private showModifierButtons(): void {
        this.editButton.show();
        this.removeButton.show();
    }
    private hideModifierButtons(): void {
        this.editButton.hide();
        this.removeButton.hide();
    }


    //Toggles the edit modes
    private exitEditMode(): void {
        if (!this.inEditMode)
            return;
        this.inEditMode = false;
        this.addButton.html("Add task");
        this.editButton.html("Edit task");
        this.removeButton.show();

        this.resetInputFields();
    }
    private enterEditMode(): void {
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
        this.newTaskStartDate.val(this.toFullDateString(task.startDate));
        this.newTaskEndDate.val(this.toFullDateString(task.endDate));
        this.newTaskPriority.val(task.priority);
    }

    private showErrorMessage(message: string) {
        this.taskErrorText.show();
        this.taskErrorText.text(message);
    }

    private toFullDateString(date: Date): string {
        // @ts-ignore - Imported by moment.js
        return moment(date).format( "ddd MMM D YYYY h:mm A");
    }

    private resetInputFields(): void {
        // Clear fields
        this.newTaskText.val("");
        this.newTaskStartDate.val("");
        this.newTaskEndDate.val("");
        // this.newTaskPriority.val();  // Don't wipe priority field

        // Set placeholder start date to current time, and end date to 7 days in the future
        let currentDate = new Date();
        let previousDate = new Date();
        previousDate.setDate(previousDate.getDate() - 1);  // minDate is set to previous date, user cannot select select anything in the past

        // @ts-ignore
        this.newTaskStartDate.datetimepicker("minDate", previousDate);
        // @ts-ignore
        this.newTaskStartDate.datetimepicker("date", currentDate);

        let endDate = new Date();
        endDate.setDate(currentDate.getDate() + 7); //add 7 days for the future end date
        // @ts-ignore
        this.newTaskEndDate.datetimepicker("minDate", previousDate);
        // @ts-ignore
        this.newTaskEndDate.datetimepicker("date", endDate);
    }
}