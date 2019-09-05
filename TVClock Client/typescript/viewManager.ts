//Renderer
//Manages the switching between the different views

import {CssClasses} from "./ViewCommon";
import {TodoViewManager} from "./view-scripts/tasks";
import {ScheduleViewManager} from "./view-scripts/schedule";
import {SettingViewManager} from "./view-scripts/settings";

export interface IViewController {
    viewIndex: number;

    // Fetch view dependent data from server
    fetchDataFromServer(): void;

    // Initialize ipcRenderer event handlers
    initialize(): void;

    // Load JQuery selectors
    preload(): void

    // Load view dependent event handlers
    loadEvent(): void;

    // Document ready operations
    load(): void;
}

const viewControllers: IViewController[] = [new TodoViewManager(), new ScheduleViewManager(), new SettingViewManager()]; // !! Add view controllers here !!

const viewPath = __dirname + "/views/";

// Renderer
export class ViewManager {
    public static currentViewIndex = 0;

    // Calls the fetchDataFromServer method all the views
    // Calls onCompletion once complete
    public static initializeViewData(onCompletion: () => void): void {
        for (let viewController of viewControllers) {
            viewController.fetchDataFromServer();
        }
        onCompletion();
    }

    // Sets up event handlers for navbar buttons to switch between different views
    public static initializeViews(): void {
        // Calls initialize method on all the views, which initializes IPCRenderer event handlers
        for (let viewController of viewControllers) {
            viewController.initialize();
        }


        //Read and store the view html files in alphanumeric order
        let fs = require("fs");
        let files = fs.readdirSync(viewPath);
        files.sort();

        let viewHtml: string[] = [];  // Hold all the views for each button of navbar in order + their controllers to execute
        for (let i = 0; i < files.length; ++i) {
            let contents = fs.readFileSync(viewPath + files[i]).toString();
            viewHtml.push(contents)
        }

        // Buttons for the different views
        let buttonContainers = $( ".nav-item" );
        let lastButton = buttonContainers[0];

        // Add listeners on all the buttonContainers to load their corresponding view
        for (let i = 0; i < buttonContainers.length; ++i) {
            buttonContainers[i].addEventListener("click", () => {
                this.currentViewIndex = i;

                //Make last button inactive
                lastButton.classList.remove(CssClasses.NavbarActive);
                lastButton = buttonContainers[i];

                //Make current button active
                buttonContainers[i].classList.add(CssClasses.NavbarActive);

                //Inject view html into index.html #view-container
                $("#view-container").html(viewHtml[i]);

                //Load the corresponding viewController
                viewControllers[i].preload();
                viewControllers[i].loadEvent();
                viewControllers[i].load();
            });
        }

        // Load the settings view on startup
        buttonContainers[2].click();
    }
}